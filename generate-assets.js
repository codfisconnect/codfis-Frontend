const fs = require('fs');
const path = require('path');

const dirs = [
  'images/clients',
  'images/hero',
  'images/development',
  'images/training',
  'images/projects',
  'images/icons'
];

dirs.forEach(d => {
  const p = path.resolve(__dirname, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// 1. Client logos (Clearly marked as neutral placeholders)
for (let i = 1; i <= 6; i++) {
  const num = String(i).padStart(2, '0');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 50" width="180" height="50">
  <rect width="180" height="50" rx="6" fill="#141414" stroke="#262626" stroke-width="1"/>
  <circle cx="32" cy="25" r="9" fill="#202020" stroke="#f5c400" stroke-width="1.5"/>
  <text x="52" y="29" fill="#a1a1a1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5">CLIENT ${num}</text>
</svg>`;
  fs.writeFileSync(path.resolve(__dirname, `images/clients/client-${num}.svg`), svg);
}

// 2. Hero dashboard visual (Purely conceptual interface labels, zero unverified metrics)
const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 440" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141414"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f5c400"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <!-- Main Window -->
  <rect x="10" y="10" width="660" height="420" rx="12" fill="url(#bgGrad)" stroke="#2b2b2b" stroke-width="1.5"/>
  <!-- Header Bar -->
  <rect x="10" y="10" width="660" height="42" rx="12" fill="#171717"/>
  <circle cx="32" cy="31" r="5" fill="#ef4444"/>
  <circle cx="48" cy="31" r="5" fill="#f5c400"/>
  <circle cx="64" cy="31" r="5" fill="#10b981"/>
  <rect x="90" y="23" width="220" height="16" rx="4" fill="#242424"/>
  <text x="102" y="35" fill="#71717a" font-family="monospace" font-size="10">platform.concept/v2/pipeline</text>
  <rect x="530" y="23" width="115" height="16" rx="8" fill="rgba(245,196,0,0.15)" stroke="rgba(245,196,0,0.3)"/>
  <text x="542" y="35" fill="#f5c400" font-family="sans-serif" font-size="9" font-weight="bold">ARCHITECTURE DEMO</text>

  <!-- Left Sidebar -->
  <rect x="25" y="68" width="140" height="345" rx="8" fill="#121212" stroke="#222" stroke-width="1"/>
  <rect x="40" y="88" width="110" height="10" rx="2" fill="#2a2a2a"/>
  <rect x="40" y="112" width="90" height="10" rx="2" fill="rgba(245,196,0,0.4)"/>
  <rect x="40" y="134" width="100" height="8" rx="2" fill="#202020"/>
  <rect x="40" y="152" width="85" height="8" rx="2" fill="#202020"/>
  <rect x="40" y="170" width="95" height="8" rx="2" fill="#202020"/>

  <rect x="40" y="200" width="110" height="1" fill="#262626"/>
  <rect x="40" y="215" width="80" height="8" rx="2" fill="#242424"/>
  <rect x="40" y="235" width="100" height="8" rx="2" fill="#242424"/>
  <rect x="40" y="255" width="90" height="8" rx="2" fill="#242424"/>

  <!-- Conceptual KPI Cards -->
  <rect x="180" y="68" width="150" height="80" rx="8" fill="#141414" stroke="#262626" stroke-width="1"/>
  <text x="195" y="90" fill="#71717a" font-family="sans-serif" font-size="10" font-weight="600">SYSTEM ARCHITECTURE</text>
  <text x="195" y="118" fill="#f5f5f5" font-family="sans-serif" font-size="17" font-weight="bold">Resilient</text>
  <text x="195" y="136" fill="#10b981" font-family="sans-serif" font-size="10">Active Monitoring</text>

  <rect x="342" y="68" width="150" height="80" rx="8" fill="#141414" stroke="#262626" stroke-width="1"/>
  <text x="357" y="90" fill="#71717a" font-family="sans-serif" font-size="10" font-weight="600">TEST AUTOMATION</text>
  <text x="357" y="118" fill="#f5f5f5" font-family="sans-serif" font-size="17" font-weight="bold">Playwright</text>
  <text x="357" y="136" fill="#f5c400" font-family="sans-serif" font-size="10">Continuous Gate</text>

  <rect x="504" y="68" width="150" height="80" rx="8" fill="#141414" stroke="#262626" stroke-width="1"/>
  <text x="519" y="90" fill="#71717a" font-family="sans-serif" font-size="10" font-weight="600">API GATEWAY</text>
  <text x="519" y="118" fill="#f5c400" font-family="sans-serif" font-size="17" font-weight="bold">Modular</text>
  <text x="519" y="136" fill="#38bdf8" font-family="sans-serif" font-size="10">Token Auth &amp; Rate Limit</text>

  <!-- Conceptual Graph Panel -->
  <rect x="180" y="160" width="474" height="160" rx="8" fill="#121212" stroke="#262626" stroke-width="1"/>
  <text x="200" y="185" fill="#a1a1a1" font-family="sans-serif" font-size="12" font-weight="600">Deployment Pipeline &amp; Integration Flow</text>
  <line x1="200" y1="210" x2="630" y2="210" stroke="#1c1c1c" stroke-dasharray="3,3"/>
  <line x1="200" y1="245" x2="630" y2="245" stroke="#1c1c1c" stroke-dasharray="3,3"/>
  <line x1="200" y1="280" x2="630" y2="280" stroke="#1c1c1c" stroke-dasharray="3,3"/>
  <path d="M200 280 C240 250, 270 270, 310 230 C350 190, 390 240, 430 210 C470 180, 520 220, 560 195 L630 185" fill="none" stroke="url(#accentGrad)" stroke-width="3"/>
  <path d="M200 280 C240 250, 270 270, 310 230 C350 190, 390 240, 430 210 C470 180, 520 220, 560 195 L630 185 L630 300 L200 300 Z" fill="rgba(245,196,0,0.06)"/>

  <!-- Conceptual Lower strip -->
  <rect x="180" y="332" width="230" height="80" rx="8" fill="#141414" stroke="#262626" stroke-width="1"/>
  <text x="195" y="352" fill="#71717a" font-family="sans-serif" font-size="10" font-weight="600">SECURITY PROTOCOLS</text>
  <rect x="195" y="362" width="180" height="6" rx="3" fill="#242424"/>
  <rect x="195" y="362" width="165" height="6" rx="3" fill="#10b981"/>
  <text x="195" y="392" fill="#f5f5f5" font-family="sans-serif" font-size="11">Input Sanitization &amp; Safe Uploads</text>

  <rect x="424" y="332" width="230" height="80" rx="8" fill="#141414" stroke="#262626" stroke-width="1"/>
  <text x="439" y="352" fill="#71717a" font-family="sans-serif" font-size="10" font-weight="600">QUALITY ASSURANCE PIPELINE</text>
  <text x="439" y="375" fill="#38bdf8" font-family="monospace" font-size="11">Automated UI &amp; API Regression</text>
  <text x="439" y="394" fill="#71717a" font-family="monospace" font-size="10">Framework Design &amp; Test Execution</text>
</svg>`;
fs.writeFileSync(path.resolve(__dirname, 'images/hero/hero-dashboard.svg'), heroSvg);

// 3. Software development architecture preview
const devSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 320" width="100%" height="100%">
  <rect width="540" height="320" rx="10" fill="#121212" stroke="#262626" stroke-width="1"/>
  <rect x="20" y="20" width="500" height="30" rx="6" fill="#1a1a1a"/>
  <circle cx="38" cy="35" r="4" fill="#ef4444"/>
  <circle cx="52" cy="35" r="4" fill="#f5c400"/>
  <circle cx="66" cy="35" r="4" fill="#10b981"/>
  <rect x="90" y="27" width="150" height="16" rx="3" fill="#252525"/>
  <rect x="30" y="70" width="230" height="100" rx="6" fill="#161616" stroke="#282828"/>
  <rect x="45" y="85" width="120" height="10" rx="2" fill="#f5c400"/>
  <rect x="45" y="105" width="180" height="6" rx="2" fill="#333"/>
  <rect x="45" y="118" width="140" height="6" rx="2" fill="#333"/>
  <rect x="45" y="135" width="80" height="18" rx="4" fill="#2a2a2a"/>
  <rect x="280" y="70" width="230" height="100" rx="6" fill="#161616" stroke="#282828"/>
  <rect x="295" y="85" width="90" height="10" rx="2" fill="#38bdf8"/>
  <rect x="295" y="105" width="170" height="6" rx="2" fill="#333"/>
  <rect x="295" y="118" width="130" height="6" rx="2" fill="#333"/>
  <rect x="295" y="135" width="80" height="18" rx="4" fill="#2a2a2a"/>
  <rect x="30" y="185" width="480" height="110" rx="6" fill="#0e0e0e" stroke="#222"/>
  <text x="50" y="212" fill="#f5c400" font-family="monospace" font-size="12">export async function buildEnterpriseSolution() {</text>
  <text x="70" y="235" fill="#34d399" font-family="monospace" font-size="11">  const architecture = await deployMicroservices();</text>
  <text x="70" y="255" fill="#38bdf8" font-family="monospace" font-size="11">  return architecture.verifyQualityGates();</text>
  <text x="50" y="275" fill="#f5c400" font-family="monospace" font-size="12">}</text>
</svg>`;
fs.writeFileSync(path.resolve(__dirname, 'images/development/dev-architecture.svg'), devSvg);

// 4. Training workshop visual
const trainSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 320" width="100%" height="100%">
  <rect width="540" height="320" rx="10" fill="#121212" stroke="#262626" stroke-width="1"/>
  <rect x="20" y="20" width="240" height="180" rx="8" fill="#171717" stroke="#282828"/>
  <circle cx="50" cy="50" r="16" fill="rgba(245,196,0,0.15)" stroke="#f5c400"/>
  <text x="41" y="55" fill="#f5c400" font-family="sans-serif" font-size="13" font-weight="bold">PW</text>
  <text x="80" y="48" fill="#f5f5f5" font-family="sans-serif" font-size="13" font-weight="bold">Playwright Labs</text>
  <text x="80" y="65" fill="#71717a" font-family="sans-serif" font-size="10">End-to-End Automation Track</text>
  <rect x="40" y="85" width="200" height="4" rx="2" fill="#252525"/>
  <rect x="40" y="85" width="160" height="4" rx="2" fill="#f5c400"/>
  <text x="40" y="110" fill="#a1a1a1" font-family="sans-serif" font-size="10">Framework Architecture</text>
  <text x="40" y="130" fill="#a1a1a1" font-family="sans-serif" font-size="10">Mock APIs &amp; CI/CD Pipelines</text>

  <rect x="280" y="20" width="240" height="180" rx="8" fill="#171717" stroke="#282828"/>
  <circle cx="310" cy="50" r="16" fill="rgba(56,189,248,0.15)" stroke="#38bdf8"/>
  <text x="303" y="55" fill="#38bdf8" font-family="sans-serif" font-size="13" font-weight="bold">JS</text>
  <text x="340" y="48" fill="#f5f5f5" font-family="sans-serif" font-size="13" font-weight="bold">Full Stack JS Track</text>
  <text x="340" y="65" fill="#71717a" font-family="sans-serif" font-size="10">Node, React &amp; Cloud Systems</text>
  <rect x="300" y="85" width="200" height="4" rx="2" fill="#252525"/>
  <rect x="300" y="85" width="140" height="4" rx="2" fill="#38bdf8"/>
  <text x="300" y="110" fill="#a1a1a1" font-family="sans-serif" font-size="10">Project Portfolio Focus</text>
  <text x="300" y="130" fill="#a1a1a1" font-family="sans-serif" font-size="10">REST APIs &amp; Database Modeling</text>

  <rect x="20" y="215" width="500" height="85" rx="8" fill="#0e0e0e" stroke="#242424"/>
  <text x="38" y="240" fill="#34d399" font-family="monospace" font-size="11">$ npx playwright test</text>
  <text x="38" y="260" fill="#a1a1a1" font-family="monospace" font-size="11">Running automated test suites in parallel workers</text>
  <text x="38" y="280" fill="#f5c400" font-family="monospace" font-size="11">Test execution verified &#10004;</text>
</svg>`;
fs.writeFileSync(path.resolve(__dirname, 'images/training/training-workshop.svg'), trainSvg);

// 5. Selected Work Mockups (Explicitly labeled as Concept/Demonstration, zero unverified metrics)
const p1Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="100%" height="100%">
  <rect width="480" height="260" rx="8" fill="#151515" stroke="#2a2a2a" stroke-width="1"/>
  <rect x="15" y="15" width="450" height="26" rx="4" fill="#1e1e1e"/>
  <circle cx="30" cy="28" r="4" fill="#ef4444"/>
  <circle cx="42" cy="28" r="4" fill="#f5c400"/>
  <circle cx="54" cy="28" r="4" fill="#10b981"/>
  <rect x="70" y="20" width="140" height="14" rx="3" fill="#282828"/>
  <rect x="25" y="55" width="130" height="185" rx="6" fill="#181818"/>
  <rect x="170" y="55" width="285" height="100" rx="6" fill="#181818"/>
  <path d="M190 130 Q240 70 300 110 T430 90" fill="none" stroke="#f5c400" stroke-width="2.5"/>
  <rect x="170" y="165" width="135" height="75" rx="6" fill="#181818"/>
  <rect x="320" y="165" width="135" height="75" rx="6" fill="#181818"/>
</svg>`;
fs.writeFileSync(path.resolve(__dirname, 'images/projects/project-workflow.svg'), p1Svg);

const p2Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="100%" height="100%">
  <rect width="480" height="260" rx="8" fill="#151515" stroke="#2a2a2a" stroke-width="1"/>
  <rect x="15" y="15" width="450" height="26" rx="4" fill="#1e1e1e"/>
  <rect x="25" y="55" width="430" height="185" rx="6" fill="#101010"/>
  <text x="45" y="85" fill="#38bdf8" font-family="monospace" font-size="12">&#9654; Continuous Test Pipeline [Automation Framework]</text>
  <rect x="45" y="100" width="390" height="8" rx="4" fill="#202020"/>
  <rect x="45" y="100" width="350" height="8" rx="4" fill="#10b981"/>
  <text x="45" y="135" fill="#f5f5f5" font-family="monospace" font-size="11">&#10004; Authentication Journey Validation</text>
  <text x="45" y="155" fill="#f5f5f5" font-family="monospace" font-size="11">&#10004; End-to-End Workflow Assertions</text>
  <text x="45" y="175" fill="#f5f5f5" font-family="monospace" font-size="11">&#10004; API Regression Tests Integrated</text>
  <text x="45" y="205" fill="#f5c400" font-family="monospace" font-size="12">Continuous Integration Quality Gate</text>
</svg>`;
fs.writeFileSync(path.resolve(__dirname, 'images/projects/project-qa.svg'), p2Svg);

const p3Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="100%" height="100%">
  <rect width="480" height="260" rx="8" fill="#151515" stroke="#2a2a2a" stroke-width="1"/>
  <rect x="15" y="15" width="450" height="26" rx="4" fill="#1e1e1e"/>
  <circle cx="100" cy="140" r="45" fill="none" stroke="#f5c400" stroke-width="2"/>
  <text x="68" y="145" fill="#f5c400" font-family="sans-serif" font-size="11" font-weight="bold">API Gateway</text>
  <line x1="145" y1="140" x2="220" y2="90" stroke="#333" stroke-width="2"/>
  <line x1="145" y1="140" x2="220" y2="190" stroke="#333" stroke-width="2"/>
  <rect x="220" y="65" width="100" height="50" rx="6" fill="#181818" stroke="#282828"/>
  <text x="232" y="95" fill="#38bdf8" font-family="sans-serif" font-size="11">Auth Service</text>
  <rect x="220" y="165" width="100" height="50" rx="6" fill="#181818" stroke="#282828"/>
  <text x="230" y="195" fill="#10b981" font-family="sans-serif" font-size="11">Data Engine</text>
  <line x1="320" y1="90" x2="370" y2="140" stroke="#333" stroke-width="2"/>
  <line x1="320" y1="190" x2="370" y2="140" stroke="#333" stroke-width="2"/>
  <rect x="370" y="115" width="80" height="50" rx="6" fill="#181818" stroke="#282828"/>
  <text x="385" y="145" fill="#a1a1a1" font-family="sans-serif" font-size="11">Storage</text>
</svg>`;
fs.writeFileSync(path.resolve(__dirname, 'images/projects/project-api.svg'), p3Svg);

console.log('Regenerated clean, verified SVG assets without fabricated metrics.');
