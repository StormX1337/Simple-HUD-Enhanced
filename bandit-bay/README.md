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

**Auf dem Handy im gleichen WLAN:** Vite zeigt beim Start eine zweite Adresse an
(`Network: http://192.168.x.x:5173`) – die im Handy-Browser öffnen. Für die installierte
Variante (Startbildschirm-Symbol, Vollbild) erst `npm run build` und dann `npm start`;
das Spiel läuft dann komplett unter `http://<PC-IP>:4000` und lässt sich über
„Zum Startbildschirm hinzufügen" installieren.

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
| `python3 tools/generate-audio.py` | Sounds und Musik neu erzeugen |
| `npm run balance -w server` | Balance-Simulation: spielt die Engine durch und zeigt den Aufwand pro Insel |
| `node tools/ui-smoke.mjs` | Durchspiel-Test der Oberfläche (braucht laufenden Dev-Server und Playwright) |
| `node tools/generate-icons.mjs` | App-Icons neu erzeugen (braucht Playwright) |

Tipp für die Gebäude-Grafiken: `http://localhost:5173/?gallery` zeigt alle Gebäudetypen in allen
Ausbaustufen nebeneinander.

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
   nächsten von acht Inseln (höhere Inseln zahlen deutlich mehr).
6. **Sammeln** – 40 Karten in 8 Sets, Karten aus Truhen (Taler) oder dem Automaten.
   Ein komplettes Set gibt ein großes Bonuspaket.

Dazu: Tagesquests, **Meilensteine** (dauerhafte Ziele mit Belohnung), 7-Tage-Belohnungsleiter,
Rangliste, Ereignisverlauf, Einsatzstufen (×1 bis ×1000, mit Level freigeschaltet) und
automatisches Drehen.

**Events** – viermal täglich (6, 12, 18 und 22 Uhr UTC, jeweils 60 Minuten) läuft ein Event.
Der Typ wechselt reihum, der Countdown läuft im Banner über der Insel, gerechnet wird
serverseitig:

| Event | Wirkung |
| --- | --- |
| 🪙 Talerregen | Alle Taler zählen doppelt |
| 🎒 Beutelfest | Beutel-Symbole geben doppelte Drehungen |
| 🐾 Raubzugnacht | +50 % Beute bei Raubzügen |
| 🛡️ Schildstunde | Drei Schilde geben zwei, zwei Schilde doppelte Taler |

**Glücksrad** – einmal pro Tag kostenlos drehen: acht Felder mit Talern, Drehungen, Schild,
Karte und Jackpot. Das Feld zieht der Server, der Client animiert nur darauf zu.

**Turnier „Beutejagd"** – dreitägige Zyklen. Angriffe und Raubzüge geben Punkte
(10/15 für Angriffe, 5/20/35 für Raubzüge), die Rangliste läuft gegen alle Mitspieler.
Nach Zyklusende wartet der Preis (bis 3 Mio. Taler und 200 Drehungen für Platz 1) im
Turnier-Tab.

**Freunde** – im Freunde-Tab kannst du Mitspieler (auch die Bots wie „Miko Maske") über ihren
Namen hinzufügen. Freunde tauchen bevorzugt als Ziel auf und lassen sich direkt aus der Liste
angreifen oder ausrauben. Dein eigener Name steht oben zum Weitergeben.

**Dekorationen** – über den 🌴-Knopf lassen sich drei Plätze pro Insel mit Palmen, Blumenbeet,
Fackeln, Lagerfeuer, Zaun, Brunnen, Fahne oder Steinwächter schmücken. Deko kostet Taler
(auf späteren Inseln mehr) und bleibt dauerhaft stehen.

**Karten verschenken** – doppelte Karten lassen sich über das 🎁 auf der Karte an Freunde
weitergeben (fünf pro Tag). Der Beschenkte sieht es beim nächsten Start in der Übersicht.

**Inselübersicht** – ein Tipp auf das Inselschild zeigt alle sechs Inseln mit Fortschritt und
Gebäudestand; fertige Inseln bleiben sichtbar.

**Während du weg warst** – kommst du nach ein paar Stunden zurück, hat die Insel weitergelebt:
Bots greifen an (Schilde blocken) oder stehlen Taler. Beim Start zeigt eine Übersicht, was
passiert ist – inklusive Rache-Knopf, wenn du gerade einen Angriff oder Raubzug offen hast.
Verluste sind gedeckelt (höchstens 20 % der Taler, erst ab Level 3, maximal 12 Stunden werden
nachgeholt).

**Begleiter** – fünf Tiere mit eigenem Bonus *und* eigener Fähigkeit. Füttern kostet Taler und
aktiviert das Tier für 4 Stunden; es kann immer nur eines aktiv sein. Jede vierte Fütterung
bringt eine Stufe (max. 5), die Bonus und Fähigkeitschance um je 15 % anhebt.

| Begleiter | Ab Insel | Bonus | Fähigkeit |
| --- | --- | --- | --- |
| Fina (Füchsin) | 1 | +40 % Raubzug-Beute | **Spürnase** – deckt vor dem Graben eine leere Stelle auf |
| Bodo (Bär) | 2 | +50 % Angriffs-Beute | **Doppelschlag** – trifft zu 35 % ein zweites Gebäude |
| Pia (Papagei) | 3 | +25 % Taler am Automaten | **Federleicht** – gibt zu 18 % die Drehung zurück |
| Kiki (Erdmännchen) | 4 | +20 % Schildschutz | **Wachposten** – wehrt zu 45 % Angriffe ab, ohne Schild zu verbrauchen |
| Otto (Otter) | 5 | +50 % Wert doppelter Karten | **Feilscher** – Truhen kosten 25 % weniger |

---

## Balance in Kürze

Alle Werte stehen an einer Stelle: `server/src/content/content.ts`.

* **Gewinntabelle** `SPIN_TABLE`: ~32 % Dreifachtreffer, ~48 % Zweifachtreffer, ~20 % Niete.
  Angriff ca. alle 17 Drehungen, Raubzug ca. alle 20.
* **Auszahlung** `coinValue(level, insel)`: Grundwert 90, +32 % pro Level, +55 % pro Insel.
* **Ausbaukosten** `upgradeCost()`: Faktor 1,62 pro Stufe, Insel-Multiplikator 1 → 330.
  Dadurch geht Insel 1 sehr schnell, spätere Inseln brauchen echte Raubzüge.
* **Drehungen**: Start 75, Kapazität 75 + 3 × Level, +1 alle 3 Minuten.
* **Level**: `xpForNextLevel = 260 × level^1.35`, Level-Up gibt Taler, Drehungen und
  alle 5 Level ein Schild.
* **Begleiter**: Futter kostet 12.000 bis 1,5 Mio. Taler (+20 % pro Spielerlevel), Wirkdauer
  4 Stunden. Boni und Fähigkeiten rechnet der Server auf Auszahlung, Beute und Truhenpreise.
* **Drehungen voll?** Beutel-Symbole und Rad-Felder zahlen dann in Talern aus, statt zu verfallen.

**Wie lange dauert das Spiel?** `npm run balance -w server` spielt die echte Engine durch.
Aktueller Stand: Insel 1 nach wenigen Drehungen, danach etwa 180 / 360 / 640 / 1.600 / 2.900 /
4.800 / 8.800 – zusammen rund 19.000 Drehungen bis Insel 8, von denen der Automat gut die
Hälfte wieder zurückgibt.

---

## Projektstruktur

```
bandit-bay/
├─ server/
│  ├─ src/content/content.ts   Spielinhalte + Balance (Inseln, Karten, Quests, Gewinntabelle)
│  ├─ src/game/                core (Nutzer/XP/Spins), slot, village, battle, collection,
│  │                          progress, pets, achievements, wheel, tournament, friends,
│  │                          absence (Bot-Überfälle während der Abwesenheit)
│  ├─ src/routes/api.ts        REST-Endpunkte
│  ├─ src/db.ts                SQLite-Schema und Migration
│  ├─ src/seed.ts              Mitspieler-Bots
│  └─ src/test/smoke.ts        Test des kompletten Spielablaufs
├─ client/
│  ├─ src/components/art/      eigene SVGs (Symbole, Gebäude, Karten, Maskottchen)
│  ├─ src/components/          TopBar, VillageScene, SlotMachine, Overlays, Navigation
│  ├─ src/screens/             Login, Karten, Freunde, Turnier, Quests, Meilensteine,
│  │                          Tagesbonus, Glücksrad, Begleiter, Events
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
| `POST` | `/api/profile` | Name und Wappentier ändern |
| `POST` | `/api/village/upgrade` | Gebäude ausbauen |
| `GET` | `/api/targets` | Ziele für Angriff/Raubzug (Freunde bevorzugt) |
| `GET/POST` | `/api/friends`, `/api/friends/add`, `/api/friends/remove` | Freundesliste |
| `GET` | `/api/villages` | Übersicht aller Inseln mit Fortschritt |
| `GET/POST` | `/api/decorations`, `/api/decorations/buy`, `/api/decorations/remove` | Insel-Deko |
| `POST` | `/api/attack`, `/api/raid` | Minispiele auswerten |
| `POST` | `/api/raid/prepare` | Grabstellen vorbereiten (für Finas Spürnase) |
| `GET` | `/api/collection` | Karten, Sets, Truhenpreise |
| `POST` | `/api/collection/chest`, `/api/collection/set` | Truhe öffnen, Set einlösen |
| `POST` | `/api/collection/gift` | Doppelte Karte an einen Freund verschenken |
| `GET/POST` | `/api/quests`, `/api/quests/claim` | Tagesquests |
| `GET/POST` | `/api/daily`, `/api/daily/claim` | Tagesbelohnung |
| `GET/POST` | `/api/achievements`, `/api/achievements/claim` | Meilensteine und ihre Belohnungen |
| `GET` | `/api/events` | Laufendes Event und Zeitplan der nächsten Fenster |
| `GET/POST` | `/api/wheel`, `/api/wheel/spin` | Glücksrad (einmal pro Tag) |
| `GET/POST` | `/api/tournament`, `/api/tournament/claim` | Turnierstand und Preis |
| `GET` | `/api/target/:id` | Einzelnes Ziel laden (Rache aus der Ereignisliste) |
| `POST` | `/api/news/seen` | Ereignisse als gesehen markieren |
| `GET` | `/api/pets` | Begleiter mit Status, Kosten und Restlaufzeit |
| `POST` | `/api/pets/feed` | Begleiter füttern (Taler und Freischaltung werden geprüft) |
| `GET` | `/api/leaderboard`, `/api/history` | Rangliste, Ereignisse |

Authentifizierung: `Authorization: Bearer <token>`; der Token liegt im `localStorage`.

Gespeichert werden: Nutzer, Taler, Drehungen, Schilde, Level, Erfahrung, Inseln, Gebäude und
deren Stufen, Karten, Karten-Sets, Quests, Meilensteine, Tagesbelohnungen, Glücksrad-Drehungen,
Turnierpunkte, Begleiter, Freundschaften, Dekorationen sowie Angriffs- und Raid-Historie.

Das gebaute Spiel ist eine PWA: `client/public/manifest.webmanifest`, ein kleiner Service
Worker (`client/public/sw.js`, hält nur die App-Hülle im Cache, niemals Spielstände) und
eigene Icons unter `client/public/icons/`.

---

## Eigene Assets einsetzen

* **Sounds**: Dateien in `client/public/audio/` mit gleichem Namen ersetzen
  (`spin.wav`, `coin.wav`, `attack.wav`, `raid.wav`, `upgrade.wav`, `reward.wav`, `levelup.wav`, …).
  `music.wav` ist eine ruhige Endlosschleife; Ton und Musik lassen sich im Menü getrennt
  abschalten (Musik startet erst nach der ersten Berührung, so wollen es die Browser).
* **Grafiken**: Die SVG-Komponenten unter `client/src/components/art/` austauschen –
  `SymbolIcon` (Walzensymbole), `BuildingArt` (Gebäude nach Typ und Stufe),
  `CardArt` (Kartenmotive), `PetArt` (fünf Begleiter), `DecoArt` (Dekorationen),
  `Scenery` (Palmen, Wolken, Sandhügel …),
  `HudIcons` (Taler, Drehungen, Schild, Karten) und `Raccoon` (Maskottchen).
* **Inhalte**: Inseln, Gebäude, Karten, Quests und Belohnungen in
  `server/src/content/content.ts` anpassen – Client und Datenbank folgen automatisch.

---

## Hinweis

Bandit Bay ist ein eigenständiges Spiel. Es verwendet keine Namen, Figuren, Texte, Logos oder
Grafiken bestehender Spiele. Sämtliche Währungen, Drehungen und Belohnungen sind virtuell;
es gibt keine Kaufmöglichkeit und kein Glücksspiel mit echtem Geld.
