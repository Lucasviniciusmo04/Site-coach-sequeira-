gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. SISTEMA DE DARK/LIGHT MODE (TEMA)
// ==========================================
function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if(themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if(themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('theme-icon');
    
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        if(themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }
});

// ==========================================
// 2. SISTEMA DE VISTAS (PÁGINAS) E ACORDEÃO
// ==========================================
function showView(viewId) {
    window.scrollTo(0, 0); 
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    
    const targetView = document.getElementById(viewId);
    if(targetView) targetView.classList.add('active');
    
    const mainNav = document.getElementById('main-nav');
    const backNav = document.getElementById('back-nav');

    if(viewId === 'main-view') {
        if(mainNav) { mainNav.classList.remove('hidden'); mainNav.classList.add('lg:flex'); }
        if(backNav) backNav.classList.add('hidden');
    } else {
        if(mainNav) mainNav.classList.add('hidden');
        if(backNav) backNav.classList.remove('hidden');
    }
    setTimeout(() => { ScrollTrigger.refresh(); }, 50);
}

function toggleAccordion(element) {
    const content = element.nextElementSibling;
    const parent = element.parentElement;
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        parent.classList.remove('accordion-active');
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        parent.classList.add('accordion-active');
    }
}

// ==========================================
// 3. ANIMAÇÕES GSAP MASTER
// ==========================================

// HERO 3D EFFECT
const heroSection = document.querySelector('#home');
const heroTitle = document.querySelector('#hero-title');
const layers = document.querySelectorAll('.layer');

if(heroSection && heroTitle) {
    heroSection.addEventListener('mousemove', (e) => {
        const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
        const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(heroTitle, { rotationY: xVal * 30, rotationX: -yVal * 30, duration: 1.2, ease: "power2.out" });
        layers.forEach(layer => {
            const speed = layer.getAttribute('data-speed') || 20;
            gsap.to(layer, { x: xVal * (speed * 1.5), y: yVal * (speed * 1.5), duration: 1.5, ease: "power2.out" });
        });
    });

    heroSection.addEventListener('mouseleave', () => {
        gsap.to([heroTitle, ...layers], { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: 2, ease: "elastic.out(1, 0.3)" });
    });
}

// WIPE EFFECT FOTO (EXPERIENCE)
const expSection = document.querySelector('#experience');
if(expSection) {
    const tlExp = gsap.timeline({ scrollTrigger: { trigger: "#experience", start: "top top", end: "+=2000", pin: true, scrub: 1.2 } });
    tlExp.to("#photo-mask", { clipPath: "inset(18% 32% 18% 32%)", ease: "power2.inOut", duration: 2.5 });
    tlExp.to(".logo-wipe-reveal", { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", ease: "power3.inOut", duration: 1.8 }, "-=1.0");
    tlExp.to("#exp-text-container", { opacity: 1, y: -10, duration: 0.5, ease: "power2.out" }, "-=0.2");
}

// HORIZONTAL SCROLL DOS ATLETAS (TEAM SEQUEIRA)
const athletesContainer = document.querySelector(".athletes-cards-container");
if(athletesContainer) {
    gsap.to(athletesContainer, {
        x: () => -(athletesContainer.scrollWidth - window.innerWidth / 1.8),
        ease: "none",
        scrollTrigger: { trigger: "#athletes-gallery", pin: true, scrub: 1, start: "top top", end: () => "+=" + athletesContainer.scrollWidth }
    });
}

// THE VISION - LIGHT LEAK BRANCO/PRATA E PARALLAX
const visionSection = document.querySelector('#vision-reveal');
const visionWrapper = document.querySelector('#vision-img-wrapper');
const visionImg = document.querySelector('#vision-img');
const visionLightLeak = document.querySelector('#vision-light-leak');
const visionUiBadge = document.querySelector('#vision-ui-badge');
const scrollLine = document.querySelector('#scroll-line-indicator');

if (visionSection && visionWrapper && visionImg) {
    let tlVision = gsap.timeline({
        scrollTrigger: {
            trigger: visionSection,
            start: "top bottom",
            end: "center center",
            scrub: 1.2
        }
    });

    tlVision.fromTo(visionWrapper, 
        { clipPath: "inset(30% 30% 30% 30%)", borderRadius: "10px" },
        { clipPath: "inset(0% 0% 0% 0%)", borderRadius: "0px", ease: "power2.out" }
    );

    tlVision.fromTo(visionImg,
        { filter: "grayscale(100%) brightness(50%)" },
        { filter: "grayscale(100%) brightness(50%)", ease: "power2.out" },
        "<"
    );

    if (visionUiBadge) {
        gsap.to(visionUiBadge, {
            y: "0%",
            opacity: 1,
            duration: 1.2,
            ease: "power4.out",
            scrollTrigger: {
                trigger: visionSection,
                start: "top 40%", 
            }
        });
    }

    if (visionLightLeak) {
        visionWrapper.addEventListener('mousemove', (e) => {
            const rect = visionWrapper.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top;  

            gsap.to(visionLightLeak, {
                background: `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.2) 0%, transparent 70%)`,
                duration: 0.3,
                ease: "power1.out"
            });
        });

        visionWrapper.addEventListener('mouseleave', () => {
            gsap.to(visionLightLeak, {
                background: `radial-gradient(circle at center, rgba(255, 255, 255, 0) 0%, transparent 70%)`,
                duration: 0.8,
                ease: "power2.out"
            });
        });
    }

    if(scrollLine) {
        gsap.to(scrollLine, {
            y: "100%",
            duration: 1.5,
            repeat: -1,
            ease: "power3.inOut"
        });
    }
}

// PARALLAX VERTICAL NAS FOTOS DOS ACHIEVEMENTS
const achievCards = gsap.utils.toArray('.achiev-card');
if(achievCards.length > 0) {
    achievCards.forEach((card, index) => {
        let speed = (index % 2 === 0) ? -60 : -20;
        gsap.fromTo(card,
            { y: 30 },
            {
                y: speed,
                ease: "none",
                scrollTrigger: {
                    trigger: "#achievements",
                    start: "top bottom", 
                    end: "bottom top",  
                    scrub: true         
                }
            }
        );
    });
} 

// ==========================================
// 4. EFEITO STORE-REVEAL (ENTRADA E SAÍDA DOS CARDS E TÍTULOS)
// ==========================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            // Entra no ecrã -> Ativa a animação original
            entry.target.classList.add('active');
        } else {
            // Sai do ecrã -> Remove a classe para repetir perfeitamente
            entry.target.classList.remove('active');
        }
    });
}, { 
    threshold: 0.10, 
    rootMargin: "0px 0px -50px 0px"
});

// Aplica a todos os elementos com a classe .store-reveal (Título e os 4 Cards)
document.querySelectorAll('.store-reveal').forEach(el => {
    revealObserver.observe(el);
});
// ==========================================
// 5. EFEITO PARALLAX NAS NOVAS ABAS (VISTAS)
// ==========================================
// Encontra todas as galerias parallax dentro das tuas vistas
const galleries = gsap.utils.toArray('.parallax-gallery-section');

if (galleries.length > 0) {
    galleries.forEach(gallery => {
        // Encontra as imagens flutuantes DENTRO dessa galeria específica
        const photos = gallery.querySelectorAll('.floating-photo');
        
        photos.forEach(photo => {
            const speed = photo.getAttribute('data-speed') || 1;
            
            gsap.to(photo, {
                y: () => -window.innerHeight * speed, 
                ease: "none",
                scrollTrigger: {
                    trigger: gallery,
                    start: "top bottom", 
                    end: "bottom top",   
                    scrub: 1.5 // Atrasa um bocadinho o movimento para ficar super suave
                }
            });
        });
    });
}