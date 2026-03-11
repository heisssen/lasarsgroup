document.addEventListener('DOMContentLoaded', () => {

    // 1. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu   = document.getElementById('mobile-menu');
    const mobileLinks  = document.querySelectorAll('.mobile-link, .mobile-apply');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('active');
            document.body.style.overflow = isOpen ? 'hidden' : '';

            const spans = mobileToggle.querySelectorAll('span');
            if (isOpen) {
                spans[0].style.transform = 'rotate(45deg) translate(1px, -1px)';
                spans[1].style.opacity  = '0';
                spans[1].style.transform = 'scaleX(0)';
                spans[2].style.transform = 'rotate(-45deg) translate(1px, 1px)';
            } else {
                spans.forEach(s => { s.style.transform = 'none'; s.style.opacity = '1'; });
            }
        });

        const closeMenu = () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
            mobileToggle.querySelectorAll('span').forEach(s => {
                s.style.transform = 'none'; s.style.opacity = '1';
            });
        };

        mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) closeMenu();
        });
    }

    // 2. Header Scroll Effect
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });
    }

    // 3. FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            faqItems.forEach(faq => {
                faq.classList.remove('active');
                const ans = faq.querySelector('.faq-answer');
                if (ans) ans.style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // 4. Form Submission
    const applyForm  = document.getElementById('applyForm');
    const formStatus = document.getElementById('formStatus');

    if (applyForm) {
        applyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = applyForm.querySelector('button[type="submit"]');
            const orig = btn.textContent;

            btn.textContent = 'Відправляємо...';
            btn.disabled = true;

            setTimeout(() => {
                applyForm.reset();
                btn.textContent = orig;
                btn.disabled = false;

                if (formStatus) {
                    formStatus.style.display = 'block';
                    setTimeout(() => { formStatus.style.display = 'none'; }, 5000);
                }
            }, 1500);
        });
    }

    // 5. Gallery — Momentum Drag Slider
    const slider     = document.getElementById('galleryScroll');
    const track      = document.getElementById('galleryTrack');
    const dotsWrap   = document.getElementById('galleryDots');
    const btnPrev    = document.querySelector('.gallery-arrow.prev');
    const btnNext    = document.querySelector('.gallery-arrow.next');

    if (slider && track) {
        const items   = Array.from(track.querySelectorAll('.gallery-item'));
        const count   = items.length;

        // ── Build dots ──────────────────────────────────────────────
        if (dotsWrap) {
            items.forEach((_, i) => {
                const d = document.createElement('div');
                d.className = 'gallery-dot' + (i === 0 ? ' active' : '');
                d.addEventListener('click', () => scrollToIndex(i));
                dotsWrap.appendChild(d);
            });
        }

        function updateDots(activeIdx) {
            if (!dotsWrap) return;
            dotsWrap.querySelectorAll('.gallery-dot').forEach((d, i) => {
                d.classList.toggle('active', i === activeIdx);
            });
        }

        // ── Find nearest item index from scrollLeft ──────────────────
        function getNearestIndex() {
            const containerCenter = slider.scrollLeft + slider.offsetWidth / 2;
            let closest = 0, minDist = Infinity;
            items.forEach((item, i) => {
                const itemCenter = item.offsetLeft + item.offsetWidth / 2;
                const dist = Math.abs(containerCenter - itemCenter);
                if (dist < minDist) { minDist = dist; closest = i; }
            });
            return closest;
        }

        // ── Smooth scroll to item index ──────────────────────────────
        function scrollToIndex(idx) {
            const item = items[idx];
            if (!item) return;
            const targetScroll = item.offsetLeft - (slider.offsetWidth - item.offsetWidth) / 2;
            smoothScrollTo(targetScroll);
            updateDots(idx);
        }

        // ── RAF-based smooth scroll to target X ─────────────────────
        let rafId = null;

        function smoothScrollTo(target) {
            cancelAnimationFrame(rafId);
            target = Math.max(0, Math.min(target, slider.scrollWidth - slider.offsetWidth));

            function step() {
                const diff = target - slider.scrollLeft;
                if (Math.abs(diff) < 0.5) {
                    slider.scrollLeft = target;
                    return;
                }
                slider.scrollLeft += diff * 0.1;
                rafId = requestAnimationFrame(step);
            }

            rafId = requestAnimationFrame(step);
        }

        // ── Arrows ───────────────────────────────────────────────────
        if (btnPrev) btnPrev.addEventListener('click', () => {
            scrollToIndex(Math.max(0, getNearestIndex() - 1));
        });

        if (btnNext) btnNext.addEventListener('click', () => {
            scrollToIndex(Math.min(count - 1, getNearestIndex() + 1));
        });

        // ── Mouse drag with momentum ─────────────────────────────────
        let isDragging  = false;
        let startX      = 0;
        let startScroll = 0;
        let lastX       = 0;
        let lastTime    = 0;
        let velocity    = 0;

        slider.addEventListener('mousedown', (e) => {
            cancelAnimationFrame(rafId);
            isDragging  = true;
            startX      = e.pageX - slider.offsetLeft;
            startScroll = slider.scrollLeft;
            lastX       = e.pageX;
            lastTime    = Date.now();
            velocity    = 0;
            slider.classList.add('is-dragging');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const x    = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.2;
            slider.scrollLeft = startScroll - walk;

            const now  = Date.now();
            const dt   = now - lastTime;
            if (dt > 0) {
                velocity = (e.pageX - lastX) / dt;
            }
            lastX    = e.pageX;
            lastTime = now;
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            slider.classList.remove('is-dragging');
            applyMomentum();
        });

        // ── Touch drag with momentum ─────────────────────────────────
        let touchStartX      = 0;
        let touchScrollLeft  = 0;
        let touchLastX       = 0;
        let touchLastTime    = 0;
        let touchVelocity    = 0;

        slider.addEventListener('touchstart', (e) => {
            cancelAnimationFrame(rafId);
            touchStartX     = e.touches[0].pageX;
            touchScrollLeft = slider.scrollLeft;
            touchLastX      = e.touches[0].pageX;
            touchLastTime   = Date.now();
            touchVelocity   = 0;
        }, { passive: true });

        slider.addEventListener('touchmove', (e) => {
            const now  = Date.now();
            const dt   = now - touchLastTime;
            const x    = e.touches[0].pageX;
            if (dt > 0) touchVelocity = (x - touchLastX) / dt;
            touchLastX    = x;
            touchLastTime = now;
            slider.scrollLeft = touchScrollLeft + (touchStartX - x);
        }, { passive: true });

        slider.addEventListener('touchend', () => {
            velocity = touchVelocity;
            applyMomentum();
        }, { passive: true });

        // ── Momentum: fling + snap to nearest ────────────────────────
        function applyMomentum() {
            cancelAnimationFrame(rafId);

            let vel = velocity * 18; // amplify touch/mouse velocity
            let pos = slider.scrollLeft;

            function fling() {
                if (Math.abs(vel) < 0.5) {
                    // Snap to nearest after momentum dies
                    snapToNearest();
                    return;
                }
                pos -= vel;
                vel *= 0.92; // friction
                pos  = Math.max(0, Math.min(pos, slider.scrollWidth - slider.offsetWidth));
                slider.scrollLeft = pos;
                rafId = requestAnimationFrame(fling);
            }

            rafId = requestAnimationFrame(fling);
        }

        function snapToNearest() {
            const idx = getNearestIndex();
            scrollToIndex(idx);
        }

        // ── Update dots on manual scroll ─────────────────────────────
        let scrollTimer;
        slider.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                updateDots(getNearestIndex());
            }, 80);
        }, { passive: true });

        // ── Keyboard arrows when focused ─────────────────────────────
        slider.setAttribute('tabindex', '0');
        slider.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft')  scrollToIndex(Math.max(0, getNearestIndex() - 1));
            if (e.key === 'ArrowRight') scrollToIndex(Math.min(count - 1, getNearestIndex() + 1));
        });

        // Init position — center first slide
        setTimeout(() => scrollToIndex(0), 50);
    }
});
