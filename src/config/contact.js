// Central contact and configuration
window.config = {
  contact: {
    phone: '+91 98847 70747',
    email: 'HR@codfis.com',
    whatsapp: '919884770747',
    address: 'Royapettah, Chennai, India'
  },
  social: {
    instagram: 'https://www.instagram.com/codfis_tech?igsh=dnRtNGViaGUxYWRt',
    facebook: 'https://www.facebook.com/codfis',
    twitter: 'https://x.com/codfis_tech',
    linkedin: 'https://www.linkedin.com/company/codfis'
  }
};

// Apply config to footer and contact sections on page
document.addEventListener('DOMContentLoaded', function(){
  if (!window.config) return;

  // Update all email links
  document.querySelectorAll('a[href^="mailto"]').forEach(el => {
    el.href = 'mailto:' + window.config.contact.email;
    el.textContent = window.config.contact.email;
  });

  // Update all phone links
  document.querySelectorAll('a[href^="tel"]').forEach(el => {
    el.href = 'tel:+' + window.config.contact.phone.replace(/\s/g, '').replace('+', '');
    el.textContent = window.config.contact.phone;
  });

  // Update all WhatsApp links
  document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
    el.href = 'https://wa.me/' + window.config.contact.whatsapp;
  });
});
