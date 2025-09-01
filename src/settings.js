const LANGUAGE_KEY = 'language';
const SEND_MESSAGE_KEY = 'send_message';
const TIMER_STATUS_KEY = 'pomodoro_running';
const TIMER_STARTED_KEY = 'pomodoro_started';
const TIMER_START_TIME_KEY = 'pomodoro_start_time';
const TIMER_ELAPSED_KEY = 'pomodoro_elapsed';


function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export function getLanguage() {
  return getCookie(LANGUAGE_KEY) || 'en';
}

export function setLanguage(lang) {
  setCookie(LANGUAGE_KEY, lang);
}

export function getSendMessage() {
  const value = getCookie(SEND_MESSAGE_KEY);
  return value ? value === 'true' : false;
}

export function setSendMessage(val) {
  setCookie(SEND_MESSAGE_KEY, val);
}

export function getTimerStatus() {
  const value = getCookie(TIMER_STATUS_KEY);
  return value ? value === 'true' : false;
}

export function setTimerStatus(val) {
  setCookie(TIMER_STATUS_KEY, val);
}

export function getTimerStarted() {
  const value = getCookie(TIMER_STARTED_KEY);
  return value ? value === 'true' : false;
}

export function setTimerStarted(val) {
  setCookie(TIMER_STARTED_KEY, val);
}

export function getTimerStartTime() {
  const value = getCookie(TIMER_START_TIME_KEY);
  return value ? parseInt(value) : 0;
}

export function setTimerStartTime(val) {
  setCookie(TIMER_START_TIME_KEY, val);
}

export function getTimerElapsed() {
  const value = getCookie(TIMER_ELAPSED_KEY);
  return value ? parseInt(value) : 0;
}

export function setTimerElapsed(val) {
  setCookie(TIMER_ELAPSED_KEY, val);
}

