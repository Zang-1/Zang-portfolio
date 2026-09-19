/* =========================================================
   BAO GIANG — PORTFOLIO
   Vanilla ES6. No framework, no canvas loop.
   ========================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 1. THEME ---------- */
    (function theme() {
        const root = document.documentElement;
        const btn = $('#themeToggle');
        const icon = $('#themeIcon');
        const meta = $('meta[name="theme-color"]');
        if (!btn) return;

        const paint = () => {
            const dark = root.dataset.theme !== 'light';
            icon.className = dark ? 'fas fa-moon' : 'fas fa-sun';
            btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
            if (meta) meta.content = dark ? '#171512' : '#F0EEE6';
        };

        btn.addEventListener('click', () => {
            root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
            try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { }
            paint();
        });

        paint();
    })();

    /* ---------- 2. TYPING ---------- */
    (function typing() {
        const el = $('#typingText');
        if (!el) return;

        const words = ['IT Student', 'Billiards Lover', 'Motorcycle Enthusiast', 'Content Creator', 'Dreamer'];

        if (reduceMotion) {
            el.textContent = words[0];
            return;
        }

        let w = 0, c = 0, deleting = false;
        const hero = $('#hero');

        const tick = () => {
            // Each keystroke is a text change: a layout plus a repaint of the
            // hero. Once the hero is scrolled away (the off-screen observer
            // below tags it), idle instead of repainting what nobody can see.
            if (hero && hero.classList.contains('is-offscreen')) {
                setTimeout(tick, 600);
                return;
            }
            const word = words[w];
            c += deleting ? -1 : 1;
            el.textContent = word.slice(0, c);

            let wait = deleting ? 45 : 80;
            if (!deleting && c === word.length) {
                deleting = true;
                wait = 1900;
            } else if (deleting && c === 0) {
                deleting = false;
                w = (w + 1) % words.length;
                wait = 380;
            }
            setTimeout(tick, wait);
        };

        tick();
    })();

    /* ---------- 3. SAIGON CLOCK ---------- */
    (function clock() {
        const el = $('#heroClock');
        if (!el) return;

        const fmt = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const render = () => { el.textContent = fmt.format(new Date()); };
        render();
        setInterval(render, 1000 * 15);
    })();

    /* ---------- 4. NAV: scroll state, spy, pill, mobile menu ---------- */
    (function nav() {
        const navbar = $('#navbar');
        const links = $$('.nav-link');
        const pill = $('#navPill');
        const list = $('#navLinks');
        const burger = $('#navHamburger');
        const progress = $('#scrollProgress');
        const sections = links
            .map(a => $(a.getAttribute('href')))
            .filter(Boolean);

        const movePill = (link) => {
            if (!pill || !link || window.innerWidth <= 1080) return;
            pill.style.width = link.offsetWidth + 'px';
            pill.style.transform = `translateX(${link.offsetLeft}px)`;
            pill.style.opacity = '1';
        };

        const closeMenu = () => {
            list.classList.remove('is-open');
            burger.classList.remove('is-open');
            burger.setAttribute('aria-expanded', 'false');
        };

        const bg = $('.bg-layer');
        let current = null;
        let scrolled = null;

        // Layout is measured once and cached, then refreshed only when the page
        // actually changes size. Reading offsetTop / scrollHeight inside the
        // scroll handler forces a synchronous layout whenever anything is dirty
        // — and with animations running, something nearly always is.
        let tops = [];
        let maxScroll = 0;
        let viewH = window.innerHeight;

        const measure = () => {
            viewH = window.innerHeight;
            maxScroll = document.documentElement.scrollHeight - viewH;
            tops = sections.map(s => s.offsetTop);
        };

        const onScroll = () => {
            const y = window.scrollY;

            const isScrolled = y > 12;
            if (isScrolled !== scrolled) {
                scrolled = isScrolled;
                navbar.classList.toggle('is-scrolled', isScrolled);
            }

            const ratio = maxScroll > 0 ? Math.min(y / maxScroll, 1) : 0;

            if (progress) progress.style.transform = `scaleX(${ratio})`;

            // The orbs drift against the scroll through --sy. It is set on the
            // background layer, not :root — custom properties inherit, so a
            // change on :root restyles every element on the page.
            if (bg && !reduceMotion) bg.style.setProperty('--sy', ratio.toFixed(4));

            // scroll spy — the section whose top has passed the nav line
            const line = y + viewH * 0.32;
            let idx = 0;
            for (let i = 0; i < tops.length; i++) {
                if (tops[i] <= line) idx = i;
            }
            // pin the last section once we're at the very bottom
            if (y >= maxScroll - 4) idx = sections.length - 1;

            const active = sections[idx];
            if (active && active !== current) {
                current = active;
                links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + active.id));
                movePill($('.nav-link.is-active'));
            }
        };

        const remeasure = () => { measure(); onScroll(); };

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => { onScroll(); ticking = false; });
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 1080) closeMenu();
            remeasure();
            movePill($('.nav-link.is-active'));
        });

        // the page grows when fonts, images or an opened album land
        window.addEventListener('load', remeasure);
        if ('ResizeObserver' in window) {
            let pending = false;
            new ResizeObserver(() => {
                if (pending) return;
                pending = true;
                requestAnimationFrame(() => { pending = false; remeasure(); });
            }).observe(document.body);
        }

        burger.addEventListener('click', () => {
            const open = list.classList.toggle('is-open');
            burger.classList.toggle('is-open', open);
            burger.setAttribute('aria-expanded', String(open));
        });

        links.forEach(a => a.addEventListener('click', closeMenu));

        document.addEventListener('click', (e) => {
            if (!list.classList.contains('is-open')) return;
            if (!list.contains(e.target) && !burger.contains(e.target)) closeMenu();
        });

        remeasure();
    })();

    /* ---------- 5. AMBIENT BACKGROUND PARALLAX ---------- */
    (function ambient() {
        if (reduceMotion) return;

        // written on the background layer rather than :root, so a pointer move
        // restyles five elements instead of the whole document
        const bg = $('.bg-layer');
        if (!bg) return;
        // a coarse pointer means a touchscreen: there is nothing to follow
        if (!window.matchMedia('(pointer: fine)').matches) return;

        let x = 0, y = 0, queued = false;

        const apply = () => {
            queued = false;
            bg.style.setProperty('--mx', x.toFixed(4));
            bg.style.setProperty('--my', y.toFixed(4));
        };

        window.addEventListener('pointermove', (e) => {
            // -1 .. 1 from the centre of the window
            x = (e.clientX / window.innerWidth - 0.5) * 2;
            y = (e.clientY / window.innerHeight - 0.5) * 2;
            if (queued) return;
            queued = true;
            requestAnimationFrame(apply);
        }, { passive: true });
    })();

    /* ---------- 5b. PAUSE OFF-SCREEN ANIMATIONS ---------- */
    // The hero and music sections loop decorative animations forever; tag them
    // while they are out of view and style.css freezes those loops.
    (function offscreen() {
        if (!('IntersectionObserver' in window)) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                entry.target.classList.toggle('is-offscreen', !entry.isIntersecting);
            });
        }, { rootMargin: '120px 0px' });

        ['#hero', '#music'].forEach(sel => {
            const el = $(sel);
            if (el) io.observe(el);
        });
    })();

    /* ---------- 6. SCROLL REVEAL ---------- */
    (function reveal() {
        const items = $$('[data-reveal]');
        if (!items.length) return;

        if (reduceMotion || !('IntersectionObserver' in window)) {
            items.forEach(el => el.classList.add('is-visible'));
            return;
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        items.forEach(el => io.observe(el));
    })();

    /* ---------- 7. MUSIC CAROUSEL ---------- */
    (function music() {
        const node = $('.music-swiper');
        if (!node || typeof Swiper === 'undefined') return;

        const swiper = new Swiper(node, {
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            loop: true,
            speed: 500,
            coverflowEffect: {
                rotate: 25,
                stretch: 0,
                depth: 120,
                modifier: 1,
                slideShadows: false
            },
            navigation: {
                nextEl: node.querySelector('.swiper-button-next'),
                prevEl: node.querySelector('.swiper-button-prev')
            },
            pagination: {
                el: node.querySelector('.swiper-pagination'),
                clickable: true
            },
            // dragging over an iframe fights with Spotify's own controls and its
            // popups, so the carousel moves by arrows / pagination only
            simulateTouch: false,
            allowTouchMove: false
        });

        /* Players are mounted lazily, and only near the centre card.
           - Every Spotify embed is a complete web app. Eleven at once is a lot
             of memory and CPU to spend on the three cards you can see.
           - Swiper's loop mode (11.2) re-orders slides by moving their
             elements with prepend()/append(), and moving an iframe makes the
             browser reload it. Keeping the far slides empty makes those moves
             free instead of rebooting a player on every arrow click.
           MOUNT is how far either side of centre a player is created; KEEP is
           how far it may drift before it is dropped. The gap between them
           stops a card being torn down and rebuilt on a quick back-and-forth. */
        const MOUNT = 2;
        const KEEP = 3;
        const holders = $$('.spotify-embed', node);
        const total = holders.length;
        let live = false;

        const mount = (holder) => {
            if (holder.classList.contains('is-mounted')) return;
            const f = document.createElement('iframe');
            f.title = holder.dataset.title || 'Spotify player';
            f.width = '100%';
            f.height = '352';
            f.setAttribute('frameborder', '0');
            f.setAttribute('scrolling', 'no');
            f.setAttribute('allowfullscreen', '');
            f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            f.addEventListener('load', () => f.classList.add('is-loaded'), { once: true });
            f.src = holder.dataset.src;
            holder.appendChild(f);
            holder.classList.add('is-mounted');
        };

        const unmount = (holder) => {
            if (!holder.classList.contains('is-mounted')) return;
            holder.replaceChildren();
            holder.classList.remove('is-mounted');
        };

        /* Shuffle.
           The tracks are permuted by moving their data-src between the slide
           elements, which never move. Reordering the slides themselves would
           be the obvious approach and is the wrong one here for the same
           reason the mounting above is lazy: relocating an iframe in the DOM
           makes the browser reload it, so a shuffle would reboot every player
           it touched. Swapping the source strings leaves the DOM alone.
           Any mounted player is torn down first, because an iframe keeps
           playing whatever it already loaded no matter what its holder's
           dataset now says. */
        const order = holders.map(h => ({ src: h.dataset.src, title: h.dataset.title }));

        const shuffle = () => {
            for (let i = order.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [order[i], order[j]] = [order[j], order[i]];
            }
            holders.forEach((h, i) => {
                unmount(h);
                h.dataset.src = order[i].src;
                h.dataset.title = order[i].title;
            });
        };

        const sync = () => {
            if (!live) return;
            const centre = swiper.realIndex;
            const near = [];

            swiper.slides.forEach(slide => {
                const holder = slide.querySelector('.spotify-embed');
                if (!holder) return;
                const gap = Math.abs(Number(slide.dataset.swiperSlideIndex) - centre);
                const d = Math.min(gap, total - gap); // distance around the loop
                if (d > KEEP) unmount(holder);
                else if (d <= MOUNT) near.push([d, holder]);
            });

            // centre card first, so the one you are looking at is never last
            near.sort((a, b) => a[0] - b[0]).forEach(([, holder]) => mount(holder));
        };

        // one track at a time: pause every embed that is not the centred one
        const pauseInactive = () => {
            const active = node.querySelector('.swiper-slide-active iframe');
            $$('.swiper-slide iframe', node).forEach(frame => {
                if (frame === active) return;
                try {
                    frame.contentWindow.postMessage({ command: 'pause' }, '*');
                } catch (e) { }
            });
        };

        swiper.on('slideChange', pauseInactive);
        // Mount new neighbours only once the slide animation has finished, so
        // booting a player never competes with the swipe for the frame budget.
        swiper.on('slideChangeTransitionEnd', () => {
            pauseInactive();
            sync();
        });

        // Nothing is loaded until the section is close to the viewport AND the
        // page itself has finished loading and gone idle. On a short screen the
        // music section sits right under the fold, so "close" alone would boot
        // the players while the hero is still painting its first frame.
        const goLive = () => {
            const start = () => { live = true; sync(); };
            const idle = () => ('requestIdleCallback' in window)
                ? requestIdleCallback(start, { timeout: 1500 })
                : setTimeout(start, 200);
            if (document.readyState === 'complete') idle();
            else window.addEventListener('load', idle, { once: true });
        };

        // A fresh order on every visit. This runs before anything is mounted,
        // so at load time it costs nothing but the swap itself.
        shuffle();

        const btn = $('#shuffleBtn');
        const status = $('#shuffleStatus');
        if (btn) {
            let spinTimer = 0;
            btn.addEventListener('click', () => {
                shuffle();
                // back to the front of the new order, then re-mount around it
                if (swiper.slideToLoop) swiper.slideToLoop(0, reduceMotion ? 0 : 400);
                sync();

                if (status) status.textContent = 'Shuffled. ' + total + ' tracks in a new order.';
                btn.classList.add('is-spinning');
                clearTimeout(spinTimer);
                spinTimer = setTimeout(() => btn.classList.remove('is-spinning'), 520);
            });
        }

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                if (!entries.some(e => e.isIntersecting)) return;
                io.disconnect();
                goLive();
            }, { rootMargin: '400px 0px' });
            io.observe(node);
        } else {
            goLive();
        }
    })();

    /* ---------- 8. GALLERY + LIGHTBOX ---------- */
    (function gallery() {
        const framesHost = $('#galleryFrames');
        const album = $('#album');
        const albumTitle = $('#albumTitle');
        const photoGrid = $('#photoGrid');
        if (!framesHost || !album) return;

        const ALBUMS = [
            {
                id: 'myself',
                title: 'Myself',
                desc: 'Driven by intense focus and absolute precision',
                icon: 'fa-user-circle',
                cover: 'assets/images/covers/yeah2.png',
                photos: [
                    'assets/images/inside/myself/z7867573107848_dcf3f29c4abe184f09f029ab12a3efd0.jpg',
                    'assets/images/inside/myself/z7867573444580_04097ab2a1c4508835f7a1bf8ea76477.jpg',
                    'assets/images/inside/myself/z7867573602287_ff167f5e8c4794c99c10e7d627d78b5c.jpg',
                    'assets/images/inside/myself/z7867573719012_62a3322652b05f7a345d59b34a09568c.jpg',
                    'assets/images/inside/myself/z7867573806282_655adbbe6d1530f637fd2ca4f8667a3d.jpg'
                ]
            },
            {
                id: 'motorcycles',
                title: 'Motorcycles',
                desc: 'Finding my freedom in the rhythm of the city streets',
                icon: 'fa-motorcycle',
                cover: 'assets/images/covers/IMG_4800.JPG',
                photos: [
                    'assets/images/inside/motorcycles/z7867552172506_9c6e384f5cd648544b06229bf0e5b4db.jpg',
                    'assets/images/inside/motorcycles/z7867552244991_ecc590532456411c3c9cf17ea10d964c.jpg',
                    'assets/images/inside/motorcycles/z7867552327524_782dd64e3b53bc6c7897175d8f0ee8ec.jpg',
                    'assets/images/inside/motorcycles/z7867552394139_4e9d186880fdba759b9682afef93d48d.jpg',
                    'assets/images/inside/motorcycles/A65093D4-FECD-4512-BFAF-66B3026AA4CD.png',
                    'assets/images/inside/motorcycles/IMG_4768.jpg',
                    'assets/images/inside/motorcycles/IMG_4765.jpg'
                ]
            },
            {
                id: 'daily',
                title: 'Daily',
                desc: 'Just an IT student capturing ordinary moments',
                icon: 'fa-camera',
                cover: 'assets/images/covers/z7867581724712_7ad3960bcd308860b36161d9aa5d5942.jpg',
                photos: [
                    'assets/images/inside/daily/z7867581308309_a22d233f605620e2084b12fa083e5064.jpg',
                    'assets/images/covers/z7867581724712_7ad3960bcd308860b36161d9aa5d5942.jpg',
                    'assets/images/inside/daily/z7867582189241_36e308db949ac7c4e1975ccee4eb719e.jpg',
                    'assets/images/inside/daily/z7867582548615_99a5a2c4e851e04fa3f0bc78a559af8b.jpg',
                    'assets/images/inside/daily/z7867582694625_021c108d80db9e0b8514aa86a7f926aa.jpg',
                    'assets/images/inside/daily/z7867582846706_1852ddeb6554ff6c38b5ee2584230db4.jpg'
                ]
            }
        ];

        /* Photos are listed by their original path; what is actually served is
           a web-sized WebP copy made by optimize-images.py — a 12-megapixel
           phone photo decoded into a 180px grid cell costs ~48 MB of memory and
           a visible stall. If a copy is missing (a photo added without running
           the script), the <img> quietly falls back to the original file. */
        const sized = (src, size) => src
            .replace(/^assets\/images\//, `assets/opt/${size}/`)
            .replace(/\.(jpe?g|png)$/i, '.webp');

        const fallback = (src) => `onerror="this.onerror=null;this.src='${src}'"`;

        /* build the three covers */
        // a div rather than a <button>: headings and paragraphs are not
        // allowed inside button content, so we wire up the keyboard by hand.
        framesHost.innerHTML = ALBUMS.map(a => `
            <div class="frame" role="button" tabindex="0" data-album="${a.id}" aria-expanded="false">
                <img src="${sized(a.cover, 'cover')}" ${fallback(a.cover)} alt="${a.title} album cover"
                    loading="lazy" decoding="async">
                <span class="frame-count">${a.photos.length} photos</span>
                <div class="frame-body">
                    <span class="frame-icon"><i class="fas ${a.icon}"></i></span>
                    <h3>${a.title}</h3>
                    <p>${a.desc}</p>
                    <span class="frame-action">View Album <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>`).join('');

        let openId = null;
        let photos = [];
        let index = 0;

        const closeAlbum = () => {
            album.classList.remove('is-open');
            openId = null;
            $$('.frame', framesHost).forEach(f => {
                f.classList.remove('is-open');
                f.setAttribute('aria-expanded', 'false');
            });
        };

        const openAlbum = (id) => {
            if (openId === id) { closeAlbum(); return; }

            const data = ALBUMS.find(a => a.id === id);
            if (!data) return;

            openId = id;
            photos = data.photos;
            albumTitle.textContent = data.title;
            photoGrid.innerHTML = photos.map((src, i) => `
                <button class="photo" type="button" data-i="${i}" aria-label="Open photo ${i + 1}">
                    <img src="${sized(src, 'thumb')}" ${fallback(src)} alt="${data.title} photo ${i + 1}"
                        loading="lazy" decoding="async">
                </button>`).join('');

            album.classList.add('is-open');
            $$('.frame', framesHost).forEach(f => {
                const on = f.dataset.album === id;
                f.classList.toggle('is-open', on);
                f.setAttribute('aria-expanded', String(on));
            });

            album.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
        };

        framesHost.addEventListener('click', (e) => {
            const frame = e.target.closest('.frame');
            if (frame) openAlbum(frame.dataset.album);
        });

        framesHost.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const frame = e.target.closest('.frame');
            if (!frame) return;
            e.preventDefault();
            openAlbum(frame.dataset.album);
        });

        $('#albumClose').addEventListener('click', closeAlbum);

        /* lightbox */
        const lb = $('#lightbox');
        const lbImg = $('#lbImg');
        const lbCaption = $('#lbCaption');

        const preload = (i) => {
            const src = photos[(i + photos.length) % photos.length];
            const img = new Image();
            img.decoding = 'async';
            img.src = sized(src, 'full');
        };

        const show = (i) => {
            if (!photos.length) return;
            index = (i + photos.length) % photos.length;
            const original = photos[index];
            lbImg.onerror = () => { lbImg.onerror = null; lbImg.src = original; };
            lbImg.src = sized(original, 'full');
            lbImg.alt = `${albumTitle.textContent} photo ${index + 1}`;
            lbCaption.textContent = `${albumTitle.textContent} · ${index + 1} / ${photos.length}`;
            // warm the neighbours so the arrow keys land on an already-decoded image
            preload(index + 1);
            preload(index - 1);
        };

        const openLb = (i) => {
            show(i);
            lb.classList.add('is-open');
            document.body.classList.add('no-scroll');
        };

        const closeLb = () => {
            lb.classList.remove('is-open');
            document.body.classList.remove('no-scroll');
        };

        photoGrid.addEventListener('click', (e) => {
            const photo = e.target.closest('.photo');
            if (photo) openLb(Number(photo.dataset.i));
        });

        $('#lbClose').addEventListener('click', closeLb);
        $('#lbPrev').addEventListener('click', () => show(index - 1));
        $('#lbNext').addEventListener('click', () => show(index + 1));

        // click the backdrop (but not the image or the buttons) to dismiss
        lb.addEventListener('click', (e) => {
            if (e.target === lb || e.target.classList.contains('lightbox-content')) closeLb();
        });

        document.addEventListener('keydown', (e) => {
            if (!lb.classList.contains('is-open')) return;
            if (e.key === 'Escape') closeLb();
            else if (e.key === 'ArrowLeft') show(index - 1);
            else if (e.key === 'ArrowRight') show(index + 1);
        });
    })();

    /* ---------- 9. DESK BUDDY ----------
       The character strolls to a random spot, rests, then picks another one.
       There is no animation loop here on purpose: each stroll is a single CSS
       transition on `translate`, handed to the compositor, so the walk costs
       the main thread two style writes per trip rather than one per frame.
       Timers stop entirely while the tab is hidden. */
    (function buddy() {
        const el = $('#buddy');
        const sprite = $('#buddySprite');
        const bubble = $('#buddyBubble');
        const svg = $('#buddySvg');
        if (!el || !sprite || !bubble || !svg) return;

        /* The artwork. 'X' is a body pixel, 'o' an eye pixel, '.' is empty.
           Two frames: legs tucked, then legs spread. Edit these strings to
           redraw the character — nothing else knows what it looks like. */
        const FRAMES = [
            [
                '..X.....X..',
                '...X...X...',
                '..XXXXXXX..',
                '.XXoXXXoXX.',
                'XXXXXXXXXXX',
                'X.XXXXXXX.X',
                'X.X.....X.X',
                '...XX.XX...'
            ],
            [
                '..X.....X..',
                'X..X...X..X',
                'X.XXXXXXX.X',
                'XXXoXXXoXXX',
                'XXXXXXXXXXX',
                '.XXXXXXXXX.',
                '..X.....X..',
                '.X.......X.'
            ]
        ];

        const NS = 'http://www.w3.org/2000/svg';
        const COLS = FRAMES[0][0].length;

        // Draw both frames once, as one <rect> per lit pixel.
        FRAMES.forEach((rows, i) => {
            const g = document.createElementNS(NS, 'g');
            g.setAttribute('class', 'buddy-frame buddy-frame--' + (i ? 'b' : 'a'));
            rows.forEach((row, y) => {
                for (let cx = 0; cx < row.length; cx++) {
                    const ch = row[cx];
                    if (ch === '.') continue;
                    const r = document.createElementNS(NS, 'rect');
                    r.setAttribute('x', cx);
                    r.setAttribute('y', y);
                    r.setAttribute('width', 1);
                    r.setAttribute('height', 1);
                    r.setAttribute('class', ch === 'o' ? 'buddy-px buddy-px--eye' : 'buddy-px');
                    g.appendChild(r);
                }
            });
            svg.appendChild(g);
        });

        const MARGIN = 12;     // keep this clear of both edges
        const SPEED = 68;      // px per second
        const lines = [
            'Hey there 👾',
            'Nice scroll.',
            'No Pain No Gain.',
            'Go say hi to Giang!',
            'I live down here.',
            'Insert coin.'
        ];

        let x = 40;
        let timer = 0;
        let talkTimer = 0;

        const spriteW = () => sprite.getBoundingClientRect().width || 44;
        // One sprite pixel on screen. The character only ever stands on a
        // multiple of this, so its edges stay aligned to its own pixel grid.
        const unit = () => spriteW() / COLS;
        const maxX = () => Math.max(MARGIN, window.innerWidth - spriteW() - MARGIN);
        const rand = (lo, hi) => lo + Math.random() * (hi - lo);
        const snap = (v) => Math.round(v / unit()) * unit();

        const place = () => el.style.setProperty('--x', x.toFixed(2) + 'px');

        // Reduced motion: the character still shows up, it just stands still.
        if (reduceMotion) {
            x = Math.min(40, maxX());
            place();
            return;
        }

        const rest = () => {
            el.classList.remove('is-walking');
            timer = setTimeout(stroll, rand(1400, 5200));
        };

        const stroll = () => {
            const limit = maxX();
            // aim somewhere meaningfully far away, so it does not shuffle on the spot
            let target;
            do {
                target = snap(rand(MARGIN, limit));
            } while (Math.abs(target - x) < Math.min(140, limit * .4));

            const dist = Math.abs(target - x);
            // One step per sprite pixel travelled: that count IS the animation's
            // timing function, which is what makes the walk read as 8-bit.
            const steps = Math.max(1, Math.round(dist / unit()));
            const ms = (dist / SPEED) * 1000;

            el.style.setProperty('--face', target < x ? '-1' : '1');
            el.style.setProperty('--walk-ms', Math.round(ms) + 'ms');
            el.style.transitionTimingFunction = 'steps(' + steps + ', end), ease';
            x = target;
            place();
            el.classList.add('is-walking');

            timer = setTimeout(rest, ms);
        };

        const say = (text) => {
            bubble.textContent = text;

            // Anchor the bubble away from whichever edge is too close. Measured
            // after the text is in, because the bubble sizes to its content.
            el.classList.remove('talk-left', 'talk-right');
            const half = (bubble.offsetWidth - spriteW()) / 2;
            if (half > 0) {
                if (x < half + MARGIN) el.classList.add('talk-left');
                else if (x + spriteW() + half > window.innerWidth - MARGIN) el.classList.add('talk-right');
            }

            el.classList.add('is-talking');
            clearTimeout(talkTimer);
            talkTimer = setTimeout(() => el.classList.remove('is-talking'), 2600);
        };

        sprite.addEventListener('click', () => {
            say(lines[Math.floor(Math.random() * lines.length)]);
            el.classList.add('is-hopping');
            setTimeout(() => el.classList.remove('is-hopping'), 520);
        });

        // A resize can leave the character stranded past the new right edge.
        let resizeTimer = 0;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const limit = maxX();
                if (x > limit) {
                    x = snap(limit);
                    el.style.setProperty('--walk-ms', '300ms');
                    place();
                }
            }, 150);
        }, { passive: true });

        // Nothing should tick while the tab is in the background.
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearTimeout(timer);
                el.classList.remove('is-walking');
            } else {
                timer = setTimeout(stroll, 600);
            }
        });

        x = snap(x);
        place();
        timer = setTimeout(stroll, 1800);
    })();

    /* ---------- 10. JOURNEY ACCORDION ----------
       Each year toggles on its own, so any number can be open at once.
       The open state lives in a class; CSS does the animating. Nothing here
       has to tell the nav its offsets moved — the ResizeObserver on <body> in
       module 4 already re-measures when the page height changes. */
    (function journey() {
        const toggles = $$('.tl-toggle');
        if (!toggles.length) return;

        toggles.forEach(btn => {
            const group = btn.closest('.tl-group');
            if (!group) return;

            btn.addEventListener('click', () => {
                const open = group.classList.toggle('is-open');
                btn.setAttribute('aria-expanded', String(open));
            });
        });
    })();

})();
