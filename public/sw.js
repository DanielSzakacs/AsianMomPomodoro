const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

async function updateBadge() {
  const { mode, endTime } = await chrome.storage.local.get([
    "mode",
    "endTime",
  ]);
  if (!mode || !endTime) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }
  const remainingMs = endTime - Date.now();
  const remainingMin = Math.max(0, Math.ceil(remainingMs / 60000));
  const color = mode === "focus" ? "#FF0000" : "#00AA00";
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text: String(remainingMin) });
}

async function schedulePhase(minutes, mode) {
  const endTime = Date.now() + minutes * 60 * 1000;
  await chrome.storage.local.set({ mode, endTime });
  chrome.alarms.create("phase", { when: endTime });
  chrome.alarms.create("tick", { periodInMinutes: 1, when: Date.now() + 1000 });
  updateBadge();
}

async function startTimer() {
  await schedulePhase(FOCUS_MINUTES, "focus");
}

async function stopTimer() {
  await chrome.storage.local.remove(["mode", "endTime"]);
  chrome.alarms.clear("phase");
  chrome.alarms.clear("tick");
  chrome.action.setBadgeText({ text: "" });
}

async function switchPhase() {
  const { mode } = await chrome.storage.local.get("mode");
  if (mode === "focus") {
    await schedulePhase(BREAK_MINUTES, "break");
  } else {
    await schedulePhase(FOCUS_MINUTES, "focus");
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.command === "start") {
      await startTimer();
      const { endTime } = await chrome.storage.local.get("endTime");
      sendResponse({ endTime });
    } else if (msg.command === "stop") {
      await stopTimer();
      sendResponse({});
    } else if (msg.command === "getState") {
      const { mode, endTime } = await chrome.storage.local.get([
        "mode",
        "endTime",
      ]);
      sendResponse({ running: Boolean(mode && endTime), mode, endTime });
    }
  })();
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "phase") {
    switchPhase();
  } else if (alarm.name === "tick") {
    updateBadge();
  }
});

// Initialize badge when service worker starts
updateBadge();
