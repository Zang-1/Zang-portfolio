/* =========================================================
   3D SHOWROOM
   Loaded by script.js the first time someone opens the 3D view, so three.js
   never touches the page until it is asked for.
   This is a classic script, not a module, on purpose: browsers refuse to load
   a local module when index.html is opened straight from disk (file://), but
   they will run a classic script, and three.js still comes in through the
   import map from the CDN, which allows it.
   Every model is built from primitives below. Units are metres, +y is up,
   vehicles face +x and people face +z.
   ========================================================= */
(function () {
    'use strict';

    // filled in by mount() once three.js has been fetched
    let THREE, OrbitControls, RoomEnvironment, UP, M;

    /* Drop a .glb into assets/3d/ and point the matching url at it to swap a
       hand-built model for a real one. It is scaled to the size given and stood on
       the floor, so an export from Meshy, Tripo or Sketchfab works as it is.
       `turn` (radians) fixes a model that was exported facing another way. */
    const MODELS = {
        me: { url: null, height: 1.8, turn: 0 },
        bike: { url: null, length: 1.95, turn: 0 },
        car: { url: null, length: 4.68, turn: 0 },
    };

    const CAR_PAINT = '#e6e4df';

    /* where everything stands on the turntable, and which way it faces */
    const PLACE = {
        me: { x: -.15, z: 1.15, turn: .35 },
        bike: { x: -2.1, z: .2, turn: .2 },
        car: { x: 2.3, z: -1.0, turn: -2.03 },
    };

    /* ---------- helpers ---------- */
    const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

    const std = (color, roughness = .5, metalness = 0, extra = {}) =>
        new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
    const glow = (color, intensity = 2.5) =>
        new THREE.MeshStandardMaterial({ color: '#000', emissive: color, emissiveIntensity: intensity });

    const sharedMaterials = () => ({
        tyre: std('#141414', .85),
        black: std('#121212', .3, .2),
        matte: std('#1b1b1c', .75),
        chrome: std('#d8d8d8', .12, 1),
        steel: std('#9a9a9a', .3, .9),
        glass: std('#12171c', .05, .6),
    });

    function mesh(geo, mat, parent, pos, rot, scale) {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = m.receiveShadow = true;
        if (pos) m.position.set(...pos);
        if (rot) m.rotation.set(...rot);
        if (scale) typeof scale === 'number' ? m.scale.setScalar(scale) : m.scale.set(...scale);
        parent.add(m);
        return m;
    }

    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

    /* a side profile pushed out into a slab. Points are [x, y] for a straight
       edge or [cx, cy, x, y] for a curve; a THREE.Shape is taken as it is. */
    function slab(points, depth, bevel = .03) {
        let s = points;
        if (Array.isArray(points)) {
            s = new THREE.Shape();
            points.forEach((p, i) => {
                if (i === 0) s.moveTo(p[0], p[1]);
                else if (p.length === 4) s.quadraticCurveTo(...p);
                else s.lineTo(p[0], p[1]);
            });
        }
        const g = new THREE.ExtrudeGeometry(s, {
            depth, curveSegments: 20,
            bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4,
        });
        g.translate(0, 0, -depth / 2);
        return g;
    }

    /* squeeze a geometry's width (z) by f(x), e.g. to point a nose */
    function taper(geo, f) {
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * f(p.getX(i)));
        geo.computeVertexNormals();
        return geo;
    }

    /* a cylinder (or capsule) running from a to b */
    function rod(a, b, r, mat, parent, rTop = r) {
        const dir = b.clone().sub(a);
        const m = mesh(new THREE.CylinderGeometry(rTop, r, dir.length(), 16), mat, parent);
        m.position.copy(a).addScaledVector(dir, .5);
        m.quaternion.setFromUnitVectors(UP, dir.normalize());
        return m;
    }

    function limb(a, b, r, mat, parent) {
        const dir = b.clone().sub(a);
        const m = mesh(new THREE.CapsuleGeometry(r, dir.length(), 6, 14), mat, parent);
        m.position.copy(a).addScaledVector(dir, .5);
        m.quaternion.setFromUnitVectors(UP, dir.normalize());
        return m;
    }

    /* the spokes sit on the +z face; turn the wheel round for the other side */
    function wheel({ r, tyre, width, rim, rim2 = rim, spokes, spokeW, disc = 0 }) {
        const g = new THREE.Group();
        mesh(new THREE.TorusGeometry(r - tyre / 2, tyre / 2, 18, 56), M.tyre, g, null, null, [1, 1, width / tyre]);

        const rimR = r - tyre * .9;
        const barrel = new THREE.CylinderGeometry(rimR, rimR, width * .8, 40, 1, true);
        mesh(barrel, std('#0d0d0d', .6, .3, { side: THREE.DoubleSide }), g, null, [Math.PI / 2, 0, 0]);
        mesh(new THREE.TorusGeometry(rimR, .012, 8, 48), rim, g, [0, 0, width * .38]);

        const face = width * .3;
        for (let i = 0; i < spokes; i++) {
            const s = mesh(box(rimR, spokeW, width * .18), i % 2 ? rim2 : rim, g, null, [0, 0, (i / spokes) * Math.PI * 2]);
            s.geometry.translate(rimR / 2, 0, face);
        }
        mesh(new THREE.CylinderGeometry(rimR * .2, rimR * .2, width * .9, 20), rim, g, null, [Math.PI / 2, 0, 0]);
        if (disc) mesh(new THREE.CylinderGeometry(disc, disc, .008, 40), M.steel, g, [0, 0, -width * .5], [Math.PI / 2, 0, 0]);
        return g;
    }

    /* a printed label: number plates, badges */
    function label(text, { w = 512, h = 128, bg = '#f4f4f0', fg = '#111', size = 70 } = {}) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const x = c.getContext('2d');
        if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
        x.fillStyle = fg;
        x.font = `700 ${size}px "Space Grotesk", "Inter", sans-serif`;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText(text, w / 2, h / 2 + 4);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
    }

    /* ---------- HONDA WINNER X ----------
       Black cowl and tank, warm gunmetal side fairings and tail, gold forks,
       black ten-spoke rims, the blue LED face, and the crate on the tunnel. */
    function buildBike() {
        const g = new THREE.Group();
        const gunmetal = std('#56524a', .35, .7);
        const gloss = std('#0e0e10', .18, .35);
        const gold = std('#c9a033', .25, .9);

        const front = wheel({ r: .3, tyre: .075, width: .09, rim: M.black, spokes: 10, spokeW: .018, disc: .13 });
        front.position.set(.66, .3, 0);
        const rear = wheel({ r: .3, tyre: .085, width: .12, rim: M.black, spokes: 10, spokeW: .018, disc: .1 });
        rear.position.set(-.62, .3, 0);
        g.add(front, rear);
        mesh(box(.06, .07, .04), gold, g, [.6, .38, -.06]);

        // gold upside-down forks, raked back to the triple clamp
        for (const z of [-.065, .065]) rod(V(.66, .3, z), V(.47, .95, z), .02, gold, g, .026);
        rod(V(.47, .93, -.08), V(.47, .93, .08), .03, M.black, g);

        // fenders
        mesh(new THREE.TorusGeometry(.34, .03, 8, 24, Math.PI * .55), gloss, g, [.66, .3, 0], [0, 0, Math.PI * .3], [1, 1, 1.7]);
        mesh(new THREE.TorusGeometry(.35, .025, 8, 24, Math.PI * .3), M.black, g, [-.62, .3, 0], [0, 0, Math.PI * .45], [1, 1, 2.4]);

        // gloss black front cowl, narrowing to a point with the headlight at its tip
        const nose = x => 1 - .6 * THREE.MathUtils.clamp((x - .3) / .36, 0, 1);
        mesh(taper(slab([[.66, .84], [.52, .98], [.42, 1.02], [.36, .86], [.3, .72], [.32, .58], [.45, .55], [.56, .66]], .28, .03), nose), gloss, g);
        // spine over the frame, between the cowl and the seat
        mesh(slab([[.34, .74], [.05, .8], [-.05, .84], [-.05, .66], [.32, .6]], .18, .03), gloss, g);
        // the big angular gunmetal side fairings
        for (const z of [-.17, .17]) {
            const panel = slab([[.62, .8], [.5, .85], [.36, .8], [.22, .68], [0, .62], [-.05, .5], [.1, .42], [.32, .44], [.5, .58]], .03, .012);
            mesh(taper(panel.translate(0, 0, z), nose), gunmetal, g);
        }
        // tail, sweeping up to the tip
        mesh(taper(slab([[-.05, .82], [-.3, .84], [-.6, .9], [-.88, .99], [-.86, .93], [-.62, .8], [-.35, .7], [-.05, .66]], .2, .035),
            x => 1 - .5 * THREE.MathUtils.clamp((-x - .3) / .58, 0, 1)), gunmetal, g);
        // seat: rider, then the stepped pillion
        mesh(slab([[.04, .9], [-.02, .95], [-.3, .93], [-.42, .97], [-.64, 1.01], [-.7, .98], [-.6, .9], [-.35, .86], [.0, .86]], .22, .03), std('#141414', .85), g);
        // the crate on the spine
        mesh(box(.3, .2, .32), std('#151517', .7), g, [.17, .93, 0]);
        mesh(box(.26, .02, .28), std('#0a0a0b', .9), g, [.17, 1.025, 0]);
        // tinted screen
        mesh(slab([[.52, .98], [.46, 1.1], [.42, 1.09], [.44, .99]], .16, .01), std('#1a2026', .05, .3, { transparent: true, opacity: .75 }), g);
        // blue LED headlight, tail light, indicators
        mesh(taper(slab([[.69, .835], [.62, .885], [.58, .87], [.64, .815]], .3, .01), nose), glow('#3d9bff', 1.8), g);
        mesh(box(.04, .04, .14), glow('#ff2a1a', 3), g, [-.88, .955, 0], [0, 0, .5]);
        for (const z of [-.11, .11]) mesh(box(.04, .02, .03), glow('#ffa21a', 1.5), g, [.56, .78, z]);

        // engine, swingarm, shock, chain guard, exhaust
        mesh(box(.34, .26, .22), std('#2a2b2e', .45, .6), g, [.08, .44, 0]);
        mesh(new THREE.CylinderGeometry(.09, .09, .24, 18), std('#2a2b2e', .45, .6), g, [.24, .56, 0], [Math.PI / 2, 0, 0]);
        for (const z of [-.08, .08]) rod(V(-.02, .44, z), V(-.62, .3, z), .02, M.black, g);
        rod(V(-.22, .76, 0), V(-.38, .42, 0), .022, gold, g);
        rod(V(-.05, .42, -.11), V(-.6, .32, -.11), .006, gold, g);
        rod(V(.14, .3, .08), V(-.12, .28, .14), .025, M.steel, g);
        mesh(box(.46, .1, .1), M.matte, g, [-.36, .42, .17], [0, 0, -.42]);
        mesh(box(.3, .02, .11), std('#2c2c2e', .5, .4), g, [-.34, .48, .17], [0, 0, -.42]);

        // bars with bar-end weights, mirrors
        rod(V(.43, 1.03, -.32), V(.43, 1.03, .32), .012, M.black, g);
        for (const s of [-1, 1]) {
            rod(V(.43, 1.03, s * .25), V(.43, 1.03, s * .33), .02, M.matte, g);
            rod(V(.43, 1.03, s * .33), V(.43, 1.03, s * .36), .022, M.steel, g);
            rod(V(.45, 1.04, s * .22), V(.41, 1.2, s * .28), .007, M.black, g);
            mesh(new THREE.SphereGeometry(.05, 16, 10), M.black, g, [.41, 1.22, s * .29], null, [.35, .6, 1]);
        }
        // pegs, plate on its long arm, side stand
        for (const s of [-1, 1]) rod(V(-.05, .36, s * .1), V(-.05, .36, s * .2), .012, M.steel, g);
        rod(V(-.78, .82, 0), V(-.95, .64, 0), .02, M.black, g);
        mesh(box(.012, .12, .2), std('#f1f1ee', .5), g, [-.96, .6, 0], [0, 0, .15]);
        rod(V(-.05, .38, -.12), V(-.12, .02, -.3), .012, M.steel, g);

        g.rotation.x = .07; // resting on the side stand
        return g;
    }

    /* ---------- MITSUBISHI DESTINATOR ----------
       White with the black floating roof, hexagon shield grille, L-shaped DRLs
       over a stack of five, T-shaped tails, chunky black cladding. */
    function buildCar() {
        const g = new THREE.Group();
        const paint = new THREE.MeshPhysicalMaterial({ color: CAR_PAINT, metalness: .3, roughness: .3, clearcoat: 1, clearcoatRoughness: .06 });
        const roof = std('#0d0d0f', .22, .4);
        const trim = std('#18191b', .6, .15);
        const satin = std('#b9bcc0', .3, .8);
        const shield = std('#3b3e43', .25, .85);
        const FX = 1.38, RX = -1.43, WR = .37;

        // body: side profile with the arches cut out
        const s = new THREE.Shape();
        s.moveTo(-2.22, .36);
        s.lineTo(RX - .52, .36);
        s.absarc(RX, .38, .52, Math.PI, 0, true);
        s.lineTo(FX - .52, .36);
        s.absarc(FX, .38, .52, Math.PI, 0, true);
        s.lineTo(2.2, .38);
        s.quadraticCurveTo(2.3, .4, 2.28, .62);
        s.lineTo(2.26, .86);
        s.quadraticCurveTo(2.24, .98, 2.08, 1.0);
        s.lineTo(.86, 1.08);
        s.lineTo(-2.02, 1.1);
        s.quadraticCurveTo(-2.24, 1.1, -2.24, .96);
        s.lineTo(-2.26, .6);
        s.quadraticCurveTo(-2.26, .38, -2.22, .36);
        mesh(slab(s, 1.7, .08), paint, g);

        // blacked-out pillars and glass under a black roof
        mesh(slab([[.86, 1.06], [.12, 1.56], [-.04, 1.6], [-1.86, 1.62], [-2.0, 1.58], [-2.1, 1.12], [-2.1, 1.06]], 1.5, .05), M.glass, g);
        mesh(slab([[.16, 1.6], [-1.9, 1.62], [-1.98, 1.68], [-1.8, 1.7], [.02, 1.68]], 1.52, .04), roof, g);
        for (const z of [-.62, .62]) {
            mesh(box(1.7, .035, .05), M.black, g, [-.9, 1.79, z]);
            for (const x of [-1.65, -.15]) mesh(box(.08, .06, .05), M.black, g, [x, 1.75, z]);
            // louvres on the rear quarter
            for (let i = 0; i < 5; i++) mesh(box(.012, .3, .006), std('#2a2b2e', .4, .5), g, [-1.6 + i * .035, 1.36, z * 1.3]);
        }

        // two-tone wheels, chunky arch cladding, sills
        const rimA = std('#c4c8cc', .25, .85), rimB = std('#141416', .3, .4);
        for (const [x, z, flip] of [[FX, .88, 0], [FX, -.88, 1], [RX, .88, 0], [RX, -.88, 1]]) {
            const w = wheel({ r: WR, tyre: .12, width: .24, rim: rimA, rim2: rimB, spokes: 10, spokeW: .05, disc: .17 });
            w.position.set(x, WR, z);
            if (flip) w.rotation.y = Math.PI;
            g.add(w);
            mesh(new THREE.TorusGeometry(.49, .065, 8, 28, Math.PI), trim, g, [x, .38, Math.sign(z) * .9], null, [1, 1, 1.5]);
        }
        mesh(box(1.72, .14, 1.9), trim, g, [-.02, .35, 0]);
        for (const z of [-.955, .955]) mesh(box(1.4, .025, .01), satin, g, [-.02, .39, z]);

        // bumpers and skid plates
        mesh(box(.24, .26, 1.8), trim, g, [2.23, .47, 0]);
        mesh(box(.06, .05, .9), satin, g, [2.35, .37, 0]);
        mesh(box(.24, .26, 1.8), trim, g, [-2.23, .47, 0]);
        mesh(box(.06, .05, .8), satin, g, [-2.35, .37, 0]);
        for (const z of [-.7, .7]) mesh(box(.02, .03, .22), glow('#a8140c', 1.2), g, [-2.355, .5, z]);

        // front: hexagon shield grille with the three diamonds in the middle
        mesh(box(.04, .4, 1.1), M.black, g, [2.35, .73, 0]);
        const hex = new THREE.TorusGeometry(.075, .012, 4, 6);
        for (const [y, zs] of [[.86, [-.37, -.123, .123, .37]], [.795, [-.247, 0, .247]], [.73, [-.37, -.123, .123, .37]]]) {
            for (const z of zs) mesh(hex, shield, g, [2.375, y, z], [0, Math.PI / 2, 0], [1.45, 1, 1]);
        }
        const badge = new THREE.Group();
        badge.position.set(2.39, .79, 0);
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
            const d = mesh(new THREE.OctahedronGeometry(.03), M.chrome, badge, [0, Math.sin(a) * .03, Math.cos(a) * .03], null, [.4, 1, .55]);
            d.rotation.x = Math.PI / 2 - a;
        }
        g.add(badge);
        for (let i = 0; i < 4; i++) mesh(box(.02, .012, 1.0), std('#3a3c40', .4, .6), g, [2.37, .5 + i * .03, 0]);
        const plate = mesh(new THREE.PlaneGeometry(.44, .1), std('#fff', .5, 0, { map: label('DESTINATOR', { bg: '#0d0d0f', fg: '#f2f2f2', size: 64 }) }), g, [2.362, .43, 0], [0, Math.PI / 2, 0]);
        plate.castShadow = false;

        for (const s2 of [-1, 1]) {
            // DRL along the top, turning down into the stack of five
            mesh(box(.03, .025, .46), glow('#f4f8ff', 4), g, [2.31, .925, s2 * .64]);
            for (let i = 0; i < 5; i++) mesh(box(.03, .016, .08), glow('#f4f8ff', 4), g, [2.355, .87 - i * .035, s2 * .86]);
            mesh(box(.03, .2, .18), M.black, g, [2.345, .78, s2 * .68]);
            for (const y of [.83, .76]) mesh(box(.02, .035, .1), glow('#dfe9ff', 1.4), g, [2.36, y, s2 * .68]);
        }

        // rear: T-shaped tails, model name, plate
        for (const s2 of [-1, 1]) {
            mesh(box(.03, .045, .42), glow('#ff1d12', 3), g, [-2.3, 1.0, s2 * .6]);
            mesh(box(.02, .28, .13), M.black, g, [-2.325, .86, s2 * .85]);
            for (let i = 0; i < 6; i++) mesh(box(.03, .022, .09), glow('#ff1d12', 3), g, [-2.335, .97 - i * .04, s2 * .86]);
        }
        const name = mesh(new THREE.PlaneGeometry(.5, .06), std('#fff', .3, .6, { map: label('DESTINATOR', { bg: null, fg: '#55585c', w: 1024, size: 96 }), transparent: true }), g, [-2.338, .88, 0], [0, -Math.PI / 2, 0]);
        name.castShadow = false;
        mesh(box(.02, .12, .36), std('#f1f1ee', .5), g, [-2.34, .7, 0]);

        // black mirrors, beltline chrome, door shuts and handles
        for (const z of [-1, 1]) {
            mesh(box(.18, .11, .14), roof, g, [.72, 1.17, z * .99]);
            mesh(box(.12, .04, .1), roof, g, [.76, 1.13, z * .92]);
            mesh(box(2.9, .018, .01), M.chrome, g, [-.6, 1.19, z * .805]);
            for (const x of [-.05, -1.12]) mesh(box(.008, .62, .004), M.black, g, [x, .78, z * .936]);
            for (const x of [-.2, -1.27]) mesh(box(.14, .025, .012), paint, g, [x, 1.0, z * .945]);
        }
        return g;
    }

    /* ---------- ME ---------- */
    /* white shirt with the sleeves rolled, black trousers, hands in pockets */
    function buildMe() {
        const g = new THREE.Group();
        const SKIN = std('#e3b48f', .6);
        const SHIRT = std('#f3f2ee', .85);
        const PANTS = std('#141518', .75);
        const HAIR = std('#15110f', .6);

        for (const sx of [-1, 1]) {
            mesh(new THREE.CapsuleGeometry(.05, .17, 6, 12), std('#101010', .35, .1), g, [sx * .1, .05, .05], [Math.PI / 2, 0, 0], [1.1, 1, .85]);
            mesh(new THREE.CapsuleGeometry(.066, .66, 6, 14), PANTS, g, [sx * .1, .47, 0]);
        }
        mesh(new THREE.CapsuleGeometry(.12, .12, 6, 16), PANTS, g, [0, .87, 0], [0, 0, Math.PI / 2], [1, 1, .85]);

        // shirt worn untucked, with collar, placket and the chest pocket
        const torso = mesh(new THREE.CapsuleGeometry(.17, .36, 8, 20), SHIRT, g, [0, 1.13, 0], null, [1.2, 1, .72]);
        mesh(new THREE.CylinderGeometry(.068, .078, .05, 16), SHIRT, g, [0, 1.5, 0]);
        for (const s of [-1, 1]) mesh(box(.08, .05, .012), SHIRT, g, [s * .045, 1.49, .075], [.35, 0, s * .55]);
        mesh(box(.016, .62, .006), std('#e3e2dd', .85), g, [0, 1.12, .124]);
        mesh(box(.08, .09, .006), std('#ebeae5', .85), g, [.09, 1.3, .113]);

        for (const s of [-1, 1]) {
            limb(V(s * .22, 1.38, 0), V(s * .3, 1.13, -.05), .06, SHIRT, g);
            limb(V(s * .3, 1.13, -.05), V(s * .26, 1.0, .01), .056, SHIRT, g);
            limb(V(s * .26, 1.0, .01), V(s * .21, .86, .06), .042, SKIN, g);
        }

        mesh(new THREE.CylinderGeometry(.055, .06, .12, 16), SKIN, g, [0, 1.53, 0]);

        const head = new THREE.Group();
        head.position.set(0, 1.72, .01);
        head.scale.set(.93, 1.12, 1);
        g.add(head);
        mesh(new THREE.SphereGeometry(.135, 40, 28), SKIN, head);
        for (const s of [-1, 1]) {
            mesh(new THREE.SphereGeometry(.03, 12, 8), SKIN, head, [s * .133, -.01, -.005], null, [.5, 1, .8]);
            mesh(new THREE.SphereGeometry(.014, 12, 10), std('#1a120e', .3), head, [s * .045, .005, .128], null, [1, 1.25, .45]);
            mesh(box(.04, .009, .012), std('#1b1410', .7), head, [s * .047, .045, .124], [0, 0, s * -.1]);
        }
        mesh(new THREE.SphereGeometry(.015, 12, 10), SKIN, head, [0, -.025, .133], null, [.8, 1.1, .9]);
        mesh(new THREE.TorusGeometry(.018, .0035, 6, 14, Math.PI), std('#9c5a52', .6), head, [0, -.058, .123], [0, 0, Math.PI]);

        // hair: short at the sides, volume on top, fringe swept to one side
        mesh(new THREE.SphereGeometry(.142, 36, 18, 0, Math.PI * 2, 0, 1.25), HAIR, head, [0, .004, -.006], [-.55, 0, 0]);
        mesh(new THREE.SphereGeometry(.1, 24, 14), HAIR, head, [0, .105, .025], [-.2, 0, 0], [.92, .62, 1.15]);
        for (let i = 0; i < 4; i++) {
            mesh(new THREE.SphereGeometry(.04, 14, 10), HAIR, head, [-.07 + i * .04, .1 - i * .005, .095], [.25, .2, -.3], [1.4, .5, .8]);
        }

        g.userData.tick = (t) => {
            torso.scale.y = 1 + Math.sin(t * 1.6) * .012;
            head.rotation.y = Math.sin(t * .45) * .22;
            head.rotation.z = Math.sin(t * .3) * .03;
        };
        return g;
    }

    /* ---------- optional .glb swap ---------- */
    async function fromGLB({ url, height, length, turn }) {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const root = (await new GLTFLoader().loadAsync(url)).scene;
        root.rotation.y = turn || 0;
        const b = new THREE.Box3().setFromObject(root);
        const size = b.getSize(V());
        root.scale.setScalar(height ? height / size.y : length / Math.max(size.x, size.z));
        b.setFromObject(root);
        const c = b.getCenter(V());
        root.position.set(-c.x, -b.min.y, -c.z);
        root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
        const g = new THREE.Group();
        g.add(root);
        return g;
    }

    async function model(key, build) {
        if (MODELS[key].url) {
            try { return await fromGLB(MODELS[key]); } catch (e) { console.warn(`3D: ${key} model failed, using the built-in one`, e); }
        }
        return build();
    }

    /* ---------- scene ---------- */
    async function mount(host, { reduceMotion = false } = {}) {
        if (!THREE) {
            const [three, controls, env] = await Promise.all([
                import('three'),
                import('three/addons/controls/OrbitControls.js'),
                import('three/addons/environments/RoomEnvironment.js'),
            ]);
            THREE = three;
            OrbitControls = controls.OrbitControls;
            RoomEnvironment = env.RoomEnvironment;
            UP = V(0, 1, 0);
            M = sharedMaterials();
        }

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        } catch (e) {
            throw Object.assign(new Error('WebGL is unavailable'), { code: 'webgl' });
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const BG = '#171512';
        scene.background = new THREE.Color(BG);
        scene.fog = new THREE.Fog(BG, 14, 34);
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
        scene.environmentIntensity = .55;
        pmrem.dispose();

        const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
        camera.position.set(4.6, 3.3, 8.6);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(.2, .9, 0);
        controls.enableDamping = true;
        controls.dampingFactor = .06;
        controls.autoRotate = !reduceMotion;
        controls.autoRotateSpeed = 1.1;
        controls.minDistance = 2;
        controls.maxDistance = 16;
        controls.minPolarAngle = .15;
        controls.maxPolarAngle = Math.PI * .48;
        // panning stays on the turntable so the scene can't be lost off-screen
        controls.addEventListener('change', () => {
            const t = controls.target;
            const r = Math.hypot(t.x, t.z);
            if (r > 4) { t.x *= 4 / r; t.z *= 4 / r; }
            t.y = THREE.MathUtils.clamp(t.y, .2, 2.5);
        });

        // lights: warm key, soft fill, and two rims in the site's clay and amber
        scene.add(new THREE.HemisphereLight('#fff1e0', '#2a2018', .5));
        const key = new THREE.DirectionalLight('#fff4e6', 2.4);
        key.position.set(6, 10, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        Object.assign(key.shadow.camera, { left: -6.5, right: 6.5, top: 6.5, bottom: -6.5, near: 1, far: 30 });
        key.shadow.bias = -.0004;
        key.shadow.normalBias = .02;
        scene.add(key);
        for (const [c, p] of [['#d9775a', [-5, 5, -4]], ['#e0a264', [5, 5, -5]]]) {
            const l = new THREE.PointLight(c, 28, 18);
            l.position.set(...p);
            scene.add(l);
        }

        // floor and turntable
        const floor = mesh(new THREE.CircleGeometry(40, 64), std('#1d1a16', .9), scene, null, [-Math.PI / 2, 0, 0]);
        floor.castShadow = false;
        mesh(new THREE.CylinderGeometry(5.2, 5.3, .14, 96), std('#25211c', .75, .1), scene, [0, .07, 0]);
        mesh(new THREE.TorusGeometry(5.22, .018, 8, 160), glow('#d9775a', 2), scene, [0, .14, 0], [Math.PI / 2, 0, 0]);
        mesh(new THREE.RingGeometry(1.9, 1.92, 96), std('#3a332b', .6), scene, [0, .141, 0], [-Math.PI / 2, 0, 0]);
        mesh(new THREE.RingGeometry(3.6, 3.62, 128), std('#3a332b', .6), scene, [0, .141, 0], [-Math.PI / 2, 0, 0]);

        const stage = new THREE.Group();
        stage.position.y = .14;
        scene.add(stage);

        const built = {
            me: await model('me', buildMe),
            bike: await model('bike', buildBike),
            car: await model('car', buildCar),
        };
        for (const [k, obj] of Object.entries(built)) {
            const p = PLACE[k];
            obj.position.set(p.x, 0, p.z);
            obj.rotation.y += p.turn;
            stage.add(obj);
        }

        const SPOTS = {
            all: { target: V(.2, .9, 0), dist: 10.5 },
            me: { target: V(PLACE.me.x, 1.35, PLACE.me.z), dist: 3 },
            bike: { target: V(PLACE.bike.x, .7, PLACE.bike.z), dist: 3.4 },
            car: { target: V(PLACE.car.x, 1.0, PLACE.car.z), dist: 7.2 },
        };

        let tween = null;
        function focus(name) {
            const s = SPOTS[name];
            if (!s) return;
            const dir = camera.position.clone().sub(controls.target);
            dir.y = 0;
            dir.normalize().multiplyScalar(Math.cos(.38)).setY(Math.sin(.38));
            const dist = s.dist * (camera.aspect < .9 ? 1.45 : 1);
            if (reduceMotion) {
                controls.target.copy(s.target);
                camera.position.copy(s.target).addScaledVector(dir, dist);
                return;
            }
            tween = {
                t: 0,
                fromT: controls.target.clone(), toT: s.target.clone(),
                fromP: camera.position.clone(), toP: s.target.clone().addScaledVector(dir, dist),
            };
        }

        function resize() {
            const w = host.clientWidth, h = host.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.fov = camera.aspect < .9 ? 55 : 40;
            camera.updateProjectionMatrix();
        }
        new ResizeObserver(resize).observe(host);
        resize();
        // a portrait screen needs to stand further back to fit the car in
        if (camera.aspect < .9) camera.position.sub(controls.target).multiplyScalar(1.5).add(controls.target);

        const clock = new THREE.Clock(false);
        let raf = 0;
        function frame() {
            raf = requestAnimationFrame(frame);
            const dt = Math.min(clock.getDelta(), .05);
            const t = clock.elapsedTime;
            if (tween) {
                tween.t = Math.min(1, tween.t + dt / 1.1);
                const e = 1 - Math.pow(1 - tween.t, 3);
                controls.target.lerpVectors(tween.fromT, tween.toT, e);
                camera.position.lerpVectors(tween.fromP, tween.toP, e);
                if (tween.t === 1) tween = null;
            }
            for (const obj of Object.values(built)) obj.userData.tick?.(t);
            controls.update(dt);
            renderer.render(scene, camera);
        }

        // grabbing the view cancels a camera move in progress
        renderer.domElement.addEventListener('pointerdown', () => { tween = null; });

        return {
            start() { if (!raf) { clock.start(); resize(); frame(); } },
            stop() { cancelAnimationFrame(raf); raf = 0; clock.stop(); },
            focus,
            setAutoRotate(on) { controls.autoRotate = on; },
        };
    }

    window.Showroom = { mount };
})();
