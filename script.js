// ========================================
// TYPING ANIMATION
// ========================================
const typingTexts = ["IT Student", "Billiards Lover", "Motorcycle Enthusiast", "Content Creator", "Dreamer"];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingSpeed = 80;
const deletingSpeed = 50;
const pauseTime = 2000;

function typeText() {
    const el = document.getElementById('typingText');
    if (!el) return;

    const currentText = typingTexts[textIndex];

    if (isDeleting) {
        el.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
    } else {
        el.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
    }

    let speed = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && charIndex === currentText.length) {
        speed = pauseTime;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % typingTexts.length;
        speed = 400;
    }

    setTimeout(typeText, speed);
}

// ========================================
// NAVBAR & NAVIGATION
// ========================================
const navbar = document.getElementById('navbar');
const navLinks = document.getElementById('navLinks');
const navHamburger = document.getElementById('navHamburger');
const allNavLinks = document.querySelectorAll('.nav-link');
const activePill = document.getElementById('navActivePill');

// Update active sliding indicator pill on desktop
function updateActivePillPosition(targetLink) {
    if (!activePill) return;
    
    if (window.innerWidth <= 900) {
        activePill.style.opacity = '0';
        return;
    }
    
    if (targetLink) {
        const linkRect = targetLink.getBoundingClientRect();
        const navLinksRect = navLinks.getBoundingClientRect();
        
        const relativeLeft = linkRect.left - navLinksRect.left;
        const linkWidth = linkRect.width;
        
        activePill.style.left = `${relativeLeft}px`;
        activePill.style.width = `${linkWidth}px`;
        
        if (!targetLink.classList.contains('active')) {
            activePill.style.transform = 'translateY(-50%) scale(0.95)';
            activePill.style.opacity = '0.5';
        } else {
            activePill.style.transform = 'translateY(-50%) scale(1)';
            activePill.style.opacity = '1';
        }
    } else {
        activePill.style.opacity = '0';
    }
}

// Activate nav link
function activateLink(link) {
    if (link && !link.classList.contains('active')) {
        allNavLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        updateActivePillPosition(link);
    }
}

// Optimize lookups with an ID-to-link mapping dictionary
const linkMap = {};
allNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
        linkMap[href.substring(1)] = link;
    }
});

// Highly optimized IntersectionObserver for active section tracking
const observerOptions = {
    root: null,
    rootMargin: '-35% 0px -45% 0px',
    threshold: 0
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            const targetLink = linkMap[id];
            if (targetLink) {
                activateLink(targetLink);
            }
        }
    });
}, observerOptions);

// Observe all page sections
const pageSections = document.querySelectorAll('.section, .hero');
pageSections.forEach(section => {
    if (section.getAttribute('id')) {
        sectionObserver.observe(section);
    }
});

// Hover-follow pill micro-interactions (Desktop only)
allNavLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
        if (window.innerWidth > 900) {
            updateActivePillPosition(link);
        }
    });
    
    link.addEventListener('mouseleave', () => {
        if (window.innerWidth > 900) {
            const currentActiveLink = document.querySelector('.nav-link.active');
            updateActivePillPosition(currentActiveLink);
        }
    });
});

// Performance optimized scroll header transition with requestAnimationFrame
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            if (scrollY > 50) {
                if (!navbar.classList.contains('scrolled')) {
                    navbar.classList.add('scrolled');
                }
            } else {
                if (navbar.classList.contains('scrolled')) {
                    navbar.classList.remove('scrolled');
                }
            }
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

// Responsive resize and load updates for pill
window.addEventListener('resize', () => {
    const currentActiveLink = document.querySelector('.nav-link.active');
    updateActivePillPosition(currentActiveLink);
});

window.addEventListener('load', () => {
    const currentActiveLink = document.querySelector('.nav-link.active');
    updateActivePillPosition(currentActiveLink);
});

// Hamburger mobile menu toggle
navHamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    navHamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
});

// Close mobile menu on link click
allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
        navHamburger.classList.remove('active');
        navLinks.classList.remove('open');
    });
});

// Click outside mobile menu to close smoothly (native feel)
document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open')) {
        const clickedInsideMenu = navLinks.contains(e.target);
        const clickedHamburger = navHamburger.contains(e.target);
        
        if (!clickedInsideMenu && !clickedHamburger) {
            navHamburger.classList.remove('active');
            navLinks.classList.remove('open');
        }
    }
});

// ========================================
// THEME TOGGLE
// ========================================
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const html = document.documentElement;

// Check saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-moon';
    } else {
        themeIcon.className = 'fas fa-sun';
    }
}

// ========================================
// SCROLL REVEAL ANIMATION
// ========================================
function revealOnScroll() {
    const reveals = document.querySelectorAll('[data-reveal]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay for sibling elements
                const parent = entry.target.parentElement;
                const siblings = parent.querySelectorAll('[data-reveal]');
                let delay = 0;
                
                siblings.forEach((sibling, i) => {
                    if (sibling === entry.target) {
                        delay = i * 100;
                    }
                });
                
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, delay);
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    reveals.forEach(el => observer.observe(el));
}

// ========================================
// SMOOTH SCROLL
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ========================================
// REAL-TIME CLOCK WIDGET
// ========================================
function initLiveClock() {
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        
        const clockEl = document.getElementById('hero-clock');
        if (clockEl) {
            clockEl.textContent = timeString;
        }
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// ========================================
// INITIALIZE
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    typeText();
    revealOnScroll();
    initInteractiveBackgroundPlexus();
    init3DTiltEffect();
    initLiveClock();
    
    // Lightbox next/prev click event listeners
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateLightbox(-1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateLightbox(1);
        });
    }
    
    // Lightbox keyboard navigation support
    window.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('photoLightbox');
        if (lightbox && lightbox.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                navigateLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                navigateLightbox(1);
            } else if (e.key === 'Escape') {
                lightbox.classList.remove('active');
            }
        }
    });
});

// ========================================
// DYNAMIC PARTICLE PLEXUS (GOOGLE-STYLE BACKGROUND)
// ========================================
function initInteractiveBackgroundPlexus() {
    const canvas = document.getElementById('interactive-bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    let mouse = { x: -1000, y: -1000, active: false, vx: 0, vy: 0, speed: 0, lastX: -1000, lastY: -1000 };
    const supportsHover = window.matchMedia("(hover: hover)").matches;

    if (supportsHover) {
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.active = true;
        });

        window.addEventListener('mouseenter', () => {
            mouse.active = true;
        });

        window.addEventListener('mouseleave', () => {
            mouse.active = false;
        });

        window.addEventListener('mousedown', () => {
            if (mouse.active) {
                triggerShockwave(mouse.x, mouse.y);
            }
        });
    } else {
        window.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                triggerShockwave(touchX, touchY);
            }
        }, { passive: true });
    }

    let particles = [];
    let isMobileDevice = window.innerWidth <= 768;
    let maxParticles = isMobileDevice ? 60 : 220;
    let connectionDistance = isMobileDevice ? 55 : 80;
    
    const friction = 0.94;

    function getThemeColors() {
        const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLightTheme) {
            return [
                '0, 180, 220',
                '124, 58, 237',
                '220, 80, 150'
            ];
        } else {
            return [
                '0, 212, 255',
                '124, 58, 237',
                '244, 114, 182'
            ];
        }
    }

    let activeColors = getThemeColors();

    const themeObserver = new MutationObserver(() => {
        activeColors = getThemeColors();
    });
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });

    class Particle {
        constructor(x, y) {
            this.x = x || Math.random() * canvas.width;
            this.y = y || Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.baseVx = this.vx;
            this.baseVy = this.vy;
            this.radius = Math.random() * 2 + 1.2;
            this.colorIndex = Math.floor(Math.random() * activeColors.length);
            this.targetAlpha = Math.random() * 0.4 + 0.3;
            this.alpha = this.targetAlpha;
            this.maxLife = Math.random() * 400 + 400;
            this.life = Math.random() * this.maxLife;
        }

        reset(atEdge = true) {
            if (atEdge) {
                const edge = Math.floor(Math.random() * 4);
                const offset = 10;
                if (edge === 0) {
                    this.x = Math.random() * canvas.width;
                    this.y = -offset;
                } else if (edge === 1) {
                    this.x = canvas.width + offset;
                    this.y = Math.random() * canvas.height;
                } else if (edge === 2) {
                    this.x = Math.random() * canvas.width;
                    this.y = canvas.height + offset;
                } else {
                    this.x = -offset;
                    this.y = Math.random() * canvas.height;
                }
            } else {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            }

            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.baseVx = this.vx;
            this.baseVy = this.vy;
            this.radius = Math.random() * 2 + 1.2;
            this.colorIndex = Math.floor(Math.random() * activeColors.length);
            this.alpha = 0;
            this.targetAlpha = Math.random() * 0.4 + 0.3;
            this.maxLife = Math.random() * 400 + 400;
            this.life = this.maxLife;
        }

        update() {
            this.life--;

            if (this.life <= 0) {
                this.reset(false);
            } else if (this.life < 50) {
                this.alpha -= 0.015;
                if (this.alpha < 0) this.alpha = 0;
            } else if (this.alpha < this.targetAlpha) {
                this.alpha += 0.015;
                if (this.alpha > this.targetAlpha) this.alpha = this.targetAlpha;
            }

            if (mouse.active && this.life > 50) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const distSq = dx * dx + dy * dy;
                const repelRadius = 80;
                const repelRadiusSq = repelRadius * repelRadius;

                if (distSq < repelRadiusSq) {
                    const dist = Math.sqrt(distSq);
                    const force = (repelRadius - dist) / repelRadius;
                    
                    const baseStrength = 0.15;
                    const speedInfluence = 0.08;
                    const totalStrength = baseStrength + mouse.speed * speedInfluence;

                    const pushX = (dx / (dist || 1)) * force * totalStrength;
                    const pushY = (dy / (dist || 1)) * force * totalStrength;

                    this.vx += pushX;
                    this.vy += pushY;
                }
            }

            this.vx *= friction;
            this.vy *= friction;

            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed < 0.2) {
                this.vx += (Math.random() - 0.5) * 0.05;
                this.vy += (Math.random() - 0.5) * 0.05;
            }

            const maxSpeed = 7;
            if (speed > maxSpeed) {
                this.vx = (this.vx / speed) * maxSpeed;
                this.vy = (this.vy / speed) * maxSpeed;
            }

            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0) {
                this.x = 0;
                this.vx *= -1;
            } else if (this.x > canvas.width) {
                this.x = canvas.width;
                this.vx *= -1;
            }

            if (this.y < 0) {
                this.y = 0;
                this.vy *= -1;
            } else if (this.y > canvas.height) {
                this.y = canvas.height;
                this.vy *= -1;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${activeColors[this.colorIndex]}, ${this.alpha})`;
            ctx.fill();
        }
    }

    function initParticles() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        isMobileDevice = window.innerWidth <= 768;
        maxParticles = isMobileDevice ? 60 : 220;
        connectionDistance = isMobileDevice ? 55 : 80;
        
        particles = [];
        for (let i = 0; i < maxParticles; i++) {
            particles.push(new Particle());
        }
    }

    initParticles();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            initParticles();
        }, 200);
    });

    function triggerShockwave(x, y) {
        const shockwaveRadius = 250;
        const shockwaveForce = 22;
        const shockwaveRadiusSq = shockwaveRadius * shockwaveRadius;

        particles.forEach(p => {
            const dx = p.x - x;
            const dy = p.y - y;
            const distSq = dx * dx + dy * dy;

            if (distSq < shockwaveRadiusSq) {
                const dist = Math.sqrt(distSq);
                const force = (shockwaveRadius - dist) / shockwaveRadius;
                const pushX = (dx / (dist || 1)) * force * shockwaveForce;
                const pushY = (dy / (dist || 1)) * force * shockwaveForce;

                p.vx += pushX;
                p.vy += pushY;
            }
        });
    }

    let isPageVisible = true;
    let animationId = null;

    function animate() {
        if (!isPageVisible) {
            animationId = null;
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate mouse velocity and speed once per frame
        if (mouse.active && mouse.lastX !== -1000) {
            mouse.vx = mouse.x - mouse.lastX;
            mouse.vy = mouse.y - mouse.lastY;
            mouse.speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
        } else {
            mouse.vx = 0;
            mouse.vy = 0;
            mouse.speed = 0;
            mouse.lastX = -1000;
        }

        if (mouse.active) {
            mouse.lastX = mouse.x;
            mouse.lastY = mouse.y;
        }

        // 1. Update and draw particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // 2. Optimized Plexus Line Grouping / Batching (Draws in at most 12 path strokes!)
        const paths = Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => []));
        const connectionDistanceSq = connectionDistance * connectionDistance;

        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < connectionDistanceSq) {
                    const dist = Math.sqrt(distSq);
                    const alphaRatio = 1.0 - (dist / connectionDistance);
                    const bracket = Math.min(3, Math.floor(alphaRatio * 4));
                    paths[p1.colorIndex][bracket].push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
                }
            }
        }

        ctx.lineWidth = 0.8;
        for (let c = 0; c < 3; c++) {
            const colorStr = activeColors[c];
            for (let b = 0; b < 4; b++) {
                const lines = paths[c][b];
                if (lines.length === 0) continue;
                
                ctx.beginPath();
                for (let l = 0; l < lines.length; l++) {
                    const line = lines[l];
                    ctx.moveTo(line.x1, line.y1);
                    ctx.lineTo(line.x2, line.y2);
                }
                const alpha = ((b + 0.5) / 4) * 0.12;
                ctx.strokeStyle = `rgba(${colorStr}, ${alpha})`;
                ctx.stroke();
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    document.addEventListener('visibilitychange', () => {
        isPageVisible = document.visibilityState === 'visible';
        if (isPageVisible) {
            if (!animationId) {
                animationId = requestAnimationFrame(animate);
            }
        }
    });

    animationId = requestAnimationFrame(animate);
}

// ========================================
// INTERACTIVE GALLERY LOGIC
// ========================================

function handleImageError(imgEl, placeholderTitle) {
    imgEl.style.display = 'none';
    
    const parent = imgEl.parentElement;
    const overlay = parent.querySelector('.item-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    if (parent.querySelector('.gallery-placeholder-card')) return;
    
    let iconClass = 'fa-image';
    if (imgEl.src.includes('billiards')) {
        iconClass = 'fa-8-ball';
    } else if (imgEl.src.includes('motorcycles')) {
        iconClass = 'fa-motorcycle';
    } else if (imgEl.src.includes('life')) {
        iconClass = 'fa-camera';
    }
    
    const card = document.createElement('div');
    card.className = 'gallery-placeholder-card';
    card.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${placeholderTitle}</span>
        <p>Ảnh chưa tải lên</p>
    `;
    
    parent.appendChild(card);
    parent.style.cursor = 'default';
}

function expandGalleryFrame(frameId) {
    const frames = {
        'billiards': document.getElementById('frame-billiards'),
        'motorcycles': document.getElementById('frame-motorcycles'),
        'life': document.getElementById('frame-life')
    };
    
    const grids = {
        'billiards': document.getElementById('grid-billiards'),
        'motorcycles': document.getElementById('grid-motorcycles'),
        'life': document.getElementById('grid-life')
    };
    
    const container = document.getElementById('photoGridContainer');
    const titleEl = document.getElementById('gridTitle');
    
    if (!container || !titleEl) return;
    
    const titles = {
        'billiards': 'Album Bản Thân (Myself) 👤',
        'motorcycles': 'Album Xe Máy (Motorcycles) 🏍️',
        'life': 'Album Đời Thường (Daily) 📸'
    };
    
    titleEl.textContent = titles[frameId] || 'Album';
    
    Object.keys(frames).forEach(key => {
        const frame = frames[key];
        if (frame) {
            if (key === frameId) {
                frame.classList.remove('collapsed-frame');
                frame.classList.add('active-frame');
            } else {
                frame.classList.remove('active-frame');
                frame.classList.add('collapsed-frame');
            }
        }
    });
    
    Object.keys(grids).forEach(key => {
        const grid = grids[key];
        if (grid) {
            grid.style.display = key === frameId ? 'grid' : 'none';
        }
    });
    
    container.style.display = 'block';
    
    setTimeout(() => {
        const activeFrame = frames[frameId];
        if (activeFrame) {
            activeFrame.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 400);
}

function closeExpandedFrame() {
    const frames = [
        document.getElementById('frame-billiards'),
        document.getElementById('frame-motorcycles'),
        document.getElementById('frame-life')
    ];
    
    const container = document.getElementById('photoGridContainer');
    
    frames.forEach(frame => {
        if (frame) {
            frame.classList.remove('active-frame', 'collapsed-frame');
        }
    });
    
    if (container) {
        container.style.display = 'none';
    }
    
    setTimeout(() => {
        const gallerySection = document.getElementById('gallery');
        if (gallerySection) {
            gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

let activeAlbumImages = [];
let currentImageIndex = -1;

function openLightbox(itemEl, imgSrc, captionText) {
    const img = itemEl.querySelector('img');
    if (img && img.style.display === 'none') {
        return;
    }
    
    const lightbox = document.getElementById('photoLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const caption = document.getElementById('lightboxCaption');
    
    if (!lightbox || !lightboxImg || !caption) return;
    
    const activeGrid = itemEl.closest('.photo-grid');
    if (activeGrid) {
        const allItems = Array.from(activeGrid.querySelectorAll('.gallery-item'));
        activeAlbumImages = allItems.filter(item => {
            const itemImg = item.querySelector('img');
            return itemImg && itemImg.style.display !== 'none';
        });
        currentImageIndex = activeAlbumImages.indexOf(itemEl);
    } else {
        activeAlbumImages = [itemEl];
        currentImageIndex = 0;
    }
    
    lightboxImg.src = imgSrc;
    
    if (captionText) {
        caption.textContent = captionText;
        caption.style.display = 'block';
    } else {
        caption.style.display = 'none';
    }
    
    lightbox.classList.add('active');
    updateLightboxNavArrows();
}

function updateLightboxNavArrows() {
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    if (!prevBtn || !nextBtn) return;
    
    if (activeAlbumImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
    }
}

function navigateLightbox(direction) {
    if (activeAlbumImages.length <= 1) return;
    
    currentImageIndex += direction;
    if (currentImageIndex < 0) {
        currentImageIndex = activeAlbumImages.length - 1;
    } else if (currentImageIndex >= activeAlbumImages.length) {
        currentImageIndex = 0;
    }
    
    const nextItem = activeAlbumImages[currentImageIndex];
    if (nextItem) {
        const nextImg = nextItem.querySelector('img');
        const lightboxImg = document.getElementById('lightboxImg');
        const caption = document.getElementById('lightboxCaption');
        
        if (nextImg && lightboxImg) {
            lightboxImg.style.opacity = 0;
            setTimeout(() => {
                lightboxImg.src = nextImg.src;
                lightboxImg.style.opacity = 1;
                
                if (caption) {
                    caption.style.display = 'none';
                }
            }, 150);
        }
    }
}

function closeLightbox(event) {
    const lightbox = document.getElementById('photoLightbox');
    if (!lightbox) return;
    
    if (
        event.target.id === 'photoLightbox' || 
        event.target.classList.contains('lightbox-close') || 
        event.target.closest('.lightbox-close')
    ) {
        lightbox.classList.remove('active');
    }
}

// ========================================
// 3D PARALLAX TILT EFFECT FOR GALLERY FRAMES
// ========================================
function init3DTiltEffect() {
    const frames = document.querySelectorAll('.gallery-frame');
    
    frames.forEach(frame => {
        let glare = frame.querySelector('.frame-glare');
        if (!glare) {
            glare = document.createElement('div');
            glare.className = 'frame-glare';
            frame.appendChild(glare);
        }

        // Cache the bounding client rect on mouseenter to prevent layout thrashing on mousemove
        let rect = null;

        frame.addEventListener('mouseenter', () => {
            rect = frame.getBoundingClientRect();
            frame.style.transition = 'none';
        });

        frame.addEventListener('mousemove', (e) => {
            if (frame.classList.contains('active-frame')) {
                frame.style.transform = '';
                glare.style.opacity = '0';
                return;
            }

            if (!rect) {
                rect = frame.getBoundingClientRect();
            }

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const width = rect.width;
            const height = rect.height;
            
            const maxTilt = 10;
            const tiltX = ((y / height) - 0.5) * -maxTilt * 2;
            const tiltY = ((x / width) - 0.5) * maxTilt * 2;
            
            frame.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
            
            const glareX = (x / width) * 100;
            const glareY = (y / height) * 100;
            glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.16) 0%, transparent 65%)`;
            glare.style.opacity = '1';
        });

        frame.addEventListener('mouseleave', () => {
            frame.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            frame.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
            glare.style.opacity = '0';
            rect = null; // Clear cached rect
        });
    });
}

// Initialize Swiper for Music Section
if (typeof Swiper !== 'undefined') {
    const musicSwiper = new Swiper('.music-swiper', {
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
            slideShadows: false,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        // Disable touch/drag on iframe slides to prevent jank
        simulateTouch: false,
        allowTouchMove: false,
    });

    // ========================================
    // SINGLE SONG PLAYBACK
    // Pause all Spotify iframes except the active slide
    // ========================================
    function pauseAllSpotifyExceptActive() {
        const allIframes = document.querySelectorAll('.music-swiper .swiper-slide iframe');
        const activeSlide = document.querySelector('.music-swiper .swiper-slide-active');
        const activeIframe = activeSlide ? activeSlide.querySelector('iframe') : null;

        allIframes.forEach(iframe => {
            if (iframe !== activeIframe) {
                // Send pause command via Spotify Embed API
                iframe.contentWindow.postMessage({ command: 'pause' }, '*');
            }
        });
    }

    // Pause non-active songs whenever the slide changes
    musicSwiper.on('slideChange', () => {
        pauseAllSpotifyExceptActive();
    });

    // Also pause when user clicks navigation arrows
    musicSwiper.on('slideChangeTransitionEnd', () => {
        pauseAllSpotifyExceptActive();
    });
}
