const LANGUAGE_KEY = 'language';
const SEND_MESSAGE_KEY = 'send_message';

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

