/**
 * Codfis Technologies V2 - Shared Carousel, Stepper & Animation Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Drawer Toggle
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-drawer');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('active');
      toggleBtn.setAttribute('aria-expanded', isOpen);
      toggleBtn.innerHTML = isOpen ? '✕' : '☰';
    });
  }

  // 2. Active link highlight
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-drawer a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath.endsWith(href) || (currentPath === '/' && href === 'index.html'))) {
      link.classList.add('active');
    }
  });

  // 3. Scroll Reveal Animations (IntersectionObserver)
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('active'));
  }

  // 4. Reusable Horizontal Carousel Controller (Robust, Multi-Instance)
  function initAllCarousels() {
    // Select all carousel sections or wrappers
    const sectionsWithCarousels = document.querySelectorAll('section, .carousel-wrapper, .process-stepper-container');

    sectionsWithCarousels.forEach(section => {
      const track = section.querySelector('.carousel-track') || section.querySelector('.process-track');
      if (!track) return;

      // Avoid double initialization
      if (track.dataset.carouselInitialized === 'true') return;
      track.dataset.carouselInitialized = 'true';

      // Find prev and next buttons in this section
      const prevBtn = section.querySelector('.carousel-btn.prev') || section.querySelector('[aria-label*="Previous"]');
      const nextBtn = section.querySelector('.carousel-btn.next') || section.querySelector('[aria-label*="Next"]');

      // Update disabled button state based on scroll boundaries
      function updateButtonStates() {
        const tolerance = 4; // account for fractional subpixels
        const maxScrollLeft = track.scrollWidth - track.clientWidth;

        if (prevBtn) {
          prevBtn.disabled = track.scrollLeft <= tolerance;
        }
        if (nextBtn) {
          nextBtn.disabled = track.scrollLeft >= maxScrollLeft - tolerance;
        }
      }

      // Dynamic responsive scroll step (1 or 2 card widths)
      function getScrollStep() {
        const firstChild = track.children[0];
        if (firstChild) {
          const cardWidth = firstChild.getBoundingClientRect().width;
          const gap = 24; // standard 1.5rem gap
          return Math.max(cardWidth + gap, 300);
        }
        return Math.max(track.clientWidth * 0.75, 280);
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const step = getScrollStep();
          track.scrollBy({ left: -step, behavior: 'smooth' });
          setTimeout(updateButtonStates, 350);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const step = getScrollStep();
          track.scrollBy({ left: step, behavior: 'smooth' });
          setTimeout(updateButtonStates, 350);
        });
      }

      // Scroll listener to update button state
      track.addEventListener('scroll', updateButtonStates, { passive: true });

      // Initial state calculation
      updateButtonStates();
      window.addEventListener('resize', updateButtonStates, { passive: true });

      // Mouse drag support
      let isMouseDown = false;
      let startX = 0;
      let scrollStart = 0;
      let hasDragged = false;

      track.addEventListener('mousedown', (e) => {
        // Only primary mouse button
        if (e.button !== 0) return;
        isMouseDown = true;
        hasDragged = false;
        track.classList.add('dragging');
        startX = e.pageX - track.offsetLeft;
        scrollStart = track.scrollLeft;
      });

      window.addEventListener('mouseup', () => {
        if (!isMouseDown) return;
        isMouseDown = false;
        track.classList.remove('dragging');
        updateButtonStates();
      });

      track.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        const currentX = e.pageX - track.offsetLeft;
        const walk = (currentX - startX) * 1.5;
        if (Math.abs(walk) > 5) {
          hasDragged = true;
        }
        track.scrollLeft = scrollStart - walk;
      });

      // Prevent accidental link/button clicks while dragging
      track.addEventListener('click', (e) => {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      // Touch swipe support (non-interfering with vertical page scroll)
      let touchStartX = 0;
      let touchStartY = 0;
      let touchScrollStart = 0;
      let isHorizontalSwipe = false;
      let isDetermined = false;

      track.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].pageX;
        touchStartY = e.touches[0].pageY;
        touchScrollStart = track.scrollLeft;
        isHorizontalSwipe = false;
        isDetermined = false;
      }, { passive: true });

      track.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 1) return;
        const currentX = e.touches[0].pageX;
        const currentY = e.touches[0].pageY;
        const diffX = currentX - touchStartX;
        const diffY = currentY - touchStartY;

        if (!isDetermined) {
          if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
            isDetermined = true;
            isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY);
          }
        }

        if (isHorizontalSwipe) {
          track.scrollLeft = touchScrollStart - diffX;
        }
      }, { passive: true });

      track.addEventListener('touchend', () => {
        updateButtonStates();
      }, { passive: true });
    });
  }

  initAllCarousels();

  // 5. Interactive Process Stepper (01 -> 07)
  const stepperTrack = document.querySelector('.process-track');
  const stepperFill = document.querySelector('.process-line-fill');
  const nodeCards = document.querySelectorAll('.process-node-card');

  if (stepperTrack && nodeCards.length > 0) {
    nodeCards.forEach((card, index) => {
      card.addEventListener('click', () => {
        nodeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        if (stepperFill) {
          const pct = ((index + 1) / nodeCards.length) * 100;
          stepperFill.style.width = `${pct}%`;
        }
      });
    });
  }
});
