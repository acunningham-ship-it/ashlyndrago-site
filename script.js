/**
 * ASHLYN DRAGO — 16MM WORKPRINT PORTFOLIO
 * Interactive Film Strip Telemetry, Contact Sheet Filter & Projector Gate Lightbox
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. 16mm Film Strip Active-Frame Tracking & Telemetry
  const filmFrames = Array.from(document.querySelectorAll('.film-frame[data-frame-index]'));
  const totalReelFrames = filmFrames.length;

  const liveFrameNumEl = document.getElementById('live-frame-num');
  const liveFrameTotalEl = document.getElementById('live-frame-total');
  const dockCounterEl = document.getElementById('dock-frame-counter');
  const dockEventNoteEl = document.getElementById('dock-event-note');
  const dockPrevBtn = document.getElementById('dock-prev-btn');
  const dockNextBtn = document.getElementById('dock-next-btn');

  // Sticky Dossier Elements
  const dossierWaxBadge = document.getElementById('dossier-wax-badge');
  const dossierTitle = document.getElementById('dossier-title');
  const dossierMeta = document.getElementById('dossier-meta');
  const dossierStory = document.getElementById('dossier-story');
  const dossierWaxMargin = document.getElementById('dossier-wax-margin');
  const dossierLoupeBtn = document.getElementById('dossier-loupe-btn');

  let currentReelIndex = 0;

  const pad2 = (n) => String(n).padStart(2, '0');

  if (liveFrameTotalEl && totalReelFrames > 0) {
    liveFrameTotalEl.textContent = pad2(totalReelFrames);
  }

  function setActiveReelFrame(index, shouldScroll = false) {
    if (!filmFrames.length) return;
    const bounded = ((index % totalReelFrames) + totalReelFrames) % totalReelFrames;
    currentReelIndex = bounded;

    filmFrames.forEach((frame, i) => {
      frame.classList.toggle('is-active', i === bounded);
    });

    const activeFrame = filmFrames[bounded];
    const displayNum = pad2(bounded + 1);
    const totalNum = pad2(totalReelFrames);

    if (liveFrameNumEl) liveFrameNumEl.textContent = displayNum;
    if (dockCounterEl) dockCounterEl.textContent = `FRAME ${displayNum} OF ${totalNum}`;

    const code = activeFrame.dataset.frameCode || `#${displayNum}A`;
    const title = activeFrame.dataset.title || '';
    const medium = activeFrame.dataset.medium || '';
    const story = activeFrame.dataset.story || '';
    const wax = activeFrame.dataset.wax || '';

    if (dossierWaxBadge) dossierWaxBadge.textContent = code;
    if (dossierTitle) dossierTitle.textContent = title;
    if (dossierMeta) dossierMeta.textContent = medium;
    if (dossierStory) dossierStory.textContent = story;
    if (dossierWaxMargin) dossierWaxMargin.textContent = wax;
    if (dockEventNoteEl) dockEventNoteEl.textContent = wax;

    if (shouldScroll) {
      activeFrame.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Update active frame on scroll based on proximity to viewport center
  let scrollTicking = false;
  function updateActiveFrameOnScroll() {
    scrollTicking = false;
    if (!filmFrames.length) return;

    if (window.scrollY < 120) {
      if (currentReelIndex !== 0) setActiveReelFrame(0, false);
      return;
    }

    const viewportCenter = window.innerHeight * 0.44;
    let closestIdx = currentReelIndex;
    let minDistance = Infinity;

    filmFrames.forEach((frame, idx) => {
      const rect = frame.getBoundingClientRect();
      const frameCenter = rect.top + rect.height / 2;
      const dist = Math.abs(frameCenter - viewportCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== currentReelIndex) {
      setActiveReelFrame(closestIdx, false);
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateActiveFrameOnScroll);
        scrollTicking = true;
      }
    },
    { passive: true }
  );

  if (dockPrevBtn) {
    dockPrevBtn.addEventListener('click', () => {
      setActiveReelFrame(currentReelIndex - 1, true);
    });
  }

  if (dockNextBtn) {
    dockNextBtn.addEventListener('click', () => {
      setActiveReelFrame(currentReelIndex + 1, true);
    });
  }

  if (dossierLoupeBtn) {
    dossierLoupeBtn.addEventListener('click', () => {
      const targetFrame = filmFrames[currentReelIndex];
      if (targetFrame) openLightboxForElement(targetFrame);
    });
  }

  // Initialize Frame 01
  setActiveReelFrame(0, false);

  // 2. Contact Sheet Archive Filter
  const filterTabs = Array.from(document.querySelectorAll('.filter-tab[data-filter]'));
  const proofCells = Array.from(document.querySelectorAll('.proof-cell[data-category]'));
  const visibleProofCountEl = document.getElementById('visible-proof-count');

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filterValue = tab.dataset.filter || 'all';

      filterTabs.forEach((t) => {
        const isMatch = t === tab;
        t.classList.toggle('is-selected', isMatch);
        t.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
      });

      let shownCount = 0;
      proofCells.forEach((cell) => {
        const cat = cell.dataset.category || '';
        const shouldShow = filterValue === 'all' || cat === filterValue;
        if (shouldShow) {
          cell.removeAttribute('hidden');
          shownCount++;
        } else {
          cell.setAttribute('hidden', '');
        }
      });

      if (visibleProofCountEl) {
        visibleProofCountEl.textContent = `${pad2(shownCount)} EXPOSURES`;
      }
    });
  });

  // 3. Projector Gate Lightbox
  const lightboxEl = document.getElementById('projector-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxFrameCode = document.getElementById('lightbox-frame-code');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxMedium = document.getElementById('lightbox-medium');
  const lightboxDesc = document.getElementById('lightbox-description');
  const lightboxWaxNote = document.getElementById('lightbox-wax-note');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxCloseBtn = document.getElementById('lightbox-close');
  const lightboxPrevBtn = document.getElementById('lightbox-prev');
  const lightboxNextBtn = document.getElementById('lightbox-next');

  let activeLightboxItems = [];
  let currentLightboxIdx = 0;
  let lastFocusedTrigger = null;

  function getAvailableLightboxItems() {
    return Array.from(document.querySelectorAll('[data-lightbox-item]:not([hidden])'));
  }

  function renderLightboxSlide(index) {
    if (!activeLightboxItems.length) return;
    const total = activeLightboxItems.length;
    currentLightboxIdx = ((index % total) + total) % total;

    const item = activeLightboxItems[currentLightboxIdx];
    const nestedImg = item.querySelector('img');
    const src = item.dataset.fullSrc || (nestedImg ? nestedImg.getAttribute('src') : '');
    const title = item.dataset.title || (nestedImg ? nestedImg.getAttribute('alt') : 'Artwork Frame');
    const code = item.dataset.frameCode || `#${pad2(currentLightboxIdx + 1)}`;
    const medium = item.dataset.medium || '16MM ARCHIVE EXPOSURE';
    const story = item.dataset.story || '';
    const wax = item.dataset.wax || '';

    if (lightboxImg) {
      lightboxImg.src = src;
      lightboxImg.alt = title;
    }
    if (lightboxFrameCode) lightboxFrameCode.textContent = code;
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxMedium) lightboxMedium.textContent = medium;
    if (lightboxDesc) lightboxDesc.textContent = story;
    if (lightboxWaxNote) lightboxWaxNote.textContent = wax;
    if (lightboxCounter) {
      lightboxCounter.textContent = `EXPOSURE ${pad2(currentLightboxIdx + 1)} OF ${pad2(total)}`;
    }
  }

  function openLightboxForElement(el) {
    if (!lightboxEl) return;
    lastFocusedTrigger = el;
    activeLightboxItems = getAvailableLightboxItems();
    const foundIdx = activeLightboxItems.indexOf(el);
    currentLightboxIdx = foundIdx >= 0 ? foundIdx : 0;

    renderLightboxSlide(currentLightboxIdx);
    lightboxEl.classList.add('is-open');
    lightboxEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (lightboxCloseBtn) lightboxCloseBtn.focus();
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('is-open');
    lightboxEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      lastFocusedTrigger.focus();
    }
  }

  document.querySelectorAll('[data-lightbox-item]').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('a, button:not([data-lightbox-item])')) return;
      openLightboxForElement(item);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightboxForElement(item);
      }
    });
  });

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeLightbox);
  }

  if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', () => {
      renderLightboxSlide(currentLightboxIdx - 1);
    });
  }

  if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', () => {
      renderLightboxSlide(currentLightboxIdx + 1);
    });
  }

  if (lightboxEl) {
    lightboxEl.addEventListener('click', (e) => {
      if (e.target === lightboxEl) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightboxEl || !lightboxEl.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      renderLightboxSlide(currentLightboxIdx - 1);
    } else if (e.key === 'ArrowRight') {
      renderLightboxSlide(currentLightboxIdx + 1);
    }
  });

  // 4. Section Navigation Highlight & Copy Email Helper
  const navLinks = Array.from(document.querySelectorAll('.leader-nav a[href^="#"]'));
  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && observedSections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = `#${entry.target.id}`;
            navLinks.forEach((link) => {
              link.classList.toggle('is-current', link.getAttribute('href') === id);
            });
          }
        });
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 }
    );

    observedSections.forEach((sec) => sectionObserver.observe(sec));
  }

  const copyEmailBtn = document.getElementById('copy-email-btn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async () => {
      const email = 'ashlynjd@gmail.com';
      const labelSpan = copyEmailBtn.querySelector('[data-copy-label]') || copyEmailBtn;
      const originalText = labelSpan.textContent;
      try {
        await navigator.clipboard.writeText(email);
        labelSpan.textContent = 'COPIED: ASHLYNJD@GMAIL.COM';
        setTimeout(() => {
          labelSpan.textContent = originalText;
        }, 2200);
      } catch {
        window.location.href = `mailto:${email}`;
      }
    });
  }
});
