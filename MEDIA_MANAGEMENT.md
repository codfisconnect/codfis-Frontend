# Media Management Guide — Codfis Technologies

**Last Updated**: August 25, 2026  
**Purpose**: Centralized image and video management system

---

## Overview

All website images and videos are managed from a **single central configuration file**: `src/config/media.js`

When you need to change an image URL, update it **once** in media.js and it automatically updates across the entire website.

---

## File Locations

```
Project Root/
├── src/config/
│   └── media.js                    # Central media configuration (⭐ EDIT HERE)
├── media-init.js                   # Initializes media on page load
├── images/
│   ├── codfis-logo.png             # Logo
│   ├── welcome page.png            # Hero image
2. **DOM ready** → `media-init.js` runs on DOMContentLoaded
│   └── [30+ other images]
│
└── [HTML pages with data-media attributes]
```

---

## How It Works

1. **Page loads** → browser reads `src/config/media.js`
// In HTML (auto-injected via media-init.js)
3. **Image injection** → All images reference `media.js` config
4. **Change image** → Edit `media.js` once, updates everywhere

---

## Using the Media Configuration

### Example 1: Get Logo URL
```javascript
// In JavaScript
window.media.branding.logo
// Returns: "/images/codfis-logo.png"

// In HTML (auto-injected via media-init.js)
<img data-media="branding.logo">  // Automatically resolved
```

### Example 2: Get Course Image
```javascript
window.media.courses.python
// Returns: "/images/python.png"
```

### Example 3: Get Solution Image
```javascript
window.media.solutions.webDevelopment
// Returns: "/images/Untitled design (6).png"
```

### Example 4: Get Client Logo
```javascript
window.media.clients[0].logo
// Returns: "/images/Untitled design (5).png"
```

### Example 5: Fallback Image
```javascript
window.media.fallback
// Returns: "/images/training banner.png"
```

---

## Media Configuration Structure

### BRANDING & LOGOS
```javascript
media.branding = {
  logo: "/images/Codfis-logo-latest.png",              // Main logo
  logoSmall: "/images/codfis-Tittle-logo .png", // Favicon
  favicon: "/images/codfis-Tittle-logo .png"    // Browser icon
}
```

### HERO IMAGES (per page)
```javascript
media.hero = {
  home: "/images/welcome page.png",
  solutions: "/images/training banner.png",
  academy: "/images/training banner.png",
  about: "/images/Bg-tech.jpg",
  careers: "/images/Admin BG.jpg",
  contact: "/images/Bg-tech.jpg",
  // ... more pages
}
```

### SOLUTIONS SECTION
```javascript
media.solutions = {
  webDevelopment: "/images/Untitled design (6).png",
  webApp: "/images/full stack.png",
  mobileApp: "/images/full stack.png",
  aiAutomation: "/images/Untitled design (5).png",
  // ... 11 total solutions
}
```

### COURSES/TRAINING
```javascript
media.courses = {
  dataAnalytics: "/images/da.png",
  python: "/images/python.png",
  java: "/images/java.png",
  webDevelopment: "/images/full stack.png",
  softwareTesting: "/images/software testing.png",
  devops: "/images/devops.png",
  scrumMaster: "/images/scrum.png",
  aws: "/images/software testing.png",
  default: "/images/training banner.png"  // Fallback
}
```

### CLIENTS/COMPANIES
```javascript
media.clients = [
  { name: "Madras Bar Council", logo: "/images/Untitled design (5).png" },
  { name: "Fulcrum", logo: "/images/Untitled design (6).png" },
  // ... array of client objects
]
```

### SOCIAL MEDIA ICONS
```javascript
media.social = {
  facebook: "/images/FB_img-removebg-preview.png",
  instagram: "/images/insta-removebg-preview.png",
  twitter: "/images/twitter-x-logo-png-9.png",
  whatsapp: "/images/Whatsapp-removebg-preview.png"
}
```

### SPECIAL IMAGES
```javascript
media.special = {
  placementHighlights: "/images/placement.png",
  hyperAutomation: "/images/Acclerate Testing with Hyper Automation.png"
}

### VIDEOS
```javascript
media.videos = {
  hero: "/images/welcome page.png",
  features: "/images/training banner.png",
  demo: "",                          // Add YouTube URL or local path
  promotional: ""                    // Add URL if available
}
```

### FALLBACK
```javascript
media.fallback: "/images/training banner.png"   // Shown if image fails to load
```

---

## How to Change an Image

### Step 1: Open media.js
```bash
src/config/media.js
```

### Step 2: Find the image you want to change
For example, if you want to change the logo:
```javascript
branding: {
  logo: "/images/codfis-logo.png",  // ← CHANGE THIS
  // ...
}

### Step 3: Replace the URL
```javascript
// OLD:
logo: "/images/codfis-logo.png",

// NEW (if uploading to /images folder):
logo: "/images/my-new-logo.png",

// OR (if using external URL):
logo: "https://cdn.example.com/logo.png",
```

### Step 4: Save file
The website automatically updates (page reload may be needed).

---

## Adding a New Image

### Step 1: Upload image file
Place your image in `/images/` folder:
```
/images/my-new-image.png
```

### Step 2: Add entry to media.js
Add a new property to the relevant section:
```javascript
solutions: {
  myNewSolution: "/images/my-new-image.png",  // ← ADD HERE
  // ...
}
```

### Step 3: Use in HTML/JavaScript
**Option A**: Auto-injected (via media-init.js)
```html
<!-- media-init.js handles this automatically -->
```

**Option B**: Manual reference
```javascript
document.querySelector('img').src = window.media.solutions.myNewSolution;
```

---

## Deleting an Unused Image

### Step 1: Find where it's used
Search `src/config/media.js` for the image:
```bash
grep -r "unused-image.png" src/config/
```

### Step 2: Remove from media.js
Delete the entry:
// DELETE THIS:
unusedImage: "/images/unused-image.png",
```

### Step 3: Delete physical file
Remove from `/images/` folder:
```bash
rm images/unused-image.png
```

### Step 4: Check for broken references
Search entire project for any remaining references:
```bash
grep -r "unused-image.png" .
```

---

## Loading Images in HTML

### Automatic (Recommended)
Images are auto-loaded from media.js via media-init.js. Just ensure elements have correct class/id:

```html
<!-- Logo (auto-updated) -->
<div class="logo">
  <img data-media="branding.logo" alt="Logo">
</div>

<!-- Course images (auto-updated) -->
<div class="course">
  <img data-media="courses.dataAnalytics" alt="Course" />
</div>
<!-- Placement image (auto-updated via data attribute) -->
<img data-media="placement" src="..." />
```

### Manual (For custom uses)
```html
<img id="my-hero" src="" alt="Hero" />

<script>
  // Wait for media to load
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('my-hero').src = window.media.hero.home;
  });
</script>
```

---

## Loading Videos

### Local Video File
```javascript
media.videos.demo = "/videos/demo.mp4"  // In /videos folder
```

Then use in HTML:
```html
<video controls>
  <source src="/videos/demo.mp4" type="video/mp4">
</video>

### External Video (YouTube)
```javascript
media.videos.promotional = "https://www.youtube.com/embed/VIDEO_ID"
```

Then embed:
```html
<iframe 
  width="560" height="315" 
  src="https://www.youtube.com/embed/VIDEO_ID"
  frameborder="0" 
  allowfullscreen>
</iframe>
```

---

## Debugging Media Loading

### Check if media.js loaded
Open browser console and type:
```javascript
window.media
// Should display the entire media object
console.log(window.media.branding.logo)
```

### Enable debug mode
Append `#media-debug` to URL:
```
http://localhost:3000/index.html#media-debug
```

Then open browser console (F12) to see loaded media stats.

### Common issues
- **Blank images**: Check browser console for 404 errors
- **Old image still showing**: Force refresh (Ctrl+Shift+R or Cmd+Shift+R)
- **Media undefined**: Ensure media.js loads BEFORE media-init.js in page `<script>` tags
- **Image path wrong**: Check file exists in /images folder

---

## Folder Organization (Optional)

If you want to organize images better, create subfolders:

```
/assets (NEW - optional, for better organization)
├── /images
│   ├── /branding        # Logo, favicon
│   ├── /heroes          # Hero images
│   ├── /solutions       # Solution images
│   ├── /clients         # Client logos
│   ├── /social          # Social media icons
│   └── /special         # Testimonials, etc.
├── /videos
│   ├── /demos           # Demo videos
│   └── /promotional     # Marketing videos
```

Then update paths in media.js:
```javascript
branding: {
  logo: "/assets/images/branding/logo.png",      // ← Updated path
  // ...
}
```

---

## Best Practices

1. **Use descriptive names**
   - ✅ Good: `pythonCourseImage`, `solutionWebDevelopment`
   - ❌ Bad: `image1`, `pic2`, `logo_old`

2. **Keep one source of truth**
   - Edit image URL ONLY in media.js
   - Never hardcode image paths in HTML/CSS/JS elsewhere

   - Always set `media.fallback` to a safe default
   - Media-init.js automatically uses it on load error

4. **Organize by category**
   - Group related images (solutions, courses, clients)
   - Add comments in media.js for sections

5. **Test after changes**
   - Change an image in media.js
   - Reload page (Ctrl+Refresh)

6. **Use consistent naming**
   - camelCase for JavaScript: `pythonCourse`, `webDevelopment`
   - Lowercase with hyphens for files: `python-course.png`, `web-dev.png`

---

## File Reference Table

| File | Purpose | Edit for |
|------|---------|----------|
| `src/config/media.js` | Central config | **Change image URLs here** |
| `media-init.js` | Auto-injection | Debug/extend media loading |
| `/images/` | Local assets | **Upload new images here** |
| HTML files | Display | Optional: add `data-media` attributes |

---

## Quick Actions Cheat Sheet

### Change logo
```javascript
// In src/config/media.js
branding: {
  logo: "/images/new-logo.png"  // ← Change this
}
```

### Change hero image
```javascript
// In src/config/media.js
hero: {
  home: "/images/new-hero.jpg"  // ← Change this
}
```

### Change course image
```javascript
// In src/config/media.js
courses: {
  python: "/images/new-python-course.png"  // ← Change this
}
```

### Change solution image
```javascript
// In src/config/media.js
solutions: {
  webDevelopment: "/images/new-solution.png"  // ← Change this
}
```

### Add new course
// In src/config/media.js
courses: {
  react: "/images/react-course.png",  // ← Add new
```javascript
clients: [
  // ... existing clients
  { name: "New Company", logo: "/images/new-client-logo.png" }  // ← Add new
]

- **Shows old image?** → Clear cache (Ctrl+Shift+Delete)
- **URL not found?** → Verify path in media.js is correct
- **Multiple locations**? → Check media-init.js handles that element type
- **Need new feature?** → Edit media-init.js or media.js

---

## Version History

**v1.0** (Aug 25, 2026)
- Initial centralized media system
- Logo, hero, solutions, courses, clients, social, special images
- Fallback image handling
- Debug mode support
- 30+ images centrally managed

---

**Keep it simple: Edit media.js once, changes apply everywhere! 🎨**
