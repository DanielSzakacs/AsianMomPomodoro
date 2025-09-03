const params = new URLSearchParams(location.search);
const mode = params.get("mode") === "break" ? "break" : "work";

const titleEl = document.getElementById("stageTitle");
const countdownEl = document.getElementById("countdown");
const okBtn = document.getElementById("okButton");

titleEl.textContent = mode === "break" ? "Start your break" : "Work";
countdownEl.style.color = mode === "break" ? "green" : "red";

async function getValue(key) {
  if (chrome?.storage?.local) {
    const result = await chrome.storage.local.get([key]);
    return result[key];
  }
  return undefined;
}

async function getPlaySound() {
  const value = await getValue("sound_enabled");
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
}

getPlaySound().then((play) => {
  if (play) {
    const audio = new Audio(`/assets/sounds/ringsound.mp3`);
    audio.play().catch(() => {});
  }
});

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

  async function getTimerStarted() {
    const value = await getValue("pomodoro_started");
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value === "true";
    return false;
  }

  async function getTimerStatus() {
    const value = await getValue("pomodoro_running");
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value === "true";
    return false;
  }

  async function getTimerStartTime() {
    const value = await getValue("pomodoro_start_time");
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseInt(value) || 0;
    return 0;
  }

  async function getTimerElapsed() {
    const value = await getValue("pomodoro_elapsed");
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseInt(value) || 0;
    return 0;
  }

  async function getTimeLeft() {
    if (!(await getTimerStarted())) {
      return stages[0];
    }

    const [startTime, elapsedWhenStopped, isRunning] = await Promise.all([
      getTimerStartTime(),
      getTimerElapsed(),
      getTimerStatus(),
    ]);

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

  async function updateCountdown() {
    const remaining = await getTimeLeft();
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");

    countdownEl.textContent = `${m}:${s}`;
  }

  updateCountdown();
  setInterval(() => {
    updateCountdown();
  }, 1000);

okBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "STAGE_ACTION", stage: mode });

  window.close();
});
