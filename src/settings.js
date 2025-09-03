const LANGUAGE_KEY = 'language';
const SEND_MESSAGE_KEY = 'send_message';
const SOUND_ENABLED_KEY = 'sound_enabled';
const TIMER_STATUS_KEY = 'pomodoro_running';
const TIMER_STARTED_KEY = 'pomodoro_started';
const TIMER_START_TIME_KEY = 'pomodoro_start_time';
const TIMER_ELAPSED_KEY = 'pomodoro_elapsed';


/**
 * Sütiváltozó értékének lekérése.
 *
 * Paraméterek:
 *   name (string): A keresett süti neve.
 *
 * Visszatérési érték:
 *   string: A süti értéke vagy üres string, ha nem létezik.
 */
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Süti beállítása adott kulccsal és értékkel, és szinkronizálása storage-be.
 *
 * Paraméterek:
 *   name (string): A süti neve.
 *   value (string|number|boolean): A süti értéke.
 *   days (number): Lejárat napokban, alapértelmezés 365.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  if (chrome?.storage?.local) {
    chrome.storage.local.set({ [name]: String(value) });
  }
}

/**
 * Az aktuális nyelvi beállítás lekérése.
 *
 * Visszatérési érték:
 *   string: A beállított nyelv vagy 'en'.
 */
export function getLanguage() {
  return getCookie(LANGUAGE_KEY) || 'en';
}

/**
 * Nyelvi beállítás elmentése.
 *
 * Paraméterek:
 *   lang (string): Az elmentendő nyelv kódja.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
export function setLanguage(lang) {
  setCookie(LANGUAGE_KEY, lang);
}

/**
 * Üzenetküldési beállítás lekérése.
 *
 * Visszatérési érték:
 *   boolean: True, ha engedélyezett az üzenetküldés.
 */
export function getSendMessage() {
  const value = getCookie(SEND_MESSAGE_KEY);
  return value ? value === 'true' : false;
}

/**
 * Üzenetküldési beállítás mentése.
 *
 * Paraméterek:
 *   val (boolean): Engedélyezett legyen-e az üzenetküldés.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
export function setSendMessage(val) {
  setCookie(SEND_MESSAGE_KEY, val);
}

/**
 * Hangjelzés engedélyezésének lekérése.
 *
 * Visszatérési érték:
 *   boolean: True, ha engedélyezett a hang.
 */
export function getPlaySound() {
  const value = getCookie(SOUND_ENABLED_KEY);
  return value ? value === 'true' : false;
}

/**
 * Hangjelzés engedélyezésének mentése.
 *
 * Paraméterek:
 *   val (boolean): Engedélyezett legyen-e a hang.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
export function setPlaySound(val) {
  setCookie(SOUND_ENABLED_KEY, val);
}

/**
 * Pomodoro futási állapotának lekérése.
 *
 * Visszatérési érték:
 *   boolean: True, ha fut a pomodoro.
 */
export function getTimerStatus() {
  const value = getCookie(TIMER_STATUS_KEY);
  return value ? value === 'true' : false;
}

/**
 * Pomodoro futási állapotának mentése.
 *
 * Paraméterek:
 *   val (boolean): Az új futási állapot.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
export function setTimerStatus(val) {
  setCookie(TIMER_STATUS_KEY, val);
}

/**
 * Jelzi, hogy a pomodoro elindult-e.
 *
 * Visszatérési érték:
 *   boolean: True, ha már elindult.
 */
export function getTimerStarted() {
  const value = getCookie(TIMER_STARTED_KEY);
  return value ? value === 'true' : false;
}

/**
 * Beállítja, hogy elindult-e a pomodoro.
 *
 * Paraméterek:
 *   val (boolean): Az új indítási állapot.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
export function setTimerStarted(val) {
  setCookie(TIMER_STARTED_KEY, val);
}

/**
 * A pomodoro kezdési idejének lekérése milliszekundumban.
 *
 * Visszatérési érték:
 *   number: A kezdési idő vagy 0.
 */
export function getTimerStartTime() {
  const value = getCookie(TIMER_START_TIME_KEY);
  return value ? parseInt(value) : 0;
}

/**
 * Pomodoro kezdési idejének mentése.
 *
 * Paraméterek:
 *   val (number): A kezdési idő milliszekundumban.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
export function setTimerStartTime(val) {
  setCookie(TIMER_START_TIME_KEY, val);
}

/**
 * Eltelt idő lekérése a pomodoro során.
 *
 * Visszatérési érték:
 *   number: Az eltelt idő milliszekundumban.
 */
export function getTimerElapsed() {
  const value = getCookie(TIMER_ELAPSED_KEY);
  return value ? parseInt(value) : 0;
}

/**
 * Eltelt idő mentése a pomodorohoz.
 *
 * Paraméterek:
 *   val (number): Az eltelt idő milliszekundumban.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
export function setTimerElapsed(val) {
  setCookie(TIMER_ELAPSED_KEY, val);
}

