/**
 * Erzeugt die App-Icons (PNG) aus einem eigenen SVG.
 *
 * Voraussetzung: Playwright (z. B. `npm i -D playwright && npx playwright install chromium`).
 * Start: node tools/generate-icons.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, '..', 'client', 'public', 'icons');

/** @param {boolean} maskable Bei maskable bleibt außen mehr Rand frei. */
function svg(maskable) {
  const pad = maskable ? 96 : 0;
  const scale = maskable ? 0.62 : 0.86;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8fd6ff"/>
      <stop offset="55%" stop-color="#2f7fb5"/>
      <stop offset="100%" stop-color="#12233f"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe9a0"/>
      <stop offset="50%" stop-color="#f8c73c"/>
      <stop offset="100%" stop-color="#d18b0c"/>
    </linearGradient>
    <linearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d7dfee"/>
      <stop offset="100%" stop-color="#8593ad"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${maskable ? 0 : 110}" fill="url(#bg)"/>
  <g transform="translate(256 ${268 + pad / 6}) scale(${scale}) translate(-256 -268)">
    <circle cx="256" cy="268" r="190" fill="url(#gold)" stroke="#7a4a05" stroke-width="16"/>
    <circle cx="256" cy="268" r="150" fill="#ffdf83" stroke="#c8900f" stroke-width="10"/>
    <g transform="translate(256 268)">
      <circle cx="-88" cy="-86" r="40" fill="url(#fur)" stroke="#2b3242" stroke-width="12"/>
      <circle cx="88" cy="-86" r="40" fill="url(#fur)" stroke="#2b3242" stroke-width="12"/>
      <circle cx="0" cy="-16" r="104" fill="url(#fur)" stroke="#2b3242" stroke-width="12"/>
      <path d="M-98 -22c22-32 56-38 82-22-6 32-30 54-62 56-16 0-26-16-20-34z" fill="#38415a"/>
      <path d="M98 -22c-22-32-56-38-82-22 6 32 30 54 62 56 16 0 26-16 20-34z" fill="#38415a"/>
      <circle cx="-46" cy="-22" r="22" fill="#fff"/>
      <circle cx="46" cy="-22" r="22" fill="#fff"/>
      <circle cx="-42" cy="-18" r="11" fill="#1c2231"/>
      <circle cx="50" cy="-18" r="11" fill="#1c2231"/>
      <ellipse cx="0" cy="34" rx="56" ry="40" fill="#f4f7fc" stroke="#2b3242" stroke-width="10"/>
      <path d="M0 10l22 18-22 18-22-18z" fill="#1c2231"/>
      <path d="M0 46v14" stroke="#1c2231" stroke-width="9" stroke-linecap="round"/>
      <path d="M0 60c-10 12-26 9-32-3M0 60c10 12 26 9 32-3" stroke="#1c2231" stroke-width="9" fill="none" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

for (const [file, maskable, size] of [
  ['icon-512.png', false, 512],
  ['icon-192.png', false, 192],
  ['icon-maskable-512.png', true, 512],
]) {
  await page.setContent(
    `<body style="margin:0">${svg(maskable)}</body>`,
    { waitUntil: 'load' },
  );
  await page.setViewportSize({ width: size, height: size });
  await page.evaluate((value) => {
    const element = document.querySelector('svg');
    if (element) {
      element.setAttribute('width', String(value));
      element.setAttribute('height', String(value));
    }
  }, size);
  await page.screenshot({ path: path.join(out, file), omitBackground: true });
  console.log('  ' + file);
}
await browser.close();
console.log('Icons erzeugt.');
