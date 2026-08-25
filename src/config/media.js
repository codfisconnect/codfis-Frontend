/**
 * Central Media Configuration - Codfis Technologies
 * 
 * This is the single source of truth for all website images and videos.
 * Change image URLs here and they automatically update across the entire website.
 * 
 * FOLDER STRUCTURE:
 * /images/  - Local image assets (legacy location, can migrate to /assets/images)
 * /assets/images/  - Recommended new location for organized images
 * /assets/videos/  - For video files
 * 
 * USAGE:
 * - Reference: media.branding.logo, media.hero.home, etc.
 * - In JavaScript: window.media.branding.logo
 * - HTML: Use media-init.js to inject into DOM or set via JavaScript
 * - CSS: Not recommended (use inline styles or JavaScript for dynamic refs)
 */

window.media = {
  
  // ============================================================================
  // BRANDING & LOGOS
  // ============================================================================
  branding: {
    logo: "/images/Codfis-logo-latest.png",             // Main company logo
    logoSmall: "/images/codfis-Tittle-logo .png",       // Favicon/small logo
    favicon: "/images/codfis-Tittle-logo .png"          // Browser favicon
  },

  // ============================================================================
  // HERO SECTION IMAGES (per page)
  // ============================================================================
  hero: {
    home: "/images/welcome page.png",                   // Homepage hero
    solutions: "/images/training banner.png",           // Solutions page hero
    academy: "/images/training banner.png",             // Academy page hero
    about: "/images/Bg-tech.jpg",                       // About page hero
    careers: "/images/Admin BG.jpg",                    // Careers page hero
    contact: "/images/Bg-tech.jpg",                     // Contact page hero
    caseStudies: "/images/Untitled design (5).png",     // Case studies hero
    courses: "/images/training banner.png"              // Courses page hero
  },

  // ============================================================================
  // SOLUTIONS SECTION IMAGES
  // ============================================================================
  solutions: {
    webDevelopment: "/images/Untitled design (6).png",    // Web Development solution
    webApp: "/images/full stack.png",                     // Web Application solution
    mobileApp: "/images/full stack.png",                  // Mobile App solution
    aiAutomation: "/images/Untitled design (5).png",      // AI & Automation solution
    customSoftware: "/images/img i.png",                  // Custom Software solution
    cloud: "/images/devops.png",                          // Cloud & Infrastructure
    cybersecurity: "/images/MTV LOgo.jpg",                // Cybersecurity solution
    dataAnalytics: "/images/da.png",                      // Data Analytics solution
    uiux: "/images/Untitled design (6).png",              // UI/UX solution
    enterprise: "/images/Bg-tech.jpg",                    // Enterprise Solutions
    digitalTransform: "/images/training banner.png"       // Digital Transformation
  },

  // ============================================================================
  // COURSE / TRAINING IMAGES
  // ============================================================================
  courses: {
    dataAnalytics: "/images/da.png",                  // Data Analytics course
    python: "/images/python.png",                     // Python course
    java: "/images/java.png",                         // Java course
    webDevelopment: "/images/full stack.png",         // Web Development course
    softwareTesting: "/images/software testing.png",  // QA & Testing course
    devops: "/images/devops.png",                     // Cloud & DevOps course
    scrumMaster: "/images/scrum.png",                 // Scrum Master course
    aws: "/images/software testing.png",              // AWS course
    default: "/images/training banner.png"            // Fallback course image
  },

  // ============================================================================
  // CLIENT LOGOS & COMPANIES
  // ============================================================================
  clients: [
    { name: "Madras Bar Council", logo: "/images/Untitled design (5).png" },
    { name: "Fulcrum", logo: "/images/Untitled design (6).png" },
    { name: "Cosmo Tech", logo: "/images/MTV LOgo.jpg" },
    { name: "Student Logo", logo: "/images/Student Logo.jpeg" },
    { name: "Trainee Project", logo: "/images/Trainee Logo.jpg" }
  ],

  // ============================================================================
  // CASE STUDIES
  // ============================================================================
  caseStudies: [
    { 
      image: "/images/Untitled design (5).png", 
      title: "Business Website Transformation",
      description: "Transformed client's web presence with modern design"
    },
    { 
      image: "/images/Untitled design (6).png", 
      title: "AI Business Automation",
      description: "Implemented AI-powered automation for workflow optimization"
    },
    { 
      image: "/images/training banner.png", 
      title: "Custom Web Application",
      description: "Built scalable SaaS platform for enterprise client"
    }
  ],

  // ============================================================================
  // TESTIMONIALS & TRAINERS
  // ============================================================================
  testimonials: {
    defaultAvatar: "/images/Student Logo.jpeg"        // Default trainer/student photo
  },

  // ============================================================================
  // SOCIAL ICONS & GRAPHICS
  // ============================================================================
  social: {
    facebook: "/images/FB_img-removebg-preview.png",
    instagram: "/images/insta-removebg-preview.png",
    twitter: "/images/twitter-x-logo-png-9.png",
    whatsapp: "/images/Whatsapp-removebg-preview.png"
  },

  // ============================================================================
  // SPECIAL SECTIONS
  // ============================================================================
  special: {
    placementHighlights: "/images/placement.png",      // Placement program image
    hyperAutomation: "/images/Acclerate Testing with Hyper Automation.png"
  },

  // ============================================================================
  // VIDEOS (YouTube URLs, local paths, or external URLs)
  // ============================================================================
  videos: {
    hero: "/images/welcome page.png",                 // Hero section video/image
    features: "/images/training banner.png",          // Features demo video
    demo: "",                                         // Demo video URL (add if needed)
    promotional: ""                                   // Promotional video URL
  },

  // ============================================================================
  // FALLBACK & ERROR HANDLING
  // ============================================================================
  fallback: "/images/training banner.png",            // Displayed if image fails to load
  
  /**
   * Get fallback image with optional custom message
   * @param {string} alt - Alt text for fallback
   * @returns {string} - Fallback image URL
   */
  getFallback: function(alt) {
    return this.fallback;
  },

  /**
   * Check if a media file exists and provide alternative
   * Usage: media.getMedia('branding.logo', 'hero.home')
   * @param {...string} paths - Paths to try in order
   * @returns {string} - First available path or fallback
   */
  getMedia: function(...paths) {
    for (let path of paths) {
      const parts = path.split('.');
      let value = this;
      for (let part of parts) {
        value = value?.[part];
        if (!value) break;
      }
      if (value) return value;
    }
    return this.fallback;
  }
};

