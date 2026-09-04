const fs = require('fs');
const path = require('path');

const canonicalPath = path.join(__dirname, '../public/landing-pages/inner-green-3d.canonical.html');
const targetPath = path.join(__dirname, '../public/landing-pages/inner-green-3d.html');

let html = fs.readFileSync(canonicalPath, 'utf8');

// 1. Google Font for Syncopate and Plus Jakarta Sans in <head>
if (!html.includes('family=Syncopate')) {
  html = html.replace(/<head>/i, `<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syncopate:wght@400;700&display=swap" rel="stylesheet">`);
}

// 2. Remove the new nav bar entirely (keep only the notch navbar)
html = html.replace(
  /<div\s+class="dock-wrap"[\s\S]*?<\/div>\s*(?=<div\s+class="stage")/i,
  '<!-- dock removed in favor of notch navbar -->'
);

// 3. Replace Ghost wordmark with nothing (since front headline is POLARIS now)
html = html.replace(
  /<div\s+class="ghost\s+fade"[^>]*>SYLVA<\/div>/gi,
  ''
);

// 4. Headline: PolarisState.png wordmark logo
html = html.replace(
  /<h1\s+class="headline"[\s\S]*?<\/h1>/i,
  `<h1 class="headline" style="--pd:18; --pr:1.2">
      <span><i style="--d:260ms"><img src="/PolarisState.png" alt="Polaris" class="headline-logo-img" /></i></span>
    </h1>`
);

// 5. Lede
html = html.replace(
  /<p\s+class="lede\s+mask"[\s\S]*?<\/p>/i,
  '<p class="lede mask" style="--d:480ms; --pd:14; --pr:1">Autonomous citation verification, prerequisite gap analysis, and grounded revision plans for serious students.</p>'
);

// 6. Explore button -> Login to Workspace with click action
html = html.replace(
  /<button\s+class="liquid-button\s+liquid-button--explore\s+btn"[\s\S]*?<\/button>/i,
  `<button class="liquid-button liquid-button--explore btn" type="button" onclick="window.top.location.href='/login'">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:calc(19 * var(--u));height:calc(19 * var(--u));margin-right:calc(8 * var(--u));">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <span class="lbl">Login to Workspace</span>
          </button>`
);

// 7. Play button -> click action to /demo
html = html.replace(
  /aria-label="Play the film"/gi,
  'aria-label="Watch Polaris Demo" onclick="window.top.location.href=\'/demo\'"'
);

// 8. Cards text
html = html.replace(
  /<p\s+class="label">Our Ethos<\/p>\s*<h2>Let the wild lead\.<\/h2>/i,
  '<p class="label">Architecture</p>\n      <h2>Grounded Citations.</h2>'
);
html = html.replace(
  /<p\s+class="label">Field Note 07<\/p>\s*<h2>After the Rain<\/h2>/i,
  '<p class="label">Diagnostics</p>\n      <h2>Prerequisite Trees.</h2>'
);

// 9. Stats
html = html.replace(
  /<div><dt>Canopy restored<\/dt><dd>282 ha<\/dd><\/div>/i,
  '<div><dt>Citations verified</dt><dd>99.4%</dd></div>'
);
html = html.replace(
  /<div><dt>Native species<\/dt><dd>43 mapped<\/dd><\/div>/i,
  '<div><dt>Knowledge nodes</dt><dd>14.2k</dd></div>'
);

// 10. Polaris Dark Theme Styles & Smooth Anti-Glitch Engine
const polarisThemeCss = `<style data-polaris-theme>
html, body {
  background: #020616 !important;
  overflow: hidden !important;
  width: 100% !important;
  height: 100% !important;
  height: 100svh !important;
  touch-action: pan-y !important;
}
.hero {
  height: 100% !important;
  min-height: 0 !important;
  max-height: 100% !important;
  overflow: hidden !important;
  background:
    radial-gradient(64% 52% at 27% 84%, rgba(124, 58, 237, 0.16) 0%, rgba(124, 58, 237, 0) 72%),
    radial-gradient(70% 60% at 92% 8%,  rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0) 68%),
    #020616 !important;
}
.hero::after {
  background:
    radial-gradient(72% 44% at 50% 117%, rgba(124, 58, 237, 0.32) 0%, rgba(59, 130, 246, 0.18) 42%, rgba(16, 185, 129, 0.08) 72%, transparent 88%),
    linear-gradient(180deg, rgba(2, 6, 22, 0) 54%, rgba(124, 58, 237, 0.04) 78%, rgba(59, 130, 246, 0.08) 100%) !important;
}
:root {
  --ink: #ffffff !important;
  --ink-soft: rgba(255, 255, 255, 0.75) !important;
  --ink-faint: rgba(255, 255, 255, 0.45) !important;
  --rule: rgba(255, 255, 255, 0.08) !important;
  --card: rgba(8, 14, 34, 0.86) !important;
  --card-ink: #ffffff !important;
  --card-label: #a78bfa !important;
}

/* ── Eliminate all glitching / jerky stepping / rapid jumps ───────────── */
.par {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
  will-change: transform;
}
.pixel-reveal,
.card figure::after {
  display: none !important;
}
.portal-media {
  clip-path: none !important;
  animation: none !important;
  opacity: 1 !important;
}
.ghost {
  display: none !important;
}
.dock-wrap {
  display: none !important;
}

/* ── Modern Polaris Brand Wordmark (PolarisState.png) ── */
.headline {
  left: calc(56 * var(--u)) !important;
  top: calc(150 * var(--u)) !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
}
.headline span {
  display: block !important;
  padding: 0 !important;
}
.headline span i {
  display: inline-block !important;
}
.headline-logo-img {
  display: block !important;
  width: calc(340 * var(--u)) !important;
  max-width: 82vw !important;
  height: auto !important;
  object-fit: contain !important;
  pointer-events: none !important;
  user-select: none !important;
  filter: drop-shadow(0 calc(10 * var(--u)) calc(32 * var(--u)) rgba(0, 0, 0, 0.8)) !important;
}

@media (max-width: 900px) {
  .headline {
    left: calc(34 * var(--u)) !important;
    top: calc(120 * var(--u)) !important;
  }
  .headline-logo-img {
    width: min(calc(280 * var(--u)), 75vw) !important;
  }
}

/* ── Left-Stacked Clean Copy & Action Stack ────────────────────────────── */
.lede {
  left: calc(56 * var(--u)) !important;
  top: calc(285 * var(--u)) !important;
  width: calc(380 * var(--u)) !important;
  font-family: 'Plus Jakarta Sans', var(--font-jakarta), system-ui, sans-serif !important;
  font-size: calc(15.5 * var(--u)) !important;
  line-height: calc(25 * var(--u)) !important;
  font-weight: 400 !important;
  color: rgba(255, 255, 255, 0.74) !important;
}

.pill-clip {
  left: calc(56 * var(--u)) !important;
  top: calc(415 * var(--u)) !important;
  margin: 0 !important;
  width: auto !important;
  clip-path: none !important;
}
.liquid-button--explore {
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(124, 58, 237, 0.3) !important;
}
.liquid-button--explore .lbl {
  font-family: 'Plus Jakarta Sans', var(--font-jakarta), sans-serif !important;
  font-size: calc(15 * var(--u)) !important;
  font-weight: 700 !important;
  letter-spacing: calc(0.02em) !important;
}

.play-wrap {
  left: calc(305 * var(--u)) !important;
  top: calc(412 * var(--u)) !important;
  margin: 0 !important;
  position: absolute;
  z-index: 4;
}

.stat--a {
  left: calc(56 * var(--u)) !important;
  top: calc(525 * var(--u)) !important;
}
.stat--b {
  left: calc(245 * var(--u)) !important;
  top: calc(525 * var(--u)) !important;
}
.stat div dd {
  color: #38bdf8 !important;
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-weight: 700 !important;
  text-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
}
.stat dt {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
}

/* ── Cards in Glass Architecture ───────────────────────────────────────── */
.card {
  border: 1px solid rgba(167, 139, 250, 0.25) !important;
  box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.14) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
}
.card h2 {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-weight: 700 !important;
}
</style>`;

if (!html.includes('data-polaris-theme')) {
// 8. Celestial Violet & Indigo 3D Tree Shader Customization
html = html.replace(
  /'\s*vec3 silver = mix\(vec3\(0\.020, 0\.019, 0\.018\), vec3\(0\.290, 0\.283, 0\.264\), grain\);'/,
  `'  vec3 silver = mix(vec3(0.012, 0.010, 0.025), vec3(0.125, 0.115, 0.220), grain);'`
);
html = html.replace(
  /'\s*vec3 umber\s*=\s*mix\(vec3\(0\.024, 0\.019, 0\.016\), vec3\(0\.175, 0\.140, 0\.110\), grain\);'/,
  `'  vec3 umber  = mix(vec3(0.016, 0.010, 0.030), vec3(0.088, 0.065, 0.155), grain);'`
);
html = html.replace(
  /'\s*vec3 moss = mix\(vec3\(0\.0204, 0\.0311, 0\.0050\), vec3\(0\.0914, 0\.1392, 0\.0227\), mo\);'/,
  `'  vec3 moss = mix(vec3(0.024, 0.012, 0.056), vec3(0.120, 0.045, 0.235), mo);'`
);
html = html.replace(
  /'\s*vec3 deep = vec3\(0\.0126, 0\.0192, 0\.0031\);[\s\S]*?'\s*vec3 tipHi = vec3\(0\.2600, 0\.3900, 0\.0640\);'/,
  `'  vec3 deep = vec3(0.018, 0.009, 0.052);',
        '  vec3 mid  = vec3(0.075, 0.028, 0.175);',
        '  vec3 tip  = vec3(0.180, 0.075, 0.335);',
        '  vec3 tipHi = vec3(0.390, 0.220, 0.600);'`
);
html = html.replace(
  /'\s*vec3 base = mix\(vec3\(0\.0270, 0\.0450, 0\.0099\), vec3\(0\.0690, 0\.1150, 0\.0253\), vTint\);'/,
  `'  vec3 base = mix(vec3(0.035, 0.018, 0.088), vec3(0.115, 0.055, 0.235), vTint);'`
);
html = html.replace(
  /'\s*vec3 col = mix\(vec3\(0\.30, 0\.72, 0\.46\), vec3\(0\.86, 1\.00, 0\.90\), rim\);'/,
  `'  vec3 col = mix(vec3(0.55, 0.32, 0.95), vec3(0.92, 0.88, 1.00), rim);'`
);
html = html.replace(
  /new THREE\.Color\(1\.14, 1\.06, 0\.88\)/g,
  `new THREE.Color(1.12, 1.04, 1.28)`
);
html = html.replace(
  /new THREE\.Color\(0\.78, 0\.78, 0\.62\)/g,
  `new THREE.Color(0.65, 0.45, 0.95)`
);
html = html.replace(
  /new THREE\.Color\(0\.086, 0\.090, 0\.080\)/g,
  `new THREE.Color(0.075, 0.050, 0.120)`
);
html = html.replace(
  /new THREE\.Color\(0\.176, 0\.195, 0\.145\)/g,
  `new THREE.Color(0.145, 0.095, 0.240)`
);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully updated inner-green-3d.html: dock removed, Polaris modern headline, celestial violet tree!');
