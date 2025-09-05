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

// Nyelv- és domainfüggő üzenetek listája.
// A konkrét szövegek helyét a későbbi fejlesztő tölti fel.
const DISTRACTOR_MESSAGES = {
  en: {
    "facebook.com": ["fb-en-1", "fb-en-2"],
    "instagram.com": ["ig-en-1", "ig-en-2"],
    reddit: ["rd-en-1", "rd-en-2"],
  },
  hu: {
    "facebook.com": ["fb-hu-1", "fb-hu-2"],
    "instagram.com": ["ig-hu-1", "ig-hu-2"],
    reddit: ["rd-hu-1", "rd-hu-2"],
  },
};

const NOTIFY_STATE_KEY = "notifyState";
const notifyStorage = chrome.storage.session || chrome.storage.local;

async function getNotifyState() {
  const data = await notifyStorage.get(NOTIFY_STATE_KEY);
  return data[NOTIFY_STATE_KEY] || {};
}

async function setNotifyState(state) {
  await notifyStorage.set({ [NOTIFY_STATE_KEY]: state });
}

async function resetNotifyState() {
  await setNotifyState({});
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) {
    if (t.id) {
      try {
        await chrome.tabs.sendMessage(t.id, { type: "RESET_NOTIFICATION_STATE" });
      } catch (e) {
        // nincs tartalomszkript - kihagyjuk
      }
    }
  }
}

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
      language = "en",
    } = await chrome.storage.local.get([
      "pomodoro_started",
      "pomodoro_running",
      "send_message",
      "pomodoro_focus",
      "language",
    ]);
    if (
      started === "true" &&
      running === "true" &&
      sendMessage === "true" &&
      isFocus === "true"
    ) {
      const lang = DISTRACTOR_MESSAGES[language] ? language : "en";
      const domainMessages =
        DISTRACTOR_MESSAGES[lang][hostname] ||
        DISTRACTOR_MESSAGES[lang].default ||
        [];
      if (domainMessages.length === 0) return;

      const state = await getNotifyState();
      const hostState = state[hostname] || { probability: 1, shown: [] };

      if (Math.random() <= hostState.probability) {
        const available = domainMessages
          .map((m, i) => ({ m, i }))
          .filter(({ i }) => !hostState.shown.includes(i));
        const pool = available.length ? available : domainMessages.map((m, i) => ({ m, i }));
        const pick = pool[Math.floor(Math.random() * pool.length)];
        hostState.shown.push(pick.i);
        await sendToActiveTabWithInjection(
          {
            type: "SHOW_WHATSAPP_NOTIFICATION",
            payload: { sender: "Asian Mom", message: pick.m },
          },
          tab
        );
      }

      hostState.probability = Math.max(0.4, hostState.probability - 0.2);
      state[hostname] = hostState;
      await setNotifyState(state);
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
  await resetNotifyState();
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
