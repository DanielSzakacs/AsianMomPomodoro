const translations = {
  en: { startBreak: 'Start break', startWork: 'Start work' },
  ja: { startBreak: '休憩を開始', startWork: '作業を開始' },
  ru: { startBreak: 'Начать перерыв', startWork: 'Начать работу' }
};

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Visszaadja a felhasználó nyelvét a `language` cookie alapján, ha nincs beállítva,
 * akkor az angolt (`'en'`) használja alapértelmezetten. Nem vár paramétert.
 *
 * @returns {string} A nyelvi kód.
 */
function getLanguage() {
  return getCookie('language') || 'en';
}

const params = new URLSearchParams(location.search);
const mode = params.get('mode') === 'break' ? 'break' : 'work';
const lang = getLanguage();
const t = translations[lang] || translations.en;

const btn = document.getElementById('actionButton');
btn.textContent = mode === 'break' ? t.startBreak : t.startWork;

btn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STAGE_ACTION', stage: mode });
  window.close();
});
