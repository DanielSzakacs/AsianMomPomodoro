// Háttér szervizmunkás: itt fut minden akkor is, ha a popup nincs megnyitva.

const ICON = chrome.runtime.getURL("vite.svg");
const START_TITLE = "Asian Mom";
const START_MESSAGE = "Ideje koncentrálni!";
const END_TITLE = "Asian Mom";
const END_MESSAGE = "Pomodoro kész! Tarts egy rövid szünetet.";

// Alapértelmezett beállítások
const DEFAULTS = {
  focusMinutes: 25
};

// Telepítéskor/Frissítéskor alapértékek
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(["focusMinutes"]);
  if (!current.focusMinutes) {
    await chrome.storage.local.set({ focusMinutes: DEFAULTS.focusMinutes });
  }
});

// Üzenetkezelő a popup felől
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "START_FOCUS") {
    const minutes = Number(msg.minutes) || DEFAULTS.focusMinutes;
    startFocus(minutes);
    sendResponse({ ok: true });
    return true;
  }
  if (msg?.type === "SAVE_SETTINGS") {
    chrome.storage.local.set({ focusMinutes: Number(msg.minutes) || DEFAULTS.focusMinutes });
    sendResponse({ ok: true });
    return true;
  }
});

// Fókusz indítása: azonnali natív értesítés + alarm a végére
async function startFocus(minutes) {
  // Azonnali induló értesítés – ez natív rendszerértesítés, nem a popupban jelenik meg
  chrome.notifications.create({
    type: "basic",
    iconUrl: ICON,
    title: START_TITLE,
    message: START_MESSAGE,
    priority: 2
  });

  // Állítsunk ébresztőt a periódus végére (akkor is fut, ha a popup bezárult)
  const when = Date.now() + minutes * 60 * 1000;
  await chrome.alarms.clear("POMODORO_END");
  chrome.alarms.create("POMODORO_END", { when });
}

// Alarm esemény: a pomodoro vége
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "POMODORO_END") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: ICON,
      title: END_TITLE,
      message: END_MESSAGE,
      priority: 2
    });
  }
});

