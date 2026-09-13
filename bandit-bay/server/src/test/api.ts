/**
 * HTTP-Test aller wichtigen Routen. Startet den echten Server auf einem
 * freien Port mit einer In-Memory-Datenbank.
 *
 * Start: npm run test:api -w server
 */
import type { AddressInfo } from 'node:net';
import { createApp } from '../app.js';
import { BOT_NAMES } from '../content/content.js';

let failures = 0;
function check(label: string, condition: boolean, extra = ''): void {
  if (condition) {
    console.log(`  ok   ${label}${extra ? ` (${extra})` : ''}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${label}${extra ? ` (${extra})` : ''}`);
  }
}

const server = createApp({ serveClient: false, quiet: true }).listen(0);
await new Promise<void>((resolve) => server.once('listening', () => resolve()));
const { port } = server.address() as AddressInfo;
const base = `http://127.0.0.1:${port}/api`;

let token = '';

interface Answer {
  status: number;
  body: Record<string, unknown>;
}

async function call(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  withToken = true,
): Promise<Answer> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(withToken && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
  };
}

/* --- Öffentliche Routen ----------------------------------------------- */
const health = await call('GET', '/health', undefined, false);
check('Health-Route antwortet', health.status === 200 && health.body.ok === true);

const config = await call('GET', '/config', undefined, false);
check('Config liefert acht Inseln', (config.body.villages as unknown[])?.length === 8);
const symbols = (config.body.symbols ?? []) as { id: string; weight: number }[];
check('Config liefert sieben Symbole', symbols.length === 7, symbols.map((entry) => entry.id).join(','));
check(
  'Joker ist nur Wild-Symbol',
  symbols.find((entry) => entry.id === 'joker')?.weight === 0,
);
check('Config liefert 40 Karten', (config.body.cards as unknown[])?.length === 40);
check('Config enthält Event und Avatare', !!config.body.event && !!config.body.avatars);

const unauthorized = await call('GET', '/state', undefined, false);
check('Ohne Token kein Spielstand', unauthorized.status === 401);

/* --- Anmeldung -------------------------------------------------------- */
const name = `ApiTest${Math.floor(Math.random() * 100000)}`;
const register = await call('POST', '/auth/register', { name, avatar: '🦊' }, false);
check('Registrierung klappt', register.status === 200 && typeof register.body.token === 'string');
token = String(register.body.token ?? '');

const duplicate = await call('POST', '/auth/register', { name }, false);
check('Doppelter Name wird abgelehnt', duplicate.status === 409);

const shortName = await call('POST', '/auth/register', { name: 'x' }, false);
check('Zu kurzer Name wird abgelehnt', shortName.status === 400);

/* --- Spielstand ------------------------------------------------------- */
const state = await call('GET', '/state');
const player = state.body.state as Record<string, unknown>;
check('Spielstand kommt zurück', state.status === 200 && player?.name === name);
check('Quests dabei', (state.body.quests as unknown[])?.length === 5);
check('Tagesbelohnung dabei', !!state.body.daily);
check('Fünf Gebäude auf der Insel', (player?.buildings as unknown[])?.length === 5);

/* --- Drehen ----------------------------------------------------------- */
const spin = await call('POST', '/spin', { bet: 1 });
check('Drehung liefert drei Symbole', (spin.body.reels as unknown[])?.length === 3);
const spinState = spin.body.state as { stats?: { spins?: number }; spins?: number; spinCapacity?: number };
check('Drehung wird gezählt', spinState?.stats?.spins === 1, `${spinState?.stats?.spins}`);
check(
  'Drehungen bleiben im Rahmen',
  (spinState?.spins ?? 0) <= (spinState?.spinCapacity ?? 0),
  `${spinState?.spins}/${spinState?.spinCapacity}`,
);

const badBet = await call('POST', '/spin', { bet: 7 });
check('Unbekannter Einsatz wird abgelehnt', badBet.status === 400);

const tooBigBet = await call('POST', '/bet', { bet: 1000 });
check('Gesperrter Einsatz wird abgelehnt', tooBigBet.status === 400);

/* --- Ausbau ----------------------------------------------------------- */
const upgrade = await call('POST', '/village/upgrade', { index: 0 });
check('Ausbau klappt', upgrade.status === 200 && upgrade.body.newLevel === 1);
const badUpgrade = await call('POST', '/village/upgrade', { index: 42 });
check('Unbekanntes Gebäude wird abgelehnt', badUpgrade.status === 404);

/* --- Ziele und Kämpfe -------------------------------------------------- */
const targets = await call('GET', '/targets');
check('Ziele kommen zurück', (targets.body.targets as unknown[])?.length > 0);
const noAttack = await call('POST', '/attack', {
  targetId: (targets.body.targets as { id: string }[])[0].id,
  spotIndex: 0,
});
check('Angriff ohne Hammer wird abgelehnt', noAttack.status === 400);

/* --- Glücksrad, Turnier, Meilensteine ---------------------------------- */
const wheel = await call('GET', '/wheel');
check('Glücksrad hat acht Felder', ((wheel.body.wheel as { segments: unknown[] })?.segments ?? []).length === 8);
const wheelSpin = await call('POST', '/wheel/spin');
check('Glücksrad dreht', wheelSpin.status === 200 && typeof wheelSpin.body.index === 'number');
const wheelAgain = await call('POST', '/wheel/spin');
check('Glücksrad nur einmal pro Tag', wheelAgain.status === 400);

const tournament = await call('GET', '/tournament');
check('Turnier liefert Rangliste', ((tournament.body.tournament as { entries: unknown[] })?.entries ?? []).length > 0);

const achievements = await call('GET', '/achievements');
check('Meilensteine kommen zurück', (achievements.body.achievements as unknown[])?.length === 13);

const events = await call('GET', '/events');
check('Event-Zeitplan kommt zurück', (events.body.upcoming as unknown[])?.length === 6);

/* --- Freunde ---------------------------------------------------------- */
const addFriend = await call('POST', '/friends/add', { name: BOT_NAMES[0].name });
check('Freund hinzugefügt', addFriend.status === 200);
const friends = await call('GET', '/friends');
check('Freundesliste enthält ihn', (friends.body.friends as unknown[])?.length === 1);
const unknownFriend = await call('POST', '/friends/add', { name: 'GibtEsNichtXYZ' });
check('Unbekannter Freund wird abgelehnt', unknownFriend.status === 404);

/* --- Deko und Profil --------------------------------------------------- */
const decorations = await call('GET', '/decorations');
check('Deko-Angebot kommt zurück', ((decorations.body.decorations as { offers: unknown[] })?.offers ?? []).length === 8);
const badDeco = await call('POST', '/decorations/buy', { slot: 99, decoId: 'deco_palme' });
check('Ungültiger Deko-Platz wird abgelehnt', badDeco.status === 400);

const profile = await call('POST', '/profile', { name: `${name}B`, avatar: '🐻' });
check('Profil geändert', profile.status === 200 && (profile.body.state as { name: string })?.name === `${name}B`);
const badAvatar = await call('POST', '/profile', { avatar: '💩' });
check('Unbekanntes Wappentier wird abgelehnt', badAvatar.status === 400);

/* --- Inseln und Sammlung ---------------------------------------------- */
const villages = await call('GET', '/villages');
check('Inselübersicht liefert acht Inseln', (villages.body.villages as unknown[])?.length === 8);

const collection = await call('GET', '/collection');
check('Sammlung liefert acht Sets', (collection.body.sets as unknown[])?.length === 8);
check('Truhenpreise dabei', (collection.body.chests as unknown[])?.length === 3);

const leaderboard = await call('GET', '/leaderboard');
check('Rangliste kommt zurück', (leaderboard.body.entries as unknown[])?.length > 0);

const history = await call('GET', '/history');
check('Verlauf kommt zurück', Array.isArray(history.body.entries));

server.close();

if (failures > 0) {
  console.error(`\n${failures} API-Test(s) fehlgeschlagen.`);
  process.exit(1);
}
console.log('\nAlle API-Tests bestanden.');
