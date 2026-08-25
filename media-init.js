/**
 * Media Initializer - Codfis Technologies
 * 
 * This script runs on page load and injects all centralized media from media.js
 * into the DOM. It updates logos, images, videos, and other media elements
 * to use the central media configuration.
 * 
 * Load order: Include media.js BEFORE this script.
 */

document.addEventListener('DOMContentLoaded', function(){
  if (!window.media) {
    console.warn('media.js not loaded. Cannot initialize media.');
    return;
  }

  const resolveMedia = function(path) {
    return window.media.getMedia(path);
  };

  const setupCarousel = function(track, options) {
    if (!track || track.dataset.carouselReady === 'true') return;

    const cards = Array.from(track.children);
    if (!cards.length) return;

    track.dataset.carouselReady = 'true';
    track.classList.add('carousel-track');

    const viewport = document.createElement('div');
    viewport.className = 'carousel-viewport';
    track.parentNode.insertBefore(viewport, track);
    viewport.appendChild(track);

    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    controls.innerHTML = `
      <button class="carousel-button carousel-button--prev" type="button" aria-label="Previous ${options.label}">
        <span aria-hidden="true">&#8592;</span>
      </button>
      <button class="carousel-button carousel-button--next" type="button" aria-label="Next ${options.label}">
        <span aria-hidden="true">&#8594;</span>
      </button>
    `;
    viewport.parentNode.insertBefore(controls, viewport.nextSibling);

    const previous = controls.querySelector('.carousel-button--prev');
    const next = controls.querySelector('.carousel-button--next');
    let position = 0;
    let visible = 1;
    let step = 1;
    let startX = 0;
    let startPosition = 0;
    let dragging = false;

    const calculate = function() {
      const width = viewport.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      visible = Math.max(1, Math.floor((width + gap) / (options.minCardWidth + gap)));
      visible = Math.min(visible, cards.length);
      step = Math.max(1, visible - 1);
      cards.forEach(card => {
        card.style.flexBasis = `calc((100% - ${(visible - 1) * gap}px) / ${visible})`;
      });
      position = Math.min(position, Math.max(0, cards.length - visible));
      update();
    };

    const update = function() {
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      const distance = cards[0] ? cards[0].getBoundingClientRect().width + gap : 0;
      track.style.transform = `translate3d(${-position * distance}px, 0, 0)`;
      const hasPrevious = position > 0;
      const hasNext = position < cards.length - visible;
      previous.disabled = !hasPrevious;
      next.disabled = !hasNext;
      previous.hidden = !hasPrevious;
      next.hidden = !hasNext;
      controls.hidden = !hasPrevious && !hasNext;
    };

    const move = function(direction) {
      position = Math.max(0, Math.min(position + direction * step, cards.length - visible));
      update();
    };

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    viewport.tabIndex = 0;
    viewport.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        move(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        move(1);
      }
    });

    viewport.addEventListener('pointerdown', function(event) {
      dragging = true;
      startX = event.clientX;
      startPosition = position;
      viewport.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
    });
    viewport.addEventListener('pointerup', function(event) {
      if (!dragging) return;
      dragging = false;
      const distance = event.clientX - startX;
      if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1);
      else position = startPosition;
      track.classList.remove('is-dragging');
    });
    viewport.addEventListener('pointercancel', function() {
      dragging = false;
      track.classList.remove('is-dragging');
    });

    window.addEventListener('resize', calculate);
    calculate();
  };

  const initializeCarousels = function() {
    setupCarousel(document.querySelector('.solutions-grid'), { label: 'solutions', minCardWidth: 220 });
    setupCarousel(document.querySelector('.training-section .courses'), { label: 'training topics', minCardWidth: 160 });
    setupCarousel(document.querySelector('.why-grid'), { label: 'business reasons', minCardWidth: 220 });
    setupCarousel(document.querySelector('.case-grid'), { label: 'case studies', minCardWidth: 320 });
  };

  document.querySelectorAll('[data-media]').forEach(function(element) {
    const source = resolveMedia(element.dataset.media);
    if (!source) return;

    if (element.tagName === 'IMG' || element.tagName === 'SOURCE' || element.tagName === 'VIDEO' || element.tagName === 'LINK') {
      element.href = source;
      element.src = source;
    } else {
      element.style.backgroundImage = `url("${source}")`;
    }
  });

  // ============================================================================
  // 1. LOGO INJECTION - Update all logo images to use central media
  // ============================================================================
  try {
    const logos = document.querySelectorAll('.logo img, [data-media="logo"], [data-media="branding.logo"]');
    logos.forEach(el => {
      el.src = window.media.branding.logo;
      el.alt = 'Codfis Technologies Logo';
      el.onerror = function(){ this.src = media.fallback; };
    });
  } catch(e){console.warn('Logo injection error:', e)}

  // ============================================================================
  // 2. HERO IMAGE INJECTION
  // ============================================================================
  try {
    const heroImg = document.querySelector('.hero-visual img, [data-media="hero"], [data-media="hero.home"]');
    if (heroImg && media.hero && media.hero.home) {
      heroImg.src = media.hero.home;
      heroImg.alt = 'Hero visual';
      heroImg.onerror = function(){ this.src = media.fallback; };
    }
  } catch(e){console.warn('Hero image error:', e)}

  // ============================================================================
  // 3. SOLUTIONS GRID - Rebuild with media config
  // ============================================================================
  try {
    const solutionsRoot = document.querySelector('.solutions-grid');
    if (solutionsRoot && media.solutions) {
      const items = [
        { key: 'webDevelopment', title: 'Business Website Development', desc: 'Professional websites focused on conversions and brand trust.' },
        { key: 'webApp', title: 'Web Application Development', desc: 'Scalable enterprise web applications and SaaS solutions.' },
        { key: 'mobileApp', title: 'Mobile Application Development', desc: 'Native and cross-platform mobile apps with great UX.' },
        { key: 'aiAutomation', title: 'AI-Powered Applications', desc: 'Build intelligent apps with modern AI models and integrations.' },
        { key: 'aiAutomation', title: 'AI Integration & Automation', desc: 'Automate workflows and integrate AI into business processes.' },
        { key: 'customSoftware', title: 'Custom Software Development', desc: 'Tailored systems to solve unique business challenges.' },
        { key: 'cloud', title: 'Cloud & Infrastructure', desc: 'Secure cloud architecture, deployments and DevOps practices.' },
        { key: 'dataAnalytics', title: 'Data Analytics', desc: 'Data pipelines, visualization and actionable insights.' },
        { key: 'uiux', title: 'UI/UX Development', desc: 'User-centered design and prototyping for great experiences.' },
        { key: 'enterprise', title: 'Enterprise Solutions', desc: 'Large-scale systems built for reliability and performance.' },
        { key: 'digitalTransform', title: 'Digital Transformation', desc: 'Modernize systems and accelerate business outcomes.' }
      ];

      solutionsRoot.innerHTML = '';
      items.forEach(it => {
        const card = document.createElement('div');
        card.className = 'solution-card';
        const imgSrc = media.solutions[it.key] || media.fallback;
        card.innerHTML = `
          <div class="solution-media"><img src="${imgSrc}" alt="${it.title}" onerror="this.src='${media.fallback}'"/></div>
          <div class="solution-body">
            <h3>${it.title}</h3>
            <p>${it.desc}</p>
            <a class="btn ghost learn-more" href="solutions.html">Learn More</a>
          </div>
        `;
        solutionsRoot.appendChild(card);
      });
    }
  } catch(e){console.warn('Solutions grid error:', e)}

  // ============================================================================
  // 4. TRAINING/COURSE IMAGES - Update course cards with media config
  // ============================================================================
  try {
    const courseEls = document.querySelectorAll('.training-section .course, .courses .course, [data-media="course"]');
    if (courseEls && media.courses) {
      // Map of course titles to media keys
      const courseMap = {
        'Data Analytics': 'dataAnalytics',
        'Python': 'python',
        'Java': 'java',
        'Web Development': 'webDevelopment',
        'QA Testing': 'softwareTesting',
        'Software Testing': 'softwareTesting',
        'QA & Testing': 'softwareTesting',
        'Cloud & DevOps': 'devops',
        'Cloud & Infrastructure': 'devops',
        'Scrum Master': 'scrumMaster',
        'AWS': 'aws'
      };

      courseEls.forEach((el, idx) => {
        const img = el.querySelector('img');
        const h3 = el.querySelector('h3');
        const title = h3?.textContent?.trim() || '';
        
        let key = courseMap[title];
        if (!key) {
          const keys = Object.keys(media.courses).filter(k => k !== 'default');
          key = keys[idx % keys.length];
        }
        
        if (img) {
          img.src = media.courses[key] || media.courses.default;
          img.onerror = function(){ this.src = media.fallback; };
        }
        if (h3) h3.style.fontWeight = '600';
      });
    }
  } catch(e){console.warn('Training section error:', e)}

  // ============================================================================
  // 5. CLIENTS CAROUSEL - Build from media.clients array
  // ============================================================================
  try {
    const clientsEl = document.querySelector('.clients-carousel');
    if (clientsEl && media.clients && media.clients.length) {
      clientsEl.innerHTML = '';
      media.clients.forEach(c => {
        const d = document.createElement('div');
        d.className = 'client-logo';
        d.innerHTML = `<img src="${c.logo}" alt="${c.name}" title="${c.name}" onerror="this.src='${media.fallback}'"/>`;
        clientsEl.appendChild(d);
      });
    }
  } catch(e){console.warn('Clients carousel error:', e)}

  // ============================================================================
  // 6. SPECIAL IMAGES - Placement, testimonials, etc.
  // ============================================================================
  try {
    // Placement highlights image
    const placementImg = document.querySelector('[data-media="placement"], img[alt*="Placement"]');
    if (placementImg) {
      placementImg.src = media.special.placementHighlights;
      placementImg.alt = 'Placement Highlights';
      placementImg.onerror = function(){ this.src = media.fallback; };
    }

    // Default testimonial/student avatar
    const avatars = document.querySelectorAll('[data-media="avatar"], .avatar img');
    avatars.forEach(el => {
      if (!el.src) {
        el.src = media.testimonials.defaultAvatar;
        el.alt = 'Student/Trainer Avatar';
      }
    });
  } catch(e){console.warn('Special images error:', e)}

  // ============================================================================
  // 7. SOCIAL MEDIA ICONS - If referenced in HTML
  // ============================================================================
  try {
    const socialMap = {
      'facebook': media.social.facebook,
      'instagram': media.social.instagram,
      'twitter': media.social.twitter,
      'whatsapp': media.social.whatsapp
    };

    Object.entries(socialMap).forEach(([name, url]) => {
      const socials = document.querySelectorAll(`[data-social="${name}"]`);
      socials.forEach(el => {
        if (el.tagName === 'IMG') {
          el.src = url;
          el.alt = `${name} icon`;
        } else if (el.style) {
          el.style.backgroundImage = `url('${url}')`;
        }
      });
    });
  } catch(e){console.warn('Social icons error:', e)}

  // ============================================================================
  // 8. CONTACT CONFIGURATION - Email, phone, WhatsApp links
  // ============================================================================
  if (window.config && window.config.contact) {
    try {
      document.querySelectorAll('a[href^="mailto"]').forEach(el => {
        el.href = 'mailto:' + window.config.contact.email;
        el.textContent = window.config.contact.email;
      });
      
      document.querySelectorAll('a[href^="tel"]').forEach(el => {
        const phone = window.config.contact.phone.replace(/\s/g, '').replace('+', '');
        el.href = 'tel:+' + phone;
        el.textContent = window.config.contact.phone;
      });
      
      document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
        el.href = 'https://wa.me/' + window.config.contact.whatsapp;
      });
    } catch(e){console.warn('Contact config error:', e)}
  }

  // ============================================================================
  // 9. DEBUG MODE - Log loaded media stats
  // ============================================================================
  if (window.location.hash === '#media-debug') {
    console.log('=== MEDIA CONFIGURATION LOADED ===');
    console.log('Branding:', window.media.branding);
    console.log('Heroes:', Object.keys(window.media.hero).length + ' pages');
    console.log('Solutions:', Object.keys(window.media.solutions).length + ' types');
    console.log('Courses:', Object.keys(window.media.courses).length + ' courses');
    console.log('Clients:', window.media.clients.length + ' clients');
    console.log('Case Studies:', window.media.caseStudies.length + ' studies');
  }

  initializeCarousels();
});

