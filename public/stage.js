const params = new URLSearchParams(location.search);
const mode = params.get("mode") === "break" ? "break" : "work";

document.body.classList.add(mode);

const titleEl = document.getElementById("stageTitle");
const countdownEl = document.getElementById("countdown");
const okBtn = document.getElementById("okButton");
const cancelBtn = document.getElementById("cancelButton");
const messageEl = document.getElementById("momMessage");

const translations = {
  en: {
    workTitle: "Work",
    breakTitle: "Start your break",
    okWork: "Yes mom!",
    okBreak: "Let's go!",
    cancel: "Cancel",
    messages: [
      "If you don't study now, what will you become?!",
      "Do you think success comes by itself?",
      "Mom's watching!",
    ],
  },
  ja: {
    workTitle: "勉強する時間よ",
    breakTitle: "休憩を始めましょう",
    okWork: "はい、お母さん！",
    okBreak: "行こう！",
    cancel: "キャンセル",
    messages: [
      "今勉強しないでどうするの？",
      "みんなはもっと頑張ってるわよ！",
      "お母さん見てるからね！",
    ],
  },
  ru: {
    workTitle: "Работай",
    breakTitle: "Начни перерыв",
    okWork: "Да, мам!",
    okBreak: "Поехали!",
    cancel: "Отмена",
    messages: [
      "Если сейчас не учишься, кем станешь?!",
      "Думаешь, успех приходит сам?",
      "Мама наблюдает!",
    ],
  },
};

function readCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  if (chrome?.storage?.local) {
    chrome.storage.local.set({ [name]: String(value) });
  }
}

function getLanguage() {
  return readCookie("language") || "en";
}

const lang = getLanguage();
const t = translations[lang] || translations.en;

titleEl.textContent = mode === "break" ? t.breakTitle : t.workTitle;
okBtn.textContent = mode === "break" ? t.okBreak : t.okWork;
cancelBtn.textContent = t.cancel;
messageEl.textContent = t.messages[Math.floor(Math.random() * t.messages.length)];
countdownEl.style.color = mode === "break" ? "#2e7d32" : "#c62828";

function getPlaySound() {
  const value = readCookie("sound_enabled");
  return value ? value === "true" : false;
}

if (getPlaySound()) {
  const audio = new Audio(`/assets/sounds/ringsound.mp3`);
  audio.play().catch(() => {});
}

const stages = [
  20 * 60, // fokus
  5 * 60,
  20 * 60, // fokus
  5 * 60,
  20 * 60, // fokus
  5 * 60,
  20 * 60, // fokus
  15 * 60,
];
const totalDuration = stages.reduce((a, b) => a + b, 0) * 1000;

function getTimerStarted() {
  const value = readCookie("pomodoro_started");
  return value ? value === "true" : false;
}

function getTimerStatus() {
  const value = readCookie("pomodoro_running");
  return value ? value === "true" : false;
}

function getTimerStartTime() {
  const value = readCookie("pomodoro_start_time");

  return value ? parseInt(value) : 0;
}

function getTimerElapsed() {
  const value = readCookie("pomodoro_elapsed");

  return value ? parseInt(value) : 0;
}

function getTimeLeft() {
  if (!getTimerStarted()) {
    return stages[0];
  }

  const startTime = getTimerStartTime();
  const elapsedWhenStopped = getTimerElapsed();
  const isRunning = getTimerStatus();

  let elapsed = isRunning ? Date.now() - startTime : elapsedWhenStopped;

  if (elapsed >= totalDuration) {
    return stages[0];
  }

  let idx = 0;
  let remaining = elapsed;
  while (remaining >= stages[idx] * 1000) {
    remaining -= stages[idx] * 1000;
    idx++;
  }
  return Math.ceil((stages[idx] * 1000 - remaining) / 1000);
}

function updateCountdown() {
  const remaining = getTimeLeft();
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");

  countdownEl.textContent = `${m}:${s}`;
}

updateCountdown();
const countdownInterval = setInterval(updateCountdown, 1000);

okBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "STAGE_ACTION", stage: mode });

  window.close();
});

function restartTimer() {
  clearInterval(countdownInterval);
  setCookie("pomodoro_running", false);
  setCookie("pomodoro_started", false);
  setCookie("pomodoro_start_time", 0);
  setCookie("pomodoro_elapsed", 0);
  chrome.runtime.sendMessage({ type: "CLEAR_POMODORO_ALARMS" });
  chrome.runtime.sendMessage({ type: "CLOSE_APP_WINDOW" });
  window.close();
}

cancelBtn.addEventListener("click", restartTimer);
