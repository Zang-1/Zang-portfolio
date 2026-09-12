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
            if (meta) meta.content = dark ? '#0B0F14' : '#F5F7FA';
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

        const tick = () => {
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

        let current = null;

        const onScroll = () => {
            const y = window.scrollY;

            navbar.classList.toggle('is-scrolled', y > 12);

            if (progress) {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
            }

            // scroll spy — the section whose top has passed the nav line
            const line = y + window.innerHeight * 0.32;
            let active = sections[0];
            for (const s of sections) {
                if (s.offsetTop <= line) active = s;
            }
            // pin the last section once we're at the very bottom
            if (y + window.innerHeight >= document.documentElement.scrollHeight - 4) {
                active = sections[sections.length - 1];
            }

            if (active && active !== current) {
                current = active;
                links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + active.id));
                movePill($('.nav-link.is-active'));
            }
        };

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => { onScroll(); ticking = false; });
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 1080) closeMenu();
            movePill($('.nav-link.is-active'));
        });

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

        onScroll();
    })();

    /* ---------- 5. SCROLL REVEAL ---------- */
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

    /* ---------- 6. MUSIC CAROUSEL ---------- */
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
        swiper.on('slideChangeTransitionEnd', pauseInactive);
    })();

    /* ---------- 7. GALLERY + LIGHTBOX ---------- */
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

        /* build the three covers */
        // a div rather than a <button>: headings and paragraphs are not
        // allowed inside button content, so we wire up the keyboard by hand.
        framesHost.innerHTML = ALBUMS.map(a => `
            <div class="frame" role="button" tabindex="0" data-album="${a.id}" aria-expanded="false">
                <img src="${a.cover}" alt="${a.title} album cover" loading="lazy">
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
                    <img src="${src}" alt="${data.title} photo ${i + 1}" loading="lazy">
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

        const show = (i) => {
            if (!photos.length) return;
            index = (i + photos.length) % photos.length;
            lbImg.src = photos[index];
            lbImg.alt = `${albumTitle.textContent} photo ${index + 1}`;
            lbCaption.textContent = `${albumTitle.textContent} · ${index + 1} / ${photos.length}`;
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

})();
