# Agents.md — AsianMomPomodoro

## Cél és lényeg

Az **AsianMomPomodoro** egy Chrome-bővítmény (MV3) és kis backend szolgáltatás, amely segít fókuszban maradni. Két fő mechanizmust kombinál:

1. **Időalapú pomodoro-ciklusok** (pl. 20 perc fókusz, 5 perc szünet), felhasználói beavatkozással („Igen/Nem”).
2. **Környezeti nudging**: figyeli, milyen weboldalon tartózkodik a felhasználó (pl. Facebook), és szükség esetén azonnali, kisméretű panelen figyelmeztet.

A név („Asian Mom”) játékos, „szigorú, de szerető” hangvételt sugall: rövid, direkt, néha vicces, de mindig támogató üzenetek.

---

## Fő felhasználói érték

- Csökkentett elkalandozás (distractor site-ok).
- Strukturált fókuszidő és pihenő.
- Visszajelzés-kör (Igen/Nem), ami személyre szabáshoz is használható.
- Platformfüggetlen lebegő UI (weboldalak felett), zavarásmentes, gombokkal.

---

## Rendszerkomponensek (áttekintés)

- **Chrome Extension (MV3)**
  - **Service Worker (background):** időzítés, tab-figyelés, API-hívások, értesítések, jogosultságok.
  - **Content Script + UI panel (Vue.js):** Shadow DOM/iframe-alapú, jobb felső sarokban lebegő „mini-bar” két gombbal (Igen/Nem).
  - **Options/Popup oldalak:** beállítások (idők, blokkolt domainek, hangnem).
- **Backend/Proxy API**
  - Titkos 3rd-party kulcsok szerveroldali tárolása.
  - Auth (OAuth2/OIDC/PKCE) + rövid életű access tokenek.
  - Opcionális kliens-oldali kulcspár + aláírt kérések (DPoP-szerű védelem).
  - Üzenetlogika (mikor, mit üzenjünk), felhasználói események gyűjtése, szabályok.

---

## Agentek és felelősségi körök

### 1) **FocusAgent** (Pomodoro vezérlő)

**Cél:** Fókusz–szünet ciklusok ütemezése, időzítők kezelése, állapotkarbantartás.

**Feladatok**

- Pomodoro riasztás létrehozása `chrome.alarms`-szal (alapértelmezés 20/5 perc).
- Riasztáskor üzenet küldése a UI panelnek („Szünetet tartasz?”) és/vagy natív értesítés gombokkal.
- Válaszok feldolgozása (Igen → szünet indul; Nem → halasztás/folytatás).
- Állapot mentése `chrome.storage`-ba (aktuális fázis, hátralévő idő, megszakítások).
- Heurisztika: ha sok „Nem”, javasol enyhébb promptot vagy rövidebb sprintet.

**Inputok**

- Felhasználói kattintás (Igen/Nem).
- Beállítások (idők, értesítés típusa).
- Backend szabályok (pl. ajánlott ritmus, naptár-integráció később).

**Outputok**

- UI üzenetek (panel megjelenítés/eltüntetés).
- Opcionális natív `chrome.notifications`.
- Eseménylog a backendre (telemetria/analitika).

---

### 2) **NudgeAgent** (Környezeti figyelmeztető)

**Cél:** Distractor oldalak észlelése és azonnali, kíméletes „nudge” üzenet.

**Feladatok**

- `tabs.onUpdated` + `tabs.onActivated` figyelése; aktív tab URL-je alapján szabályalkalmazás.
- Beállítás-alapú domainlista (pl. facebook.com, instagram.com, tiktok.com – szerkeszthető).
- Kontextusos üzenetek a panelre (pl. „Épp facebook.com – segíti ez most a céljaidat?”).
- „Igen/Nem” válasz kezelése: Igen → ideiglenes elnémítás erre a domainre; Nem → időzített újbóli emlékeztető.

**Inputok**

- Aktív fül URL-je.
- Felhasználói válaszok, beállítások.
- Backendtől jövő szabályfrissítések (pl. munkanapokon szigorúbb).

**Outputok**

- Panel üzenetek és UX állapot.
- Események (milyen oldalon, hányszor, milyen válasz).

---

### 3) **MessengerAgent** (Üzenetszolgáltatás és API-bridge)

**Cél:** Szerverrel való megbízható kommunikáció, felhasználói üzenetek kézbesítése.

**Feladatok**

- Biztonságos API-hívások a **saját backendhez** (soha nem közvetlen 3rd-party kulccsal).
- Auth: rövid életű access tokenek, refresh, esetleg kliens-aláírás (WebCrypto kulcspár + DPoP-szerű).
- Üzenetek lekérése: polling (alarms-szal 30–60 mp) vagy WebSocket **offscreen dokumentumból/extension oldalról** (service worker nem tartós).
- Kézbesítés a UI felé és visszajelzések (Igen/Nem) feltöltése a szerverre.
- Hiba- és retry-stratégia (exponenciális backoff).

**Inputok**

- Backend végpontok és házirend (rate limit, scope-ok).
- Auth állapot (token, kulcs-azonosító).
- Hálózati események (online/offline).

**Outputok**

- Panel felé tartalmak.
- Szerver felé események (telemetria, válaszok, státusz).

---

### 4) **SettingsAgent** (Beállítások és személyre szabás)

**Cél:** Végfelhasználói beállítások, profil és nyelvezet kezelése.

**Feladatok**

- Időzítések (focus/szünet hossza), domainlista, hangnem („szigorú/puha”), vizuális preferenciák.
- Per-profil szabályok: pl. munkaidőben szigorúbb nudge, estére lazább.
- Import/export (később): cloud sync (chrome.storage.sync vagy saját backend).
- „Asian Mom” hangvétel finomhangolása (lokalizáció, kulturális érzékenység).

---

## Felhasználói folyamatok (magas szint)

### Pomodoro ciklus

1. **Start** (automatikus vagy manuális) → FocusAgent: `alarm` 20 perc.
2. **Lejárat** → Panel: „Lejárt a 20 perc. Tartasz 5 perc szünetet?” [Igen/Nem].
3. **Igen** → szünet fázis; **Nem** → halasztás vagy új ciklus.
4. **Szünet vége** → új fókusz ciklus (vagy felhasználói döntés).
5. Események a backendre (analitika, javaslatok tanítása).

### Distractor nudge

1. Aktív tab domain egyezik a listával → NudgeAgent panelüzenet.
2. **Igen** (maradok) → ideiglenes némítás erre a domainre (id
