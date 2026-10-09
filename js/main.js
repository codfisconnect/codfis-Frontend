// 0. Theme Controller (Immediate execution to prevent FOUC)
(function initTheme() {
  const savedTheme = localStorage.getItem('codfis-theme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'dark'); // Default dark
  document.documentElement.setAttribute('data-theme', initialTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Setup
  const themeToggleButtons = document.querySelectorAll('.theme-toggle');
  
  function updateThemeIcons(theme) {
    themeToggleButtons.forEach(btn => {
      btn.innerHTML = theme === 'light' ? '🌙' : '☀️';
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      btn.setAttribute('title', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    });
  }

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateThemeIcons(currentTheme);

  themeToggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('codfis-theme', newTheme);
      updateThemeIcons(newTheme);
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
