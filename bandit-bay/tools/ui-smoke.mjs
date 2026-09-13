/**
 * Durchspiel-Test der Oberfläche mit Playwright.
 *
 * Voraussetzung: laufender Dev-Server (npm run dev) und installiertes
 * Playwright (z. B. `npm i -D playwright && npx playwright install chromium`).
 * Start: node tools/ui-smoke.mjs [url] [screenshot-ordner]
 */
import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:5173';
const SHOTS = process.argv[3] ?? 'ui-screenshots';
const errors = [];
const seen = { attack: 0, raid: 0, card: 0, upgrade: 0, spins: 0 };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

const visible = async (sel) => page.locator(sel).first().isVisible().catch(() => false);

await page.goto(URL, { waitUntil: 'networkidle' });
await page.screenshot({ path: `${SHOTS}/01-login.png` });

const name = 'Tester' + Math.floor(Math.random() * 100000);
await page.fill('#name', name);
await page.click('button[type="submit"]');
await page.waitForSelector('[data-testid=spin-button]', { timeout: 15000 });
const newsClose = page.locator('[data-testid=news-close]');
if (await newsClose.isVisible().catch(() => false)) await newsClose.click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/02-village.png` });

for (let i = 0; i < 70; i++) {
  const spin = page.locator('[data-testid=spin-button]');
  // warten, bis die Walzen stehen (Spannungsmoment dauert länger)
  let ready = false;
  for (let w = 0; w < 14; w++) {
    if (await spin.isEnabled()) { ready = true; break; }
    await page.waitForTimeout(500);
  }

  if (await visible('[data-testid=big-win]')) {
    await page.locator('[data-testid=big-win]').click().catch(() => undefined);
    await page.waitForTimeout(600);
    continue;
  }
  if (await visible('[data-testid=card-reveal]')) {
    seen.card++;
    if (seen.card === 1) await page.screenshot({ path: `${SHOTS}/03-card.png` });
    await page.locator('[data-testid=card-close]').click().catch(() => undefined);
    await page.waitForTimeout(500);
    continue;
  }
  if (await visible('[data-testid=attack-overlay]')) {
    seen.attack++;
    if (seen.attack === 1) await page.screenshot({ path: `${SHOTS}/04-attack-targets.png` });
    await page.locator('[data-testid=target-item]').first().click();
    await page.waitForTimeout(800);
    if (seen.attack === 1) await page.screenshot({ path: `${SHOTS}/05-attack-village.png` });
    await page.locator('[data-testid=attack-spot]').nth(1).click();
    await page.waitForTimeout(1600);
    if (seen.attack === 1) await page.screenshot({ path: `${SHOTS}/06-attack-result.png` });
    await page.locator('[data-testid=attack-finish]').click().catch(() => undefined);
    await page.waitForTimeout(700);
    if (await visible('[data-testid=attack-overlay]')) {
      await page.locator('[data-testid=overlay-close]').first().click().catch(() => undefined);
      await page.waitForTimeout(500);
    }
    continue;
  }
  if (await visible('[data-testid=raid-overlay]')) {
    seen.raid++;
    await page.locator('[data-testid=target-item]').first().click();
    await page.waitForTimeout(800);
    if (seen.raid === 1) await page.screenshot({ path: `${SHOTS}/07-raid-spots.png` });
    await page.locator('[data-testid=raid-spot]').nth(2).click();
    await page.waitForTimeout(1700);
    if (seen.raid === 1) await page.screenshot({ path: `${SHOTS}/08-raid-result.png` });
    await page.locator('[data-testid=raid-finish]').click().catch(() => undefined);
    await page.waitForTimeout(700);
    if (await visible('[data-testid=raid-overlay]')) {
      await page.locator('[data-testid=overlay-close]').first().click().catch(() => undefined);
      await page.waitForTimeout(500);
    }
    continue;
  }

  if (!ready) break;
  await spin.click().catch(() => undefined);
  seen.spins++;
  await page.waitForTimeout(2300);
}
await page.screenshot({ path: `${SHOTS}/09-after-spins.png` });

// offene Overlays schließen – erst weiter, wenn zwei Runden nichts mehr auftaucht
let clean = 0;
for (let round = 0; round < 12 && clean < 2; round++) {
  await page.waitForTimeout(800);
  let closed = false;
  for (const sel of ['[data-testid=big-win]', '[data-testid=card-close]', '[data-testid=overlay-close]']) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 4000 }).catch(() => undefined);
      closed = true;
      await page.waitForTimeout(600);
    }
  }
  clean = closed ? 0 : clean + 1;
}

// Ausbau
await page.locator('[data-testid=building-slot]').first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/10-upgrade-sheet.png` });
const up = page.locator('[data-testid=upgrade-button]');
if (await up.isVisible().catch(() => false) && await up.isEnabled()) {
  await up.click();
  await page.waitForTimeout(1400);
  seen.upgrade++;
}
await page.screenshot({ path: `${SHOTS}/11-after-upgrade.png` });
const close = page.locator('button:has-text("Zu")').first();
if (await close.isVisible().catch(() => false)) await close.click();
await page.waitForTimeout(300);

// Screens
for (const [id, file] of [['cards', '12-cards'], ['friends', '13-friends'], ['quests', '14-quests'], ['rewards', '15-rewards']]) {
  await page.locator(`[data-testid=nav-${id}]`).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/${file}.png` });
}

// Quest-Belohnung abholen (nach den vielen Drehungen sollte eine fertig sein)
await page.locator('[data-testid=nav-quests]').click();
await page.waitForTimeout(1100);
let questClaimed = false;
const questButton = page.locator('button:has-text("Abholen")').first();
if (await questButton.isVisible().catch(() => false)) {
  await questButton.click();
  await page.waitForTimeout(1200);
  questClaimed = true;
  await page.screenshot({ path: `${SHOTS}/14b-quest-claimed.png` });
}

// Meilenstein-Tab kurz öffnen
await page.locator('[data-testid=quests-tab-goals]').click();
await page.waitForTimeout(1000);
await page.screenshot({ path: `${SHOTS}/14c-goals.png` });
await page.locator('[data-testid=quests-tab-daily]').click();
await page.waitForTimeout(600);

// Insel-Übersicht
await page.locator('[data-testid=nav-village]').click();
await page.waitForTimeout(800);
await page.locator('[data-testid=village-sign]').click();
await page.waitForTimeout(1100);
const islandsSeen = await page.locator('[data-testid=villages-close]').isVisible().catch(() => false);
if (islandsSeen) await page.locator('[data-testid=villages-close]').click();
await page.waitForTimeout(500);

// Tagesbelohnung
await page.locator('[data-testid=nav-rewards]').click();
await page.waitForTimeout(1000);
const claim = page.locator('button:has-text("abholen")').first();
let dailyClaimed = false;
if (await claim.isVisible().catch(() => false) && await claim.isEnabled()) {
  await claim.click();
  await page.waitForTimeout(1400);
  dailyClaimed = true;
  await page.screenshot({ path: `${SHOTS}/16-daily-claimed.png` });
  const thanks = page.locator('button:has-text("Danke!")');
  if (await thanks.isVisible().catch(() => false)) await thanks.click();
}

// Truhe
await page.locator('[data-testid=nav-cards]').click();
await page.waitForTimeout(1000);
const chest = page.locator('button:has-text("Treibholztruhe")');
let chestOpened = false;
if (await chest.isEnabled().catch(() => false)) {
  await chest.click();
  await page.waitForTimeout(1400);
  chestOpened = true;
  await page.screenshot({ path: `${SHOTS}/17-chest.png` });
  const weiter = page.locator('button:has-text("Weiter")');
  if (await weiter.isVisible().catch(() => false)) await weiter.click();
}
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/18-cards-final.png` });

// Reload -> Sitzung bleibt erhalten
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const stillLoggedIn = await visible('[data-testid=spin-button]') || await visible('[data-testid=nav-village]');
await page.screenshot({ path: `${SHOTS}/19-reload.png` });

const realErrors = errors.filter((entry) => !entry.includes('ERR_CONNECTION_RESET'));
console.log(
  JSON.stringify(
    { name, seen, questClaimed, islandsSeen, dailyClaimed, chestOpened, stillLoggedIn, errors },
    null,
    2,
  ),
);
await browser.close();
if (realErrors.length > 0) {
  console.error('JavaScript-Fehler im Client:', realErrors);
  process.exit(1);
}
if (seen.spins < 5 || seen.upgrade < 1 || !dailyClaimed || !stillLoggedIn || !islandsSeen) {
  console.error('Kernabläufe wurden nicht durchlaufen.');
  process.exit(1);
}
console.log('UI-Durchlauf bestanden.');
