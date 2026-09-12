# 🦝 Bandit Bay

Ein vollständig spielbares Mobile-/Webgame: Du baust deine eigene Insel auf, drehst an einem
Spielautomaten, überfällst die Dörfer anderer Spieler und sammelst Karten-Sets.

Eigene Marke, eigene Grafiken (alles SVG/CSS), eigene Charaktere – Maskottchen ist der
Waschbär **Rufus**. Alle Ressourcen sind virtuell, es gibt **kein Echtgeld** und keine Käufe.

---

## Schnellstart

```bash
cd bandit-bay
npm install        # installiert Server + Client (npm workspaces)
npm run dev        # Server auf :4000, Client auf :5173
```

Danach `http://localhost:5173` öffnen, Namen eingeben, spielen.

Produktionsbuild (Server liefert den gebauten Client mit aus):

```bash
npm run build
npm start          # http://localhost:4000
```

Weitere Skripte:

| Befehl | Wirkung |
| --- | --- |
| `npm run test` | Smoke-Test der kompletten Spiellogik (In-Memory-DB) |
| `npm run typecheck` | TypeScript-Prüfung für Server und Client |
| `npm run seed -w server` | Mitspieler-Bots nachlegen |
| `python3 tools/generate-audio.py` | Platzhalter-Sounds neu erzeugen |

---

## Tech-Stack und warum

| Bereich | Wahl | Begründung |
| --- | --- | --- |
| Frontend | React 18 + TypeScript + Vite | schneller Dev-Server, typsicher, sofort startklar |
| Styling | Tailwind CSS 3 | kompaktes, konsistentes Mobile-UI ohne eigenes CSS-Framework |
| Animation | CSS-Keyframes + Framer Motion | Walzenlauf per CSS (performant), Overlays/Popups per Motion |
| Backend | Node.js + Express 5 (REST) | minimal, stabil, keine Build-Magie |
| Datenbank | SQLite via better-sqlite3 | eine Datei, keine Installation, synchron und schnell |
| Grafik | eigene SVG-Komponenten | keine fremden Assets, skaliert scharf auf allen Displays |
| Audio | WAV-Platzhalter (generiert) | austauschbare Dateien, keine Lizenzfragen |

Der Server ist die einzige Autorität: Spins, Beute, Kosten, Karten und Belohnungen werden
serverseitig berechnet und validiert. Der Client sendet nur Absichten („dreh", „bau aus",
„greife Feld 2 an") und zeigt das Ergebnis an.

---

## Spielablauf

1. **Drehen** – 6 Symbole (Taler, Beutel, Schild, Sturmhammer, Banditenpfote, Truhe).
   Der Server zieht das Ergebnis aus einer Gewinntabelle und baut das Walzenbild passend dazu.
2. **Auswerten** – 3 gleiche Symbole zahlen groß, 2 gleiche klein:
   * Taler → Münzen (× Einsatz × Level × Insel)
   * Beutel → zusätzliche Drehungen
   * Schild → schützt vor einem Angriff (max. 3)
   * Sturmhammer → ein Angriff
   * Banditenpfote → ein Raubzug
   * Truhe → Sammelkarte (+ Taler, Duplikate zahlen Taler)
3. **Angriff** – Ziel wählen, Gebäude antippen. Hat das Ziel ein Schild, prallt der Angriff ab,
   sonst verliert das Gebäude eine Stufe und du bekommst Beute.
4. **Raubzug** – vier Grabstellen, ein Jackpot, zwei mittlere Funde, eine leer.
   Die erbeuteten Taler werden dem Ziel abgezogen.
5. **Ausbauen** – fünf Gebäude pro Insel, je fünf Stufen. Ist alles ausgebaut, geht es zur
   nächsten von sechs Inseln (höhere Inseln zahlen deutlich mehr).
6. **Sammeln** – 30 Karten in 6 Sets, Karten aus Truhen (Taler) oder dem Automaten.
   Ein komplettes Set gibt ein großes Bonuspaket.

Dazu: Tagesquests, 7-Tage-Belohnungsleiter, Rangliste, Ereignisverlauf, Einsatzstufen
(×1 bis ×1000, mit Level freigeschaltet) und automatisches Drehen.

---

## Balance in Kürze

Alle Werte stehen an einer Stelle: `server/src/content/content.ts`.

* **Gewinntabelle** `SPIN_TABLE`: ~32 % Dreifachtreffer, ~48 % Zweifachtreffer, ~20 % Niete.
  Angriff ca. alle 17 Drehungen, Raubzug ca. alle 20.
* **Auszahlung** `coinValue(level, insel)`: Grundwert 90, +32 % pro Level, +55 % pro Insel.
* **Ausbaukosten** `upgradeCost()`: Faktor 1,62 pro Stufe, Insel-Multiplikator 1 → 68.
  Dadurch geht Insel 1 sehr schnell, spätere Inseln brauchen echte Raubzüge.
* **Drehungen**: Start 75, Kapazität 75 + 3 × Level, +1 alle 3 Minuten.
* **Level**: `xpForNextLevel = 260 × level^1.35`, Level-Up gibt Taler, Drehungen und
  alle 5 Level ein Schild.

---

## Projektstruktur

```
bandit-bay/
├─ server/
│  ├─ src/content/content.ts   Spielinhalte + Balance (Inseln, Karten, Quests, Gewinntabelle)
│  ├─ src/game/                core (Nutzer/XP/Spins), slot, village, battle, collection, progress
│  ├─ src/routes/api.ts        REST-Endpunkte
│  ├─ src/db.ts                SQLite-Schema und Migration
│  ├─ src/seed.ts              Mitspieler-Bots
│  └─ src/test/smoke.ts        Test des kompletten Spielablaufs
├─ client/
│  ├─ src/components/art/      eigene SVGs (Symbole, Gebäude, Karten, Maskottchen)
│  ├─ src/components/          TopBar, VillageScene, SlotMachine, Overlays, Navigation
│  ├─ src/screens/             Login, Karten, Freunde, Quests, Belohnungen
│  ├─ src/game/GameContext.tsx zentraler Spielzustand
│  └─ public/audio/            Soundeffekte (austauschbar)
└─ tools/generate-audio.py     erzeugt die Platzhalter-Sounds
```

---

## API (alle Spielaktionen serverseitig validiert)

| Methode | Pfad | Zweck |
| --- | --- | --- |
| `GET` | `/api/config` | Inseln, Symbole, Karten, Sets, Truhen, Quests, Balance |
| `POST` | `/api/auth/register` | Spieler anlegen, liefert Token |
| `GET` | `/api/auth/me`, `/api/state` | Spielstand, Quests, Tagesbelohnung |
| `POST` | `/api/spin` | Drehung (Einsatz wird geprüft) |
| `POST` | `/api/bet` | Einsatzstufe setzen |
| `POST` | `/api/village/upgrade` | Gebäude ausbauen |
| `GET` | `/api/targets` | Ziele für Angriff/Raubzug |
| `POST` | `/api/attack`, `/api/raid` | Minispiele auswerten |
| `GET` | `/api/collection` | Karten, Sets, Truhenpreise |
| `POST` | `/api/collection/chest`, `/api/collection/set` | Truhe öffnen, Set einlösen |
| `GET/POST` | `/api/quests`, `/api/quests/claim` | Tagesquests |
| `GET/POST` | `/api/daily`, `/api/daily/claim` | Tagesbelohnung |
| `GET` | `/api/leaderboard`, `/api/history` | Rangliste, Ereignisse |

Authentifizierung: `Authorization: Bearer <token>`; der Token liegt im `localStorage`.

Gespeichert werden: Nutzer, Taler, Drehungen, Schilde, Level, Erfahrung, Inseln, Gebäude und
deren Stufen, Karten, Karten-Sets, Quests, Tagesbelohnungen sowie Angriffs- und Raid-Historie.

---

## Eigene Assets einsetzen

* **Sounds**: Dateien in `client/public/audio/` mit gleichem Namen ersetzen
  (`spin.wav`, `coin.wav`, `attack.wav`, `raid.wav`, `upgrade.wav`, `reward.wav`, `levelup.wav`, …).
* **Grafiken**: Die SVG-Komponenten unter `client/src/components/art/` austauschen –
  `SymbolIcon` (Walzensymbole), `BuildingArt` (Gebäude nach Typ und Stufe),
  `CardArt` (Kartenmotive), `Raccoon` (Maskottchen).
* **Inhalte**: Inseln, Gebäude, Karten, Quests und Belohnungen in
  `server/src/content/content.ts` anpassen – Client und Datenbank folgen automatisch.

---

## Hinweis

Bandit Bay ist ein eigenständiges Spiel. Es verwendet keine Namen, Figuren, Texte, Logos oder
Grafiken bestehender Spiele. Sämtliche Währungen, Drehungen und Belohnungen sind virtuell;
es gibt keine Kaufmöglichkeit und kein Glücksspiel mit echtem Geld.
