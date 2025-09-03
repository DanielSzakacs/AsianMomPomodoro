const LANGUAGE_KEY = 'language';
const SEND_MESSAGE_KEY = 'send_message';
const SOUND_ENABLED_KEY = 'sound_enabled';
const TIMER_STATUS_KEY = 'pomodoro_running';
const TIMER_STARTED_KEY = 'pomodoro_started';
const TIMER_START_TIME_KEY = 'pomodoro_start_time';
const TIMER_ELAPSED_KEY = 'pomodoro_elapsed';

/**
 * Storage helper to read a value from chrome.storage.local.
 * @param {string} key
 * @returns {Promise<any>} The stored value or undefined.
 */
async function getValue(key) {
  if (chrome?.storage?.local) {
    const result = await chrome.storage.local.get([key]);
    return result[key];
  }
  return undefined;
}

/**
 * Storage helper to write a value into chrome.storage.local.
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
async function setValue(key, value) {
  if (chrome?.storage?.local) {
    await chrome.storage.local.set({ [key]: value });
  }
}

/**
 * Get current language setting.
 * @returns {Promise<string>} Selected language or 'en'.
 */
export async function getLanguage() {
  return (await getValue(LANGUAGE_KEY)) || 'en';
}

/**
 * Persist language setting.
 * @param {string} lang
 * @returns {Promise<void>}
 */
export async function setLanguage(lang) {
  await setValue(LANGUAGE_KEY, lang);
}

/**
 * Get send message flag.
 * @returns {Promise<boolean>} Whether sending messages is enabled.
 */
export async function getSendMessage() {
  const value = await getValue(SEND_MESSAGE_KEY);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return false;
}

/**
 * Persist send message flag.
 * @param {boolean} val
 * @returns {Promise<void>}
 */
export async function setSendMessage(val) {
  await setValue(SEND_MESSAGE_KEY, val);
}

/**
 * Get sound playback flag.
 * @returns {Promise<boolean>} Whether sound is enabled.
 */
export async function getPlaySound() {
  const value = await getValue(SOUND_ENABLED_KEY);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return false;
}

/**
 * Persist sound playback flag.
 * @param {boolean} val
 * @returns {Promise<void>}
 */
export async function setPlaySound(val) {
  await setValue(SOUND_ENABLED_KEY, val);
}

/**
 * Get pomodoro running status.
 * @returns {Promise<boolean>} True if pomodoro is running.
 */
export async function getTimerStatus() {
  const value = await getValue(TIMER_STATUS_KEY);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return false;
}

/**
 * Persist pomodoro running status.
 * @param {boolean} val
 * @returns {Promise<void>}
 */
export async function setTimerStatus(val) {
  await setValue(TIMER_STATUS_KEY, val);
}

/**
 * Get whether pomodoro has started.
 * @returns {Promise<boolean>}
 */
export async function getTimerStarted() {
  const value = await getValue(TIMER_STARTED_KEY);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return false;
}

/**
 * Persist pomodoro started flag.
 * @param {boolean} val
 * @returns {Promise<void>}
 */
export async function setTimerStarted(val) {
  await setValue(TIMER_STARTED_KEY, val);
}

/**
 * Get pomodoro start time in ms.
 * @returns {Promise<number>} Start timestamp or 0.
 */
export async function getTimerStartTime() {
  const value = await getValue(TIMER_START_TIME_KEY);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value) || 0;
  return 0;
}

/**
 * Persist pomodoro start time.
 * @param {number} val
 * @returns {Promise<void>}
 */
export async function setTimerStartTime(val) {
  await setValue(TIMER_START_TIME_KEY, val);
}

/**
 * Get elapsed time during pomodoro in ms.
 * @returns {Promise<number>}
 */
export async function getTimerElapsed() {
  const value = await getValue(TIMER_ELAPSED_KEY);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value) || 0;
  return 0;
}

/**
 * Persist elapsed time during pomodoro.
 * @param {number} val
 * @returns {Promise<void>}
 */
export async function setTimerElapsed(val) {
  await setValue(TIMER_ELAPSED_KEY, val);
}
