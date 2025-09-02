const params = new URLSearchParams(location.search);
const mode = params.get("mode") === "break" ? "break" : "work";

const titleEl = document.getElementById("stageTitle");
const countdownEl = document.getElementById("countdown");
const okBtn = document.getElementById("okButton");

titleEl.textContent = mode === "break" ? "Start your break" : "Work";
countdownEl.style.color = mode === "break" ? "red" : "green";

const stages = [
  1 * 60, // fokus
  1 * 60,
  1 * 60, // fokus
  1 * 60,
  1 * 60, // fokus
  1 * 60,
  1 * 60, // fokus
  15 * 60,
];
const totalDuration = stages.reduce((a, b) => a + b, 0) * 1000;

// const titleEl = document.getElementById("stageTitle");
// const countdownEl = document.getElementById("countdown");
// const okBtn = document.getElementById("okButton");

function getTimerStarted() {
  const value = getCookie("pomodoro_started");
  return value ? value === "true" : false;
}

function getTimerStatus() {
  const value = getCookie("pomodoro_running");
  return value ? value === "true" : false;
}

function getTimerStartTime() {
  const value = getCookie("pomodoro_start_time");
  return value ? parseInt(value) : 0;
}

function getTimerElapsed() {
  const value = getCookie("pomodoro_elapsed");
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
setInterval(updateCountdown, 1000);

okBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "STAGE_ACTION", stage: mode });
  window.close();
});
