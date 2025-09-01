// Pomodoro ciklus ütemezése a háttérben, hogy a popup bezárása után is fussanak
// az értesítések. Alapértelmezett szakaszok: 20/5 perc váltakozva, az utolsó
// szünet 15 perc.

const stages = [
  20 * 60,
  5 * 60,
  20 * 60,
  5 * 60,
  20 * 60,
  5 * 60,
  20 * 60,
  15 * 60,
];

const focusMessages = ["Rajta, fókuszálj!", "Maradj fókuszban!"];
const breakMessages = ["Itt a szünet ideje!", "Pihenj egy kicsit!"];

let stageIndex = 0;
let running = false;

function scheduleNext() {
  if (!running || stageIndex >= stages.length) {
    running = false;
    chrome.alarms.clear("pomodoro-timer");
    return;
  }
  chrome.alarms.create("pomodoro-timer", {
    delayInMinutes: stages[stageIndex] / 60,
  });
}

function notifyStage() {
  let message = "";
  if (stageIndex % 2 === 0) {
    // Fókusz szakasz
    message =
      stageIndex === 0
        ? "Ideje koncentrálni!"
        : focusMessages[Math.floor(Math.random() * focusMessages.length)];
  } else {
    // Szünet szakasz
    message =
      breakMessages[Math.floor(Math.random() * breakMessages.length)];
  }

  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/img/icon.png"),
    title: "Asian Mom",
    message,
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "pomodoro-start") {
    running = true;
    stageIndex = 0;
    notifyStage();
    scheduleNext();
  }

  if (msg?.type === "pomodoro-stop") {
    running = false;
    chrome.alarms.clear("pomodoro-timer");
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pomodoro-timer" && running) {
    stageIndex++;
    if (stageIndex >= stages.length) {
      running = false;
      return;
    }
    notifyStage();
    scheduleNext();
  }
});
