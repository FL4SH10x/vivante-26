// ==========================================================================
// === UNIVERSAL MASTER SCRIPT.JS (PRODUCTION READY)
// === Powers: Glitch HUD, Doomsday Audio/Clock, Ghost Cursor, Games & Shop
// ==========================================================================
// Force the browser to scroll to the top on every refresh
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
const DoomsdayAudio = (() => {
    let audioCtx = null;
    let masterGain = null;
    let isAudible = true;
    let shouldPlayLoop = false; // Arms the audio to play after video
    let hasLoopStarted = false; // Ensures it only triggers once

    const backgroundLoop = new Audio('sounds/doomsday_tick.mp3'); 
    backgroundLoop.loop = true;  
    backgroundLoop.volume = 1.0; 

    const unlockAudio = () => {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
            masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
            masterGain.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        // Notice we do NOT play the audio here anymore to prevent freezing.
    };

    const armDoomsdaySequence = () => {
        shouldPlayLoop = true; // Tells the clock it is allowed to start the audio
    };

    const playTick = () => {
        // When the clock ticks, if the sequence is armed and hasn't started yet, play it!
        if (shouldPlayLoop && !hasLoopStarted) {
            backgroundLoop.currentTime = 0;
            backgroundLoop.play().catch(e => console.warn("Loop blocked:", e));
            hasLoopStarted = true;
        }
    };

    const playBeep = (type) => {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (!audioCtx || !masterGain) return;

        const osc = audioCtx.createOscillator();
        const gn = audioCtx.createGain();
        const flt = audioCtx.createBiquadFilter();

        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.connect(gn);
        gn.connect(flt);
        flt.connect(masterGain);

        if (type === 'hover') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(120, audioCtx.currentTime);
            gn.gain.setValueAtTime(0, audioCtx.currentTime);
            gn.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.01);
            gn.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.05);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
            gn.gain.setValueAtTime(0, audioCtx.currentTime);
            gn.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
            gn.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.15);
        }
    };

    const handleScroll = () => {
        if (!audioCtx || !masterGain) return;

        const scrollY = window.scrollY;
        const pageHeight = window.innerHeight;
        const fadeStart = pageHeight * 0.4;
        const fadeEnd = pageHeight * 1.1;

        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);

        if (scrollY <= fadeStart) {
            isAudible = true;
            masterGain.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.05);
            backgroundLoop.volume = 1.0;
        } else if (scrollY >= fadeEnd) {
            isAudible = false;
            masterGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.05);
            backgroundLoop.volume = 0.0;
        } else {
            isAudible = true;
            const fadeProgress = (scrollY - fadeStart) / (fadeEnd - fadeStart);
            const newVolume = Math.max(0, 1.0 - fadeProgress);
            
            masterGain.gain.setTargetAtTime(newVolume, audioCtx.currentTime, 0.05);
            backgroundLoop.volume = newVolume;
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Expose the new arming function
    return { unlock: unlockAudio, tick: playTick, beep: playBeep, armSequence: armDoomsdaySequence };
})();

document.addEventListener("DOMContentLoaded", () => {
    const unlockEvents = ['click', 'touchstart', 'scroll', 'keydown'];
    const triggerUnlock = () => {
        DoomsdayAudio.unlock();
        unlockEvents.forEach(evt => window.removeEventListener(evt, triggerUnlock));
    };
    unlockEvents.forEach(evt => window.addEventListener(evt, triggerUnlock, { passive: true }));

    window.addEventListener('pageshow', (event) => { if (event.persisted) DoomsdayAudio.unlock(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') DoomsdayAudio.unlock(); });

    const audioSels = 'a, button, .stark-btn, .tva-btn, .register-btn, .agent-card, .gallery-item, .merch-card, .gear-item, .pass-box, [data-sound="true"]';
    document.addEventListener('mouseover', e => { if (e.target.closest(audioSels)) DoomsdayAudio.beep('hover'); });
    document.addEventListener('click', e => { if (e.target.closest(audioSels)) DoomsdayAudio.beep('click'); });

    function triggerRandomGlitch() {
        const glitch = document.createElement('div');
        glitch.classList.add('glitch-artifact');
        const msgs = ["/// ERROR ///", "TIMELINE UNSAFE", "0x5F_CORRUPT", "VARIANT DETECTED", "REALITY BREACH", "SYSTEM FAILURE", "## NULL ##"];
        glitch.innerText = msgs[Math.floor(Math.random() * msgs.length)];
        
        const type = ['', 'glitch-red', 'glitch-cyan'][Math.floor(Math.random() * 3)];
        if (type) glitch.classList.add(type);

        glitch.style.left = `${Math.floor(Math.random() * 90)}%`;
        glitch.style.top = `${Math.floor(Math.random() * 90)}%`;
        document.body.appendChild(glitch);

        setTimeout(() => glitch.remove(), 300 + Math.random() * 200);
        setTimeout(triggerRandomGlitch, 2000 + Math.random() * 5000);
    }
    setTimeout(triggerRandomGlitch, 5000);

    const introOverlay = document.getElementById('intro-overlay');
    const video = document.getElementById('intro-video');
    const startBtn = document.getElementById('start-btn');
    
    if (introOverlay && video && startBtn) {
        video.pause();
        video.currentTime = 0;
        startBtn.style.display = 'block';

        const finishIntro = () => {
            introOverlay.classList.add('fade-out');
            setTimeout(() => introOverlay.remove(), 1000);
            
            // The video finished. Arm the audio so it starts on the very next clock tick.
            DoomsdayAudio.armSequence(); 
        };
        video.addEventListener('ended', finishIntro);
        
        startBtn.addEventListener('click', () => {
            DoomsdayAudio.unlock();
            startBtn.style.display = 'none'; // Hide the button

            // 1. Grab the quote terminal to use as a loading screen
            const terminal = document.getElementById('quote-display');
            if (terminal) {
                terminal.style.display = 'block';
                terminal.classList.add('visible', 'glitching');
            }

            // 2. Start a slick hacker-style progress counter
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.floor(Math.random() * 15) + 5; 
                if (progress > 99) progress = 99; // Hold at 99% until video actually loads
                if (terminal) terminal.innerText = `DECRYPTING MULTIVERSE FEED... ${progress}%`;
            }, 150);

            // 3. Define the function that finally plays the video
            const startVideo = () => {
                clearInterval(progressInterval);
                if (terminal) {
                    terminal.innerText = "CONNECTION ESTABLISHED.";
                    setTimeout(() => terminal.style.display = 'none', 1000);
                }
                video.muted = false;
                video.play().catch(err => {
                    console.warn("Playback blocked or missing. Bypassing:", err);
                    finishIntro();
                });
            };

            // 4. Check if the video is already buffered. If not, wait for it.
            if (video.readyState >= 3) { // 3 = HAVE_FUTURE_DATA
                setTimeout(startVideo, 800); // Show off the loading animation briefly
            } else {
                video.load(); // Force the browser to start downloading the video
                
                // Wait for the browser to shout "I have enough data to play smoothly!"
                video.addEventListener('canplay', startVideo, { once: true });
                
                // Safety fallback: if it takes longer than 8 seconds, force play anyway
                setTimeout(() => {
                    if (video.paused) startVideo();
                }, 8000);
            }
        });
        introOverlay.addEventListener('dblclick', finishIntro);
    }

    // Ghost Cursor
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
        let cursorMain = document.getElementById('cursor-main') || Object.assign(document.createElement('div'), { id: 'cursor-main' });
        let cursorGhost = document.getElementById('cursor-ghost') || Object.assign(document.createElement('div'), { id: 'cursor-ghost' });
        if (!cursorMain.parentElement) document.body.appendChild(cursorMain);
        if (!cursorGhost.parentElement) document.body.appendChild(cursorGhost);

        let mouseX = 0, mouseY = 0, ghostX = 0, ghostY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX; mouseY = e.clientY;
            cursorMain.style.left = mouseX + 'px';
            cursorMain.style.top = mouseY + 'px';
        });

        function animateCursor() {
            ghostX += (mouseX - ghostX) * 0.15;
            ghostY += (mouseY - ghostY) * 0.15;
            cursorGhost.style.left = ghostX + 'px';
            cursorGhost.style.top = ghostY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        const hoverSelectors = 'a, button, .logo, .infinity-stone, .card, .team-card, .agent-card, .barcode-container, .ticker-close, .tva-btn, .register-btn, .back-btn, .merch-card, .gear-item, .pass-box, [onclick]';
        document.body.addEventListener('mouseover', (e) => { if (e.target.closest(hoverSelectors)) document.body.classList.add('hovering'); });
        document.body.addEventListener('mouseout', (e) => { if (e.target.closest(hoverSelectors)) document.body.classList.remove('hovering'); });
    }

    const navLogoContainer = document.querySelector('.nav-logo'), navLogoImg = document.querySelector('.nav-logo img'), bigLogo = document.querySelector('.big-logo');
    if (bigLogo && navLogoImg && navLogoContainer) {
        let startTop, endTop, startScale, endScale, maxScroll;

        function calculateLogoMetrics() {
            bigLogo.style.transform = 'none'; bigLogo.style.opacity = '1'; navLogoContainer.classList.remove('reveal');
            const bigRect = bigLogo.getBoundingClientRect(), navRect = navLogoImg.getBoundingClientRect();
            startTop = window.scrollY + bigRect.top; endTop = navRect.top;
            startScale = 1; endScale = navRect.height / bigRect.height; maxScroll = startTop - endTop;
            requestAnimationFrame(updateLogoPosition);
        }

        function updateLogoPosition() {
            if (!maxScroll) return;
            let progress = Math.max(0, Math.min(window.scrollY / maxScroll, 1));
            
            if (progress < 1) {
                bigLogo.style.transform = `translate3d(0, ${startTop - (progress * maxScroll) - (startTop - window.scrollY)}px, 0) scale(${startScale + (endScale - startScale) * progress})`;
                bigLogo.style.opacity = '1'; navLogoContainer.classList.remove('reveal');
            } else {
                bigLogo.style.opacity = '0'; navLogoContainer.classList.add('reveal');
            }
        }

        window.addEventListener('scroll', () => requestAnimationFrame(updateLogoPosition));
        window.addEventListener('resize', () => { calculateLogoMetrics(); updateLogoPosition(); });
        
        const initLogoAnimation = () => { calculateLogoMetrics(); updateLogoPosition(); setTimeout(() => { calculateLogoMetrics(); updateLogoPosition(); }, 100); };
        bigLogo.complete ? initLogoAnimation() : bigLogo.onload = initLogoAnimation;
    }

    const gallerySection = document.getElementById('gallery');
    if (gallerySection) {
        new IntersectionObserver((entries) => {
            entries.forEach(e => e.isIntersecting ? gallerySection.classList.add('reality-warped') : gallerySection.classList.remove('reality-warped'));
        }, { threshold: 0.4 }).observe(gallerySection);
    }

    const snapOverlay = document.getElementById('snap-overlay');
    if (snapOverlay) {
        let isVillainMode = false, collectedCount = 0;
        const stoneColors = ['#ff0000', '#00ff00', '#0085ff', '#ff7300', '#ffff00', '#800080'];

        function spawnStones() {
            const sections = Array.from(document.querySelectorAll('section')).sort(() => 0.5 - Math.random());
            if (!sections.length) return;
            stoneColors.forEach((color, i) => {
                const target = sections[i % sections.length];
                if (!target) return;
                if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
                
                const stone = Object.assign(document.createElement('div'), { className: 'infinity-stone' });
                stone.style.cssText = `--stone-color: ${color}; top: ${Math.floor(Math.random() * 80 + 10)}%; left: ${Math.floor(Math.random() * 80 + 10)}%; position: absolute;`;
                stone.addEventListener('click', function() { collectStone(this, i, color); });
                target.appendChild(stone);
            });
        }

        function collectStone(el, idx, color) {
            if (!el || el.classList.contains('collected')) return;
            el.classList.add('collected');
            const slot = document.getElementById(`slot-${idx+1}`);
            if (slot) { slot.classList.add('filled'); slot.style.setProperty('--stone-color', color); }
            if (++collectedCount === stoneColors.length) setTimeout(() => {
                snapOverlay.style.display = 'flex'; document.body.style.overflow = 'hidden';
                if (isVillainMode) victoryRestore(true);
            }, 800);
        }

        let pressedKeys = "", overrideProgress = 0, drainInterval;
        const secretWord = "villain";
        const updateBar = () => {
            const bar = document.getElementById('override-bar');
            if (bar) { bar.style.width = `${overrideProgress}%`; bar.style.backgroundColor = overrideProgress > 80 ? "#fff" : "#00ff00"; }
        };

        function startDrain() {
            clearInterval(drainInterval);
            drainInterval = setInterval(() => { if (overrideProgress > 0) { overrideProgress = Math.max(0, overrideProgress - 1.5); updateBar(); } }, 50);
        }

        function victoryRestore(fromStones) {
            clearInterval(drainInterval); isVillainMode = false; document.body.classList.remove('villain-mode');
            document.querySelector('.hero-theme')?.replaceChildren("INTO THE HEROVERSE");
            document.getElementById('villain-overlay') && (document.getElementById('villain-overlay').style.display = 'none');
            pressedKeys = ""; if (!fromStones) alert("SYSTEM RESTORED. GOOD JOB HERO.");
        }

        window.addEventListener('keyup', (e) => {
            if (isVillainMode && e.code === "Space") {
                overrideProgress = Math.min(100, overrideProgress + 6); updateBar();
                if (overrideProgress >= 100) victoryRestore(false);
                return;
            }
            pressedKeys = (pressedKeys + e.key.toLowerCase()).slice(-secretWord.length);
            if (pressedKeys === secretWord && !isVillainMode) {
                isVillainMode = true; document.body.classList.add('villain-mode');
                document.querySelector('.hero-theme')?.replaceChildren("INTO THE VILLAINVERSE");
                document.getElementById('villain-overlay') && (document.getElementById('villain-overlay').style.display = 'block');
                overrideProgress = 0; updateBar(); startDrain(); console.log("SYSTEM HACKED. MASH SPACE TO RESTORE.");
            }
        });
        spawnStones();
    }

    window.scrollToSection = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    
    window.toggleMobileMenu = () => {
        const menu = document.getElementById('mobile-menu-overlay');
        const icon = document.querySelector('.hamburger i');
        if (menu) {
            const isActive = menu.classList.toggle('active');
            document.body.style.overflow = isActive ? 'hidden' : 'auto';
            if (icon) {
                icon.className = isActive ? 'fas fa-times' : 'fas fa-bars';
            }
        }
    };
    
    window.mobileScroll = id => { toggleMobileMenu(); setTimeout(() => window.scrollToSection(id), 300); };

    function initDoomsdayClock() {
        const targetDate = new Date("2026-10-22T20:00:00").getTime();
        const daysEl = document.getElementById("timer-days") || document.getElementById("days");
        const hoursEl = document.getElementById("timer-hours") || document.getElementById("hours");
        const minsEl = document.getElementById("timer-minutes") || document.getElementById("minutes");
        const secsEl = document.getElementById("timer-seconds");

        if (!daysEl || !hoursEl || !minsEl) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(timerInterval);
                daysEl.innerText = "00"; hoursEl.innerText = "00"; minsEl.innerText = "00";
                if (secsEl) secsEl.innerText = "00";
                const directive = document.querySelector(".timer-directive");
                if (directive) directive.innerText = "THE CONVERGENCE HAS BEGUN";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            daysEl.innerText = String(days).padStart(2, '0');
            hoursEl.innerText = String(hours).padStart(2, '0');
            minsEl.innerText = String(minutes).padStart(2, '0');
            if (secsEl) secsEl.innerText = String(seconds).padStart(2, '0');

            DoomsdayAudio.tick();
        };

        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
    }
    initDoomsdayClock();

    let logoClicks = 0;
    window.handleLogoClick = () => {
        if (document.body.classList.contains('menu-open')) { toggleMobileMenu(); return logoClicks = 0; }
        if (++logoClicks === 3) { document.getElementById('clues-overlay')?.classList.add('active'); logoClicks = 0; }
    };
    window.closeClues = () => document.getElementById('clues-overlay')?.classList.remove('active');

    const mainGallery = document.getElementById('main-gallery') || document.querySelector('.gallery-scroll');
    if (mainGallery) {
        let isHoveringGallery = false;
        mainGallery.addEventListener('mouseenter', () => isHoveringGallery = true);
        mainGallery.addEventListener('mouseleave', () => isHoveringGallery = false);

        window.addEventListener('keydown', (evt) => {
            if (isHoveringGallery) {
                if (evt.key === 'ArrowLeft') { evt.preventDefault(); mainGallery.scrollBy({ left: -350, behavior: 'smooth' }); }
                else if (evt.key === 'ArrowRight') { evt.preventDefault(); mainGallery.scrollBy({ left: 350, behavior: 'smooth' }); }
            }
        });
    }
});

function flipCard(card) {
    const bd = document.getElementById('card-backdrop'); if(!bd) return;
    if (card.classList.contains('active')) return card.classList.toggle('flipped'), handleTypewriter(card);

    bd.classList.add('active'); document.body.style.overflow = 'hidden';
    const rect = card.getBoundingClientRect();
    const scaleFactor = window.innerWidth <= 768 ? 0.85 : 1.1;
    card.style.transform = `translate(${(window.innerWidth/2) - (rect.left+rect.width/2)}px, ${(window.innerHeight/2) - (rect.top+rect.height/2)}px) scale(${scaleFactor})`;
    card.style.zIndex = '10000'; card.classList.add('active');
    
    setTimeout(() => { card.classList.add('flipped'); handleTypewriter(card); }, 100);
    bd.onclick = () => closeCard(card);
}

function closeCard(card) {
    const bd = document.getElementById('card-backdrop'); if(!bd) return;
    card.classList.remove('flipped', 'active'); bd.classList.remove('active'); card.style.transform = '';
    const tw = card.querySelector('.typewriter'); if(tw) tw.innerText = '';
    setTimeout(() => { card.style.zIndex = ''; document.body.style.overflow = ''; }, 500);
}

function handleTypewriter(card) {
    const tw = card.querySelector('.typewriter'); if (!tw) return;
    const txt = tw.getAttribute('data-text') || "DATA CORRUPTED";
    if (!card.classList.contains('flipped')) return tw.textContent = '';
    
    tw.textContent = ''; 
    tw.style.borderRight = '2px solid var(--c-cyan)';
    
    let i = 0;
    (function type() {
        if (i < txt.length && card.classList.contains('flipped')) { 
            tw.textContent += txt.charAt(i++); 
            setTimeout(type, 25); 
        } 
        else tw.style.borderRight = 'none';
    })();
}
const quoteDisplay = document.getElementById('quote-display');
if (quoteDisplay) {
    const quotes = [
        "“A hero is not measured by the size of their strength, but by the strength of their heart.”",
        "There is a right and a wrong in this universe. And that distinction is not hard to make. – Superman",
        "TIP: True power isn't about not falling. It's about getting back up.",
        "“Heroes are made by the path they choose, not the powers they are graced with.”",
        "REMINDER: With great power comes great responsibility.",
        "“It’s not who I am underneath, but what I do that defines me.”",
        "It's not who I am underneath, but what I do that defines me. – Batman",
        "FACT: Mjolnir was forged in the heart of a dying star.",
        "DID YOU KNOW? Vibranium absorbs 100% of kinetic energy.",
        "FACT: The Speed Force generates enough energy to shatter reality.",
        "ANALYSIS: Gamma radiation levels are currently nominal.",
        "FACT: An Arc Reactor generates 3 gigajoules per second.",
        "TIP: If you see a glitch, it’s just a timeline variance. Probably.",
        "PROTOCOL: Do not engage the villains without a backup plan.",
        "TIP: Hydration is the most underrated superpower.",
        "SYSTEM: Calibrating Multiverse Wi-Fi signals...",
        "ADVICE: Capes are cool, but they get snagged on missiles.",
        "TIP: Check the Events page to sync your timeline.",
        "In brightest day, in blackest night, no evil shall escape my sight. – Green Lantern Corps",
        "Fighting does not make you a hero. – Wonder Woman",
        "It's never as bad as it seems. A person can do a lot of good if they're persistent. – Superman"
    ];
    let recent = [];
    const showNext = () => {
        let r; do { r = Math.floor(Math.random() * quotes.length); } while (recent.includes(r));
        if (recent.push(r) > 3) recent.shift();
        quoteDisplay.innerText = quotes[r]; quoteDisplay.classList.add('visible', 'glitching');
        setTimeout(() => quoteDisplay.classList.remove('glitching'), 500);
        setTimeout(() => quoteDisplay.classList.replace('visible', 'glitching'), 3500);
    };
    showNext(); const qInt = setInterval(showNext, 4000);
    const stopQ = () => { clearInterval(qInt); quoteDisplay.style.display = 'none'; };
    document.getElementById('start-btn')?.addEventListener('click', stopQ);
    document.getElementById('intro-video')?.addEventListener('ended', stopQ);
}

function updateTimelinePhysics() {
  const items = document.querySelectorAll('.timeline-item');
  const windowHeight = window.innerHeight;
  const focalLine = windowHeight * 0.60;

  items.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const itemTop = rect.top;
    const itemHeight = rect.height || 200;

    let progress = (focalLine - itemTop) / itemHeight;
    progress = Math.max(0, Math.min(1, progress));

    item.style.setProperty('--scroll-progress', progress);
  });
}

window.addEventListener('scroll', updateTimelinePhysics, { passive: true });
window.addEventListener('resize', updateTimelinePhysics, { passive: true });
document.addEventListener('DOMContentLoaded', updateTimelinePhysics);

// ==========================================
// === STARK ARMOR BAY CAROUSEL LOGIC ===
// ==========================================
const armorCards = document.querySelectorAll('.carousel-card');
const carouselContainer = document.getElementById('armor-carousel');
let currentArmorIdx = 0;

function updateArmorCarousel() {
    if (!armorCards.length) return;
    const total = armorCards.length;
    
    armorCards.forEach((card, index) => {
        let pos = index - currentArmorIdx;
        
        if (pos < -Math.floor(total / 2)) pos += total;
        if (pos > Math.floor(total / 2)) pos -= total;
        
        card.setAttribute('data-pos', pos);
    });
}
updateArmorCarousel();
window.moveArmor = (direction) => {
    if (!armorCards.length) return;
    currentArmorIdx = (currentArmorIdx + direction + armorCards.length) % armorCards.length;
    updateArmorCarousel();
};

// --- Touchpad Scroll, Click-to-Center & Mobile Swipe Logic ---
if (armorCards.length > 0 && carouselContainer) {
    // 1. Click-to-Center Intercept
    armorCards.forEach((card) => {
        card.addEventListener('click', (e) => {
            const pos = parseInt(card.getAttribute('data-pos'));
            
            // If the card is NOT in the center position (0)
            if (pos !== 0) {
                e.stopPropagation(); 
                window.moveArmor(pos); 
            }
        }, true); 
    });

    // 2. Mobile Swipe Support
    let touchStartX = 0;
    let touchEndX = 0;
    
    // We use passive: true so swiping up/down to scroll the page is not blocked
    carouselContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carouselContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50; // Minimum pixel drag to count as a swipe
        
        if (touchEndX < touchStartX - swipeThreshold) {
            window.moveArmor(1); // Swiped left -> shift to next card
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            window.moveArmor(-1); // Swiped right -> shift to previous card
        }
    }
}
// ==========================================
// === ARC REACTOR RADIAL MENU LOGIC ===
// ==========================================
window.handleArcClick = () => {
    const radialMenu = document.getElementById('arc-radial-menu');
    const arcBtn = document.getElementById('arc-reactor-btn');
    
    if (radialMenu) {
        radialMenu.classList.toggle('active');
        if (arcBtn) arcBtn.classList.toggle('active');
    }
};

document.addEventListener('click', (e) => {
    const radialMenu = document.getElementById('arc-radial-menu');
    const arcBtn = document.getElementById('arc-reactor-btn');
    
    if (radialMenu && radialMenu.classList.contains('active')) {
        if (!radialMenu.contains(e.target) && !arcBtn.contains(e.target)) {
            radialMenu.classList.remove('active');
            if (arcBtn) arcBtn.classList.remove('active');
        }
    }
});

// ==========================================
// === TICKER CLOSE LOGIC & DYNAMIC HUD SLIDE ===
// ==========================================
window.closeTicker = () => {
    const ticker = document.getElementById('news-ticker');
    if (ticker) {
        ticker.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        ticker.style.opacity = "0";
        ticker.style.transform = "translateY(20px)"; 
        
        // This alerts the CSS that the ticker is gone, triggering the HUDs to slide down
        document.body.classList.add('ticker-closed');
        
        setTimeout(() => {
            ticker.style.display = 'none';
        }, 300);
    }
};
// ==========================================
// === STARK ARMOR BAY (INSPECT LOGIC) ===
// ==========================================
window.openArmorInspect = (frontSrc, backSrc) => {
    const overlay = document.getElementById('armor-inspect-overlay');
    const frontImg = document.getElementById('inspect-front-img');
    const backImg = document.getElementById('inspect-back-img');
    
    // Reset the flip animation so it always starts on the front
    const flipper = overlay.querySelector('.fake-3d-flipper');
    if (flipper) flipper.classList.remove('flipped');
    
    // Inject the specific merch images
    if (frontImg) frontImg.src = frontSrc; 
    if (backImg) backImg.src = backSrc;
    
    // Reveal the overlay
    if (overlay) overlay.classList.add('active');
};

window.closeArmorInspect = () => {
    const overlay = document.getElementById('armor-inspect-overlay');
    const frontImg = document.getElementById('inspect-front-img');
    const backImg = document.getElementById('inspect-back-img');
    
    // Hide overlay and clear memory
    if (overlay) overlay.classList.remove('active');
    setTimeout(() => { 
        if (frontImg) frontImg.src = ''; 
        if (backImg) backImg.src = ''; 
    }, 500);
};


// ==========================================
// === WAYNETECH MAINFRAME LEADERBOARD LOGIC ===
// ==========================================
let currentBoardIdx = 0;
const boardTitles = ["E-SPORTS TOURNAMENT(BGMI)", "E-SPORTS TOURNAMENT(CODM)", "E-SPORTS TOURNAMENT(Free Fire)", "GULLY-SPORTS(GULLY-BALL | M)", "GULLY-SPORTS(GULLY-BALL | W)","GULLY-SPORTS(GULLY-SIX)","GULLY-SPORTS(GULLY-SPIKE | M)", "GULLY-SPORTS(GULLY-SPIKE | W)", "TREASURE HUNT","BALLOON TAG", "ESCAPE ROOM"];

window.cycleLeaderboard = (direction) => {
    const totalBoards = boardTitles.length;
    
    // 1. Hide the currently active board
    const currentBoard = document.getElementById(`event-board-${currentBoardIdx}`);
    if (currentBoard) {
        currentBoard.classList.remove('active-board');
        currentBoard.classList.add('hidden-board');
    }
    
    // 2. Calculate the next index (wraps around backward and forward)
    currentBoardIdx = (currentBoardIdx + direction + totalBoards) % totalBoards;
    
    // 3. Show the new board
    const nextBoard = document.getElementById(`event-board-${currentBoardIdx}`);
    if (nextBoard) {
        nextBoard.classList.remove('hidden-board');
        nextBoard.classList.add('active-board');
    }
    
    // 4. Update the Game Title text with a cool glitch/flicker effect
    const titleEl = document.getElementById('arcade-game-title');
    if (titleEl) {
        titleEl.innerText = boardTitles[currentBoardIdx];
        
        // Retrigger CSS animation
        titleEl.classList.remove('screen-flicker');
        void titleEl.offsetWidth; // Force a browser reflow
        titleEl.classList.add('screen-flicker');
    }
};

const lightboxOverlay = document.getElementById('lightbox-overlay');
const lightboxImg = document.getElementById('lightbox-img');

// Attach click events to all gallery images
document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('click', (e) => {
        if (lightboxOverlay && lightboxImg) {
            lightboxImg.src = e.target.src; // Copy the clicked image source
            lightboxOverlay.classList.add('active'); // Show overlay
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    });
});

// Close lightbox function (Triggered by the HTML onclick)
window.closeLightbox = () => {
    if (lightboxOverlay) {
        lightboxOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        // Wait for fade out before clearing the image source
        setTimeout(() => { if (lightboxImg) lightboxImg.src = ''; }, 300);
    }
};

// ==========================================
// === HOLO-MODAL REGISTRATION LOGIC ===
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const registerBtns = document.querySelectorAll('.register-btn');
    const holoModal = document.getElementById('holo-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalTeam = document.getElementById('modal-team');
    const modalFee = document.getElementById('modal-fee');
    const modalLink = document.getElementById('modal-link');
    const modalRulesList = document.getElementById('modal-rules-list');

    registerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(btn.tagName === 'BUTTON' || btn.getAttribute('href') === '#') {
                e.preventDefault(); 
            }
            
            // Extract data
            const title = btn.getAttribute('data-title') || "EVENT PROTOCOL";
            const team = btn.getAttribute('data-team') || "TBD";
            const fee = btn.getAttribute('data-fee') || "TBA";
            const link = btn.getAttribute('data-link') || "#";
            const rules = btn.getAttribute('data-rules') || "Standard Multiverse protocols apply.|No temporal manipulation or reality warping.";
            
            // Inject text
            if (modalTitle) modalTitle.innerText = title;
            if (modalTeam) modalTeam.innerText = team;
            if (modalFee) modalFee.innerText = fee;
            if (modalLink) {
                modalLink.href = link;
                modalLink.style.display = link === '#' ? 'none' : 'block';
            }

            // Inject dynamic rules list
            if (modalRulesList) {
                modalRulesList.innerHTML = ''; 
                const rulesArray = rules.split('|');
                rulesArray.forEach(rule => {
                    if (rule.trim() !== '') {
                        const li = document.createElement('li');
                        li.innerText = rule.trim();
                        modalRulesList.appendChild(li);
                    }
                });
            }
            
            // Open Modal
            if (holoModal) {
                holoModal.classList.add('active');
                document.body.style.overflow = 'hidden'; 
            }
        });
    });

    window.closeModal = () => {
        if (holoModal) {
            holoModal.classList.remove('active');
            document.body.style.overflow = ''; 
        }
    };
});
// ==========================================
// === FAKE 3D MERCH HOVER EFFECT ===
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Detect if the user is on a mobile/touch device
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Only apply the 3D hover tracking if NOT on mobile
    if (!isTouch) {
        document.querySelectorAll('.fake-3d-container').forEach(container => {
            const tiltElement = container.querySelector('.fake-3d-tilt');
            
            container.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                
                // Get cursor position relative to the container
                const x = e.clientX - rect.left; 
                const y = e.clientY - rect.top;
                
                // Calculate center offset (-1 to 1)
                const xNorm = (x / rect.width - 0.5) * 2;
                const yNorm = (y / rect.height - 0.5) * 2;
                
                // Set Maximum Tilt (Change this number to make the 3D effect stronger/weaker)
                const maxTilt = 20; 
                
                tiltElement.style.transform = `rotateX(${yNorm * -maxTilt}deg) rotateY(${xNorm * maxTilt}deg)`;
                tiltElement.style.transition = 'none'; // Instant follow while moving
            });
            
            container.addEventListener('mouseleave', () => {
                // Snap back to zero when the mouse leaves
                tiltElement.style.transform = `rotateX(0deg) rotateY(0deg)`;
                tiltElement.style.transition = 'transform 0.5s ease-out'; 
            });
        });
    }
});