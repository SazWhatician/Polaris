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

// 4. Headline: "Polaris" in modern font
html = html.replace(
  /<h1\s+class="headline"[\s\S]*?<\/h1>/i,
  `<h1 class="headline" style="--pd:18; --pr:1.2">
      <span><i style="--d:260ms">Polaris</i></span>
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
}
.hero {
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

/* ── Modern Polaris Typography ────────────────────────────────────────── */
.headline {
  left: calc(56 * var(--u)) !important;
  top: calc(180 * var(--u)) !important;
  font-family: 'Syncopate', var(--font-syncopate), -apple-system, sans-serif !important;
  font-size: calc(76 * var(--u)) !important;
  line-height: calc(80 * var(--u)) !important;
  letter-spacing: calc(0.06em) !important;
  text-transform: uppercase !important;
  color: #ffffff !important;
}
.headline span i {
  background: linear-gradient(135deg, #ffffff 35%, #c7d2fe 75%, #818cf8 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  filter: drop-shadow(0 6px 30px rgba(124, 58, 237, 0.40)) !important;
  display: inline-block;
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
  html = html.replace(/<\/head>/i, polarisThemeCss + '\n</head>');
}

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully updated inner-green-3d.html: dock removed, Polaris modern headline, glitching eliminated!');
