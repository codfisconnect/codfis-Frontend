// 0. Theme Controller (Immediate execution to prevent FOUC)
(function initTheme() {
  const savedTheme = localStorage.getItem('codfis-theme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'dark'); // Default dark
  document.documentElement.setAttribute('data-theme', initialTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  // Interactive Lamp Pull-Cord Theme Toggle Setup
  const lampSVG = `
    <div class="lamp-flash"></div>
    <svg class="lamp-svg-icon" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="lampGlowGradient" cx="50%" cy="10%" r="90%">
          <stop offset="0%" stop-color="#F5C400" stop-opacity="0.85" />
          <stop offset="50%" stop-color="#F5C400" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#F5C400" stop-opacity="0" />
        </radialGradient>
      </defs>
      <!-- Soft Light Cone / Glow -->
      <path class="lamp-glow" d="M16 15 L2 38 L30 38 Z" />
      <!-- Lamp Stand Pole -->
      <line class="lamp-stand" x1="16" y1="13" x2="16" y2="40" />
      <!-- Lamp Weighted Base -->
      <ellipse class="lamp-base" cx="16" cy="40" rx="9" ry="2.5" />
      <!-- Warm Bulb -->
      <circle class="lamp-bulb" cx="16" cy="14" r="3" />
      <!-- Flared Warm Lampshade -->
      <path class="lamp-shade" d="M10 5 L22 5 L26 14 L6 14 Z" stroke-linejoin="round" />
      <!-- Animated Pull-Cord Assembly -->
      <g class="lamp-cord-group">
        <line class="lamp-cord-line" x1="22" y1="14" x2="22" y2="25" />
        <circle class="lamp-cord-handle" cx="22" cy="26" r="2.2" />
      </g>
    </svg>
  `;

  const themeToggleButtons = document.querySelectorAll('.theme-toggle');

  function renderLampToggle(btn, theme) {
    btn.classList.add('lamp-toggle-btn');
    btn.innerHTML = lampSVG;
    const isLight = theme === 'light';
    btn.setAttribute('aria-label', isLight ? 'Switch to dark mode (Pull cord)' : 'Switch to light mode (Pull cord)');
    btn.setAttribute('title', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
  }

  function triggerPullCord(btn, callback) {
    const cordGroup = btn.querySelector('.lamp-cord-group');
    const flashEl = btn.querySelector('.lamp-flash');

    if (cordGroup) {
      cordGroup.classList.remove('cord-pulling');
      void cordGroup.offsetWidth; // trigger reflow
      cordGroup.classList.add('cord-pulling');
    }

    if (flashEl) {
      flashEl.classList.add('flashing');
      setTimeout(() => flashEl.classList.remove('flashing'), 320);
    }

    // Execute theme switch after natural pull moment (~140ms)
    setTimeout(() => {
      if (typeof callback === 'function') callback();
    }, 140);
  }

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

  themeToggleButtons.forEach(btn => {
    renderLampToggle(btn, currentTheme);

    let isDragging = false;
    let startY = 0;

    btn.addEventListener('click', (e) => {
      triggerPullCord(btn, () => {
        const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('codfis-theme', newTheme);
        themeToggleButtons.forEach(b => renderLampToggle(b, newTheme));
      });
    });

    // Support dragging downward on touch / mouse
    btn.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.clientY;
    });

    btn.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        isDragging = true;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    const handleDragEnd = (clientY) => {
      if (isDragging && clientY - startY > 15) {
        btn.click();
      }
      isDragging = false;
    };

    window.addEventListener('mouseup', (e) => {
      if (isDragging) handleDragEnd(e.clientY);
    });

    window.addEventListener('touchend', (e) => {
      if (isDragging && e.changedTouches && e.changedTouches[0]) {
        handleDragEnd(e.changedTouches[0].clientY);
      }
    });

    // Keyboard support: Enter / Space triggers pull cord
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // 1. Mobile Drawer Toggle with Body Scroll Lock & Auto Close
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-drawer');

  function closeDrawer() {
    if (drawer && drawer.classList.contains('active')) {
      drawer.classList.remove('active');
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = '☰';
      }
      document.body.style.overflow = '';
    }
  }

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('active');
      toggleBtn.setAttribute('aria-expanded', isOpen);
      toggleBtn.innerHTML = isOpen ? '✕' : '☰';
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when clicking any link inside the drawer
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });

    // Close drawer on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
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

  // 6. Reusable Vertical Slider Controller
  function initVerticalSliders() {
    const sliderContainers = document.querySelectorAll('.vertical-slider-container');

    sliderContainers.forEach(container => {
      const slides = container.querySelectorAll('.v-slide');
      const prevBtn = container.querySelector('.v-slider-btn.prev');
      const nextBtn = container.querySelector('.v-slider-btn.next');
      const indicatorsContainer = container.querySelector('.v-slider-indicators');
      let currentIndex = 0;

      if (!slides.length) return;

      // Create indicator dots dynamically if indicators container exists
      if (indicatorsContainer) {
        indicatorsContainer.innerHTML = '';
        slides.forEach((_, idx) => {
          const dot = document.createElement('button');
          dot.className = `v-indicator-dot ${idx === 0 ? 'active' : ''}`;
          dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
          dot.addEventListener('click', () => goToSlide(idx));
          indicatorsContainer.appendChild(dot);
        });
      }

      function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        slides.forEach((slide, idx) => {
          if (idx === index) {
            slide.classList.add('active');
          } else {
            slide.classList.remove('active');
          }
        });

        if (indicatorsContainer) {
          const dots = indicatorsContainer.querySelectorAll('.v-indicator-dot');
          dots.forEach((dot, idx) => {
            if (idx === index) {
              dot.classList.add('active');
            } else {
              dot.classList.remove('active');
            }
          });
        }

        currentIndex = index;
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          goToSlide(currentIndex - 1);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          goToSlide(currentIndex + 1);
        });
      }

      // Touch gesture support on mobile
      let touchStartY = 0;
      let touchStartX = 0;
      container.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        touchStartY = e.touches[0].pageY;
        touchStartX = e.touches[0].pageX;
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        if (!e.changedTouches || e.changedTouches.length !== 1) return;
        const diffY = e.changedTouches[0].pageY - touchStartY;
        const diffX = e.changedTouches[0].pageX - touchStartX;
        
        // Vertical swipe with high confidence
        if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX)) {
          if (diffY < 0) {
            goToSlide(currentIndex + 1); // Swipe up
          } else {
            goToSlide(currentIndex - 1); // Swipe down
          }
        }
      }, { passive: true });

      // Keyboard navigation
      container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          goToSlide(currentIndex - 1);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          goToSlide(currentIndex + 1);
        }
      });
    });
  }

  initVerticalSliders();
});
