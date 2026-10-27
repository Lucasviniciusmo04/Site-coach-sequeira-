gsap.registerPlugin(ScrollTrigger);
gsap.config({ force3D: true });

let currentLang = 'pt';

function toggleLanguage() {
    currentLang = currentLang === 'pt' ? 'en' : 'pt';
    document.documentElement.lang = currentLang;
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
        langBtn.innerText = currentLang === 'pt' ? 'EN' : 'PT';
    }

    document.querySelectorAll('[data-i18n-pt]').forEach(el => {
        el.innerHTML = el.getAttribute(`data-i18n-${currentLang}`);
    });
}

function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');

    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }
}

function toggleManifestoAudio(cardEl) {
    const targetVideo = cardEl.querySelector('.manifesto-video');
    if (!targetVideo) return;

    const allCards = document.querySelectorAll('.manifesto-video-card');
    const willUnmute = targetVideo.muted;

    allCards.forEach(card => {
        const video = card.querySelector('.manifesto-video');
        const icon = card.querySelector('.manifesto-audio-icon');
        const btn = card.querySelector('.manifesto-audio-btn');

        if (!video) return;

        if (card === cardEl && willUnmute) {
            video.muted = false;
            video.play().catch(() => {});
            if (icon) {
                icon.classList.remove('fa-volume-xmark');
                icon.classList.add('fa-volume-high');
            }
            if (btn) {
                btn.classList.add('bg-[#3B4A37]', 'border-[#3B4A37]');
            }
        } else {
            video.muted = true;
            if (icon) {
                icon.classList.remove('fa-volume-high');
                icon.classList.add('fa-volume-xmark');
            }
            if (btn) {
                btn.classList.remove('bg-[#3B4A37]', 'border-[#3B4A37]');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('theme-icon');

    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 1. HERO 3D PARALLAX (#home) — Otimizado com gsap.quickTo (ligado ao gsap.ticker sem criar novos tweens a cada mousemove)
    const heroSection = document.getElementById('home');
    const heroTitle = document.getElementById('hero-title');
    const layers = Array.from(document.querySelectorAll('#home .layer'));

    if (heroSection && heroTitle) {
        const rotYTo = gsap.quickTo(heroTitle, 'rotationY', { duration: 0.6, ease: 'power2.out' });
        const rotXTo = gsap.quickTo(heroTitle, 'rotationX', { duration: 0.6, ease: 'power2.out' });
        const layerControllers = layers.map(layer => ({
            el: layer,
            speed: Number(layer.getAttribute('data-speed')) || 20,
            xTo: gsap.quickTo(layer, 'x', { duration: 0.7, ease: 'power2.out' }),
            yTo: gsap.quickTo(layer, 'y', { duration: 0.7, ease: 'power2.out' })
        }));

        heroSection.addEventListener('mousemove', (e) => {
            const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
            const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
            rotYTo(xVal * 6);
            rotXTo(-yVal * 6);
            for (let i = 0; i < layerControllers.length; i++) {
                const ctrl = layerControllers[i];
                ctrl.xTo(xVal * ctrl.speed);
                ctrl.yTo(yVal * ctrl.speed);
            }
        }, { passive: true });

        heroSection.addEventListener('mouseleave', () => {
            rotYTo(0);
            rotXTo(0);
            for (let i = 0; i < layerControllers.length; i++) {
                layerControllers[i].xTo(0);
                layerControllers[i].yTo(0);
            }
        }, { passive: true });
    }

    // 2. EXPERIENCE WIPE & CLIP-PATH (#experience — scrub: 0.15, anticipatePin: 1)
    const expSection = document.getElementById('experience');
    if (expSection) {
        const tlExp = gsap.timeline({
            scrollTrigger: {
                trigger: '#experience',
                start: 'top top',
                end: '+=1300',
                pin: true,
                scrub: 0.15,
                anticipatePin: 1,
                fastScrollEnd: true,
                invalidateOnRefresh: true
            }
        });
        tlExp.to('#photo-mask', { clipPath: 'inset(18% 32% 18% 32%)', ease: 'power2.inOut', duration: 2.5, force3D: true })
             .to('.logo-wipe-reveal', { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', ease: 'power3.inOut', duration: 1.8, force3D: true }, '-=1.0')
             .to('#exp-text-container', { opacity: 1, y: -10, duration: 0.5, ease: 'power2.out', force3D: true }, '-=0.2');
    }

    // 3. HORIZONTAL SCROLL DAS TRANSFORMAÇÕES (#athletes-gallery — scrub: 0.15, anticipatePin: 1, GPU x)
    const athletesSection = document.getElementById('athletes-gallery');
    const athletesContainer = document.querySelector('.athletes-cards-container');
    if (athletesSection && athletesContainer) {
        const getScrollAmount = () => Math.max(0, athletesContainer.scrollWidth - window.innerWidth);

        gsap.to(athletesContainer, {
            x: () => -getScrollAmount(),
            ease: 'none',
            force3D: true,
            scrollTrigger: {
                trigger: athletesSection,
                start: 'top top',
                end: () => `+=${getScrollAmount()}`,
                pin: true,
                scrub: 0.15,
                anticipatePin: 1,
                fastScrollEnd: true,
                invalidateOnRefresh: true
            }
        });
    }

    // 4. EVOLUÇÃO FÍSICA (#evolution-section — scrub: 0.15, anticipatePin: 1, scaleX por GPU e cache de índice)
    const EVOLUTION_DATA = [
        {
            img: 'assets/img/sequeira/IMG_0975.jpg',
            phase: 'FASE 01 / O INÍCIO',
            title: 'O Ponto de Partida',
            desc: 'Onde a disciplina substituiu a motivação. Construção das fundações técnicas e respeito absoluto pela biomecânica.'
        },
        {
            img: 'assets/img/sequeira/IMG_0980.jpg',
            phase: 'FASE 02 / CONSTRUÇÃO',
            title: 'Anos de Sobrecarga',
            desc: 'Consistência silenciosa em off-season. Progressão de cargas registada ao detalhe para criar volume muscular real.'
        },
        {
            img: 'assets/img/sequeira/IMG_0981.jpg',
            phase: 'FASE 03 / PRIMEIRO PALCO',
            title: 'Estreia Competitiva',
            desc: 'O primeiro teste debaixo das luzes. A confirmação de que o rigor científico na preparação dita o resultado.'
        },
        {
            img: 'assets/img/sequeira/IMG_0982.jpg',
            phase: 'FASE 04 / DENSIDADE',
            title: 'Maturidade Muscular',
            desc: 'Refinamento de proporções, linha de cintura compacta e uma condição física extrema alcançada sem atalhos.'
        },
        {
            img: 'assets/img/sequeira/champ_01.jpg',
            phase: 'FASE 05 / ELITE PRO',
            title: 'Estatuto WNBF Pro',
            desc: 'O culminar de anos de jogo longo: conquista do Pro Card e consolidação na elite mundial do culturismo natural.'
        }
    ];

    const imagesStack = document.getElementById('evo-images-stack');
    const textStack = document.getElementById('evo-text-stack');
    const phaseNav = document.getElementById('evo-phase-nav');
    const counterCurrent = document.getElementById('evo-counter-current');
    const counterTotal = document.getElementById('evo-counter-total');
    const progressBar = document.getElementById('evo-progress-bar');
    const mobilePhaseLabel = document.getElementById('evo-mobile-phase-label');

    if (imagesStack && textStack) {
        const total = EVOLUTION_DATA.length;
        counterTotal.textContent = String(total).padStart(2, '0');

        EVOLUTION_DATA.forEach((item, index) => {
            const isFirst = index === 0;

            const imgEl = document.createElement('img');
            imgEl.src = item.img;
            imgEl.alt = `${item.phase} - ${item.title}`;
            imgEl.decoding = 'async';
            imgEl.className = 'evo-slide-img absolute inset-0 w-full h-full object-cover object-center transform-gpu will-change-transform';
            imgEl.style.zIndex = index + 1;
            imagesStack.appendChild(imgEl);

            const textEl = document.createElement('div');
            textEl.className = `evo-slide-text ${isFirst ? 'relative' : 'absolute inset-0'} flex flex-col justify-center transform-gpu`;
            textEl.innerHTML = `
                <span class="font-euro text-charcoal text-[11px] md:text-xs font-bold uppercase tracking-[0.35em] mb-2 block">
                    ${item.phase}
                </span>
                <h3 class="font-euro-extd text-2xl md:text-4xl text-pure-white italic uppercase tracking-tighter mb-4 leading-none">
                    ${item.title}
                </h3>
                <p class="font-euro text-aluminium text-xs md:text-sm uppercase tracking-wider leading-relaxed border-l-2 border-charcoal pl-4">
                    ${item.desc}
                </p>
            `;
            textStack.appendChild(textEl);

            if (phaseNav) {
                const navItem = document.createElement('button');
                navItem.type = 'button';
                navItem.className = 'evo-nav-item flex items-center gap-3 text-left transition-colors duration-200 cursor-pointer group';
                navItem.setAttribute('data-index', index);
                navItem.innerHTML = `
                    <span class="evo-nav-dot w-2 h-2 rounded-full transition-transform duration-200 ${isFirst ? 'bg-charcoal scale-125' : 'bg-white/20 group-hover:bg-white/50'}"></span>
                    <span class="evo-nav-label font-euro text-[11px] uppercase tracking-[0.25em] transition-colors duration-200 ${isFirst ? 'text-pure-white font-bold' : 'text-white/30 group-hover:text-white/70'}">
                        ${item.phase}
                    </span>
                `;
                phaseNav.appendChild(navItem);
            }
        });

        const slides = gsap.utils.toArray('.evo-slide-img');
        const texts = gsap.utils.toArray('.evo-slide-text');
        const navItems = gsap.utils.toArray('.evo-nav-item');

        gsap.set(slides[0], { opacity: 1, scale: 1, force3D: true });
        gsap.set(slides.slice(1), { opacity: 0, scale: 1.05, force3D: true });

        gsap.set(texts[0], { opacity: 1, y: 0, force3D: true });
        gsap.set(texts.slice(1), { opacity: 0, y: 24, force3D: true });

        if (progressBar) {
            gsap.set(progressBar, { scaleX: 1 / total, transformOrigin: 'left center', force3D: true });
        }

        let lastActiveIndex = 0;

        function updateActiveStage(activeIndex) {
            if (activeIndex === lastActiveIndex) return;
            lastActiveIndex = activeIndex;

            counterCurrent.textContent = String(activeIndex + 1).padStart(2, '0');
            if (mobilePhaseLabel) {
                mobilePhaseLabel.textContent = EVOLUTION_DATA[activeIndex].phase;
            }
            const jumpLabel = document.getElementById('evo-jump-final-label');
            if (jumpLabel) {
                if (activeIndex === total - 1) {
                    jumpLabel.textContent = currentLang === 'en' ? 'NEXT SECTION' : 'PRÓXIMA SECÇÃO';
                } else {
                    jumpLabel.textContent = currentLang === 'en' ? 'JUMP TO THE END' : 'AVANÇAR PARA O FINAL';
                }
            }
            navItems.forEach((item, idx) => {
                const dot = item.querySelector('.evo-nav-dot');
                const label = item.querySelector('.evo-nav-label');
                if (idx === activeIndex) {
                    dot.className = 'evo-nav-dot w-2 h-2 rounded-full transition-transform duration-200 bg-charcoal scale-125';
                    label.className = 'evo-nav-label font-euro text-[11px] uppercase tracking-[0.25em] transition-colors duration-200 text-pure-white font-bold';
                } else {
                    dot.className = 'evo-nav-dot w-2 h-2 rounded-full transition-transform duration-200 bg-white/20';
                    label.className = 'evo-nav-label font-euro text-[11px] uppercase tracking-[0.25em] transition-colors duration-200 text-white/30';
                }
            });
        }

        const tlEvo = gsap.timeline({
            scrollTrigger: {
                trigger: '#evolution-section',
                start: 'top top',
                end: '+=2000',
                pin: true,
                scrub: 0.15,
                anticipatePin: 1,
                fastScrollEnd: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    if (progressBar) {
                        const minRatio = 1 / total;
                        const currentScale = minRatio + self.progress * (1 - minRatio);
                        gsap.set(progressBar, { scaleX: currentScale, force3D: true });
                    }

                    const activeIndex = Math.min(
                        total - 1,
                        Math.round(self.progress * (total - 1))
                    );
                    updateActiveStage(activeIndex);
                }
            }
        });

        for (let i = 0; i < total - 1; i++) {
            const stepLabel = `evo-step-${i}`;
            tlEvo.to({}, { duration: 0.35 });

            tlEvo.addLabel(stepLabel)
                .to(slides[i], {
                    scale: 0.98,
                    duration: 1,
                    ease: 'power2.inOut',
                    force3D: true
                }, stepLabel)
                .to(slides[i + 1], {
                    opacity: 1,
                    scale: 1,
                    duration: 1,
                    ease: 'power2.inOut',
                    force3D: true
                }, stepLabel)
                .to(texts[i], {
                    opacity: 0,
                    y: -20,
                    duration: 0.45,
                    ease: 'power2.in',
                    force3D: true
                }, stepLabel)
                .to(texts[i + 1], {
                    opacity: 1,
                    y: 0,
                    duration: 0.55,
                    ease: 'power2.out',
                    force3D: true
                }, `${stepLabel}+=0.45`);
        }

        tlEvo.to({}, { duration: 0.35 });

        function scrollToProgress(targetProgress) {
            const st = tlEvo.scrollTrigger;
            if (!st) return;
            const targetY = st.start + (st.end - st.start) * gsap.utils.clamp(0, 1, targetProgress);
            window.scrollTo({ top: targetY, behavior: 'smooth' });
        }

        const jumpFinalBtn = document.getElementById('evo-jump-final-btn');
        if (jumpFinalBtn) {
            jumpFinalBtn.addEventListener('click', () => {
                const st = tlEvo.scrollTrigger;
                if (!st) return;
                if (st.progress >= 0.95) {
                    const nextSection = document.getElementById('vision-reveal');
                    if (nextSection) {
                        nextSection.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        window.scrollTo({ top: st.end + 100, behavior: 'smooth' });
                    }
                } else {
                    scrollToProgress(1);
                }
            });
        }

        navItems.forEach((item, idx) => {
            item.addEventListener('click', () => {
                const targetProgress = idx / (total - 1);
                scrollToProgress(targetProgress);
            });
        });

        const progressTrack = document.getElementById('evo-progress-track');
        if (progressTrack) {
            progressTrack.addEventListener('click', (e) => {
                const rect = progressTrack.getBoundingClientRect();
                const clickRatio = (e.clientX - rect.left) / rect.width;
                scrollToProgress(clickRatio);
            });
        }
    }

    // 5. VISION REVEAL (#vision-reveal — scrub: true, sem conflito de transition-all no badge)
    const visionSection = document.getElementById('vision-reveal');
    const visionWrapper = document.getElementById('vision-img-wrapper');
    const visionUiBadge = document.getElementById('vision-ui-badge');

    if (visionSection && visionWrapper) {
        gsap.fromTo(
            visionWrapper,
            { clipPath: 'inset(30% 30% 30% 30%)' },
            {
                clipPath: 'inset(0% 0% 0% 0%)',
                ease: 'power2.out',
                force3D: true,
                scrollTrigger: {
                    trigger: visionSection,
                    start: 'top bottom',
                    end: 'center center',
                    scrub: true
                }
            }
        );

        if (visionUiBadge) {
            gsap.fromTo(
                visionUiBadge,
                { y: 16, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.9,
                    ease: 'power3.out',
                    force3D: true,
                    scrollTrigger: {
                        trigger: visionSection,
                        start: 'top 45%'
                    }
                }
            );
        }
    }

    // 6. ACHIEVEMENTS VERTICAL PARALLAX (#achievements — scrub: true, force3D: true)
    const achievCards = gsap.utils.toArray('.achiev-card');
    if (achievCards.length > 0) {
        achievCards.forEach((card, index) => {
            const speed = index % 2 === 0 ? -60 : -20;
            gsap.fromTo(
                card,
                { y: 30 },
                {
                    y: speed,
                    ease: 'none',
                    force3D: true,
                    scrollTrigger: {
                        trigger: '#achievements',
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true
                    }
                }
            );
        });
    }

    // 7. TELEMETRY CARDS STAGGER (#athlete-telemetry — force3D: true)
    const telemetryCards = gsap.utils.toArray('#athlete-telemetry .telemetry-card');
    if (telemetryCards.length > 0) {
        gsap.fromTo(
            telemetryCards,
            { opacity: 0, y: 36 },
            {
                opacity: 1,
                y: 0,
                duration: 0.7,
                stagger: 0.12,
                ease: 'power3.out',
                force3D: true,
                scrollTrigger: {
                    trigger: '#athlete-telemetry',
                    start: 'top 78%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // 8. STORE-REVEAL INTERSECTION OBSERVER (INSTÂNCIA ÚNICA)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            entry.target.classList.toggle('active', entry.isIntersecting);
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.store-reveal').forEach(el => {
        revealObserver.observe(el);
    });
});

// Recálculo seguro de todos os pinos apenas após o carregamento completo de imagens e fontes
window.addEventListener('load', () => {
    ScrollTrigger.refresh();
}, { once: true });
