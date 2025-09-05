// MV3 service worker background script

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// ---------- Active tab helpers ----------
/**
 * Aktív HTTP/S fül lekérdezése.
 *
 * Visszatérési érték:
 *   object|null: A fül objektuma vagy null, ha nincs megfelelő fül.
 */
async function getActiveHttpTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (tab && tab.id && tab.url && /^https?:/i.test(tab.url)) return tab;
  return null;
}

/**
 * Content script biztosítása az adott fülön.
 *
 * Paraméterek:
 *   tabId (number): A cél fül azonosítója.
 *
 * Visszatérési érték:
 *   Promise<void>: Siker esetén üresen tér vissza.
 */
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

/**
 * Üzenet küldése az aktív fülre, szükség esetén script injektálással.
 *
 * Paraméterek:
 *   msg (object): A küldendő üzenet.
 *
 * Visszatérési érték:
 *   Promise<void>: Nem ad vissza értéket.
 */
async function sendToActiveTabWithInjection(msg, tab) {
  if (!tab) {
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

// ---------- Distraktor oldalak figyelése ----------
const DISTRACTOR_DOMAINS = ["facebook.com", "instagram.com", "reddit.com"];

/**
 * Zavaró oldalak felismerése és értesítés kérése.
 *
 * Megnézi az aktív fül domainjét, és ha az szerepel a
 * DISTRACTOR_DOMAINS listában, fut a fókusz mód és engedélyezett az üzenetküldés,
 * üzenetet küld a tartalom scriptnek.
 *
 * Visszatérési érték:
 *   Promise<void>: Nem ad vissza értéket.
 */
async function notifyOnDistractingSite() {
  const tab = await getActiveHttpTab();
  if (!tab) return;

  let hostname;
  try {
    hostname = new URL(tab.url).hostname.replace(/^www\./, "");
  } catch (e) {
    console.warn("URL parsing failed:", e);
    return;
  }
  if (DISTRACTOR_DOMAINS.includes(hostname)) {
    const {
      pomodoro_started: started,
      pomodoro_running: running,
      send_message: sendMessage,
      pomodoro_focus: isFocus,
    } = await chrome.storage.local.get([
      "pomodoro_started",
      "pomodoro_running",
      "send_message",
      "pomodoro_focus",
    ]);
    if (
      started === "true" &&
      running === "true" &&
      sendMessage === "true" &&
      isFocus === "true"
    ) {
      // TODO: Válaszd ki az üzenetet domain és fókusz/pihenő állapot alapján
      const message = "Biztos, hogy ez most segít a céljaidban?";
      await sendToActiveTabWithInjection(
        {
          type: "SHOW_WHATSAPP_NOTIFICATION",
          payload: { sender: "Asian Mom", message },
        },
        tab
      );
    }
  }
}

chrome.tabs.onActivated.addListener(notifyOnDistractingSite);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === "complete") {
    notifyOnDistractingSite();
  }
});

// ---------- Pomodoro notification scheduling ----------
const focusMessages = ["Ideje koncentrálni!", "Rajta, fókuszálj!"];
const breakMessages = ["Itt a szünet ideje!", "Pihenj egy kicsit!"];
const FOCUS_DURATION = 20 * 60; // seconds
const BREAK_DURATION = 5 * 60; // seconds

function openStageTab(stageIndex) {
  // odd index -> break, even index -> work
  const mode = stageIndex % 2 === 1 ? "break" : "work";
  const url = chrome.runtime.getURL(`stage.html?mode=${mode}`);
  chrome.windows.create({
    url,
    type: "popup",
    focused: true,
    width: 450,
    height: 800,
  });
}

/**
 * Értesítés küldése a pomodoro aktuális szakaszáról.
 *
 * Paraméterek:
 *   stageIndex (number): A szakasz indexe.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
function sendStageNotification(stageIndex) {
  chrome.storage.local.set({
    pomodoro_focus: String(stageIndex % 2 === 0),
  });
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

/**
 * Pomodorohoz kapcsolódó összes ébresztés törlése.
 *
 * Visszatérési érték:
 *   Promise<void>: Nem ad vissza értéket.
 */
async function clearPomodoroAlarms() {
  const alarms = await chrome.alarms.getAll();
  await Promise.all(
    alarms
      .filter((a) => a.name.startsWith("pomodoro-stage-"))
      .map((a) => chrome.alarms.clear(a.name))
  );
}

/**
 * Pomodoro szakaszok ütemezése ébresztésekkel.
 *
 * Paraméterek:
 *   startTime (number): A pomodoro kezdési ideje milliszekundumban.
 *   stages (number[]): A fókusz és szünet szakaszok másodpercben.
 *
 * Visszatérési érték:
 *   Promise<void>: Nem ad vissza értéket.
 */
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
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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
      } else {
        if (msg.stage === "work") {
          await schedulePomodoro(Date.now(), [FOCUS_DURATION, BREAK_DURATION]);
          if (sender.tab?.id) {
            chrome.tabs.remove(sender.tab.id);
          }
        } else if (msg.stage === "break") {
          await schedulePomodoro(Date.now(), [BREAK_DURATION, FOCUS_DURATION]);
          if (sender.tab?.id) {
            chrome.tabs.remove(sender.tab.id);
          }
        }
      }

      sendResponse({ ok: true });
    }
  })();
  return true; // async response
});
