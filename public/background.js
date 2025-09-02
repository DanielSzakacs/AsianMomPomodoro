// MV3 service worker background script

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// ---------- Active tab helpers ----------
async function getActiveHttpTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (tab && tab.id && tab.url && /^https?:/i.test(tab.url)) return tab;
  return null;
}

async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  } catch (e) {
    console.warn("Content script injection failed:", e);
  }
}

async function sendToActiveTabWithInjection(msg) {
  const tab = await getActiveHttpTab();
  if (!tab) {
    console.warn("Nincs alkalmas aktív lap (http/https).");
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, msg);
  } catch (e) {
    if (/Receiving end does not exist/i.test(String(e))) {
      await ensureContentScript(tab.id);
      try {
        await chrome.tabs.sendMessage(tab.id, msg);
      } catch (e2) {
        console.error("Retry sendMessage failed:", e2);
      }
    } else {
      console.error("sendMessage failed:", e);
    }
  }
}

// ---------- Pomodoro notification scheduling ----------
const focusMessages = ["Ideje koncentrálni!", "Rajta, fókuszálj!"];
const breakMessages = ["Itt a szünet ideje!", "Pihenj egy kicsit!"];

function openStageTab(stageIndex) {
  // odd index -> break, even index -> work
  const mode = stageIndex % 2 === 1 ? "break" : "work";
  const url = chrome.runtime.getURL(`stage.html?mode=${mode}`);
  chrome.tabs.create({ url, active: true });
}

function sendStageNotification(stageIndex) {
  if (stageIndex > 0) {
    openStageTab(stageIndex);
  }
  const msgs = stageIndex % 2 === 0 ? focusMessages : breakMessages;
  const message = msgs[Math.floor(Math.random() * msgs.length)];
  sendToActiveTabWithInjection({
    type: "SHOW_WHATSAPP_NOTIFICATION",
    payload: { sender: "Asian Mom", message },
  });
}

async function clearPomodoroAlarms() {
  const alarms = await chrome.alarms.getAll();
  await Promise.all(
    alarms
      .filter((a) => a.name.startsWith("pomodoro-stage-"))
      .map((a) => chrome.alarms.clear(a.name))
  );
}

async function schedulePomodoro(startTime, stages) {
  await clearPomodoroAlarms();
  // Notify immediately for the first stage
  sendStageNotification(0);
  let cumulative = 0;
  for (let i = 0; i < stages.length - 1; i++) {
    cumulative += stages[i] * 1000;
    const when = startTime + cumulative;
    if (when > Date.now()) {
      chrome.alarms.create(`pomodoro-stage-${i}`, { when });
    }
  }
}

// ---------- Alarm handling ----------
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "toastAlarm") {
    sendToActiveTabWithInjection({
      type: "SHOW_WHATSAPP_NOTIFICATION",
      payload: {
        sender: "Asian Mom",
        message: "⏰ Ideje vissza a fókuszhoz!",
      },
    });
  } else if (alarm.name.startsWith("pomodoro-stage-")) {
    const idx = parseInt(alarm.name.split("-").pop(), 10) + 1;
    sendStageNotification(idx);
  }
});

// ---------- Message handling from popup ----------
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "TRIGGER_WHATSAPP_NOTIFICATION") {
      await sendToActiveTabWithInjection({
        type: "SHOW_WHATSAPP_NOTIFICATION",
        payload: msg.payload,
      });
      sendResponse({ ok: true });
    } else if (msg?.type === "START_TIMER") {
      chrome.alarms.create("toastAlarm", {
        when: Date.now() + (msg.delayMs || 10000),
      });
      sendResponse({ ok: true });
    } else if (msg?.type === "SCHEDULE_POMODORO") {
      await schedulePomodoro(msg.startTime, msg.stages || []);
      sendResponse({ ok: true });
    } else if (msg?.type === "CLEAR_POMODORO_ALARMS") {
      await clearPomodoroAlarms();
      sendResponse({ ok: true });
    } else if (msg?.type === "STAGE_ACTION") {
      console.log("Stage action received:", msg.stage);
      if (msg.openTab) {
        const stageIndex = msg.stage === "break" ? 1 : 0;
        openStageTab(stageIndex);
      }
      sendResponse({ ok: true });
    }
  })();
  return true; // async response
});

