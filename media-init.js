document.addEventListener('DOMContentLoaded', function(){
  if (!window.media) return;

  // Update hero image
  try {
    const heroImg = document.querySelector('.hero-visual img');
    if (heroImg && media.hero && media.hero.home) {
      heroImg.src = media.hero.home;
      heroImg.alt = 'Hero visual';
      heroImg.onerror = function(){ this.src = media.fallback; };
    }
  } catch(e){console.warn('Hero image error:', e)}

  // Rebuild solutions grid to use media config
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

  // Update training/course images
  try {
    const courseEls = document.querySelectorAll('.training-section .course');
    if (courseEls && media.courses) {
      const map = media.courses;
      const keys = Object.keys(map);
      courseEls.forEach((el, idx) => {
        const img = el.querySelector('img');
        const h3 = el.querySelector('h3');
        const key = keys[idx % keys.length];
        if (img) {
          img.src = map[key];
          img.onerror = function(){ this.src = media.fallback; };
        }
        if (h3) h3.style.fontWeight = '600';
      });
    }
  } catch(e){console.warn('Training section error:', e)}

  // Build clients carousel using media.clients
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

  // Apply contact config if available
  if (window.config && window.config.contact) {
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
  }
});

