async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToastToActiveTab(text) {
  const tab = await getActiveTab();
  if (tab && tab.id !== undefined) {
    chrome.tabs.sendMessage(tab.id, { type: "SHOW_TOAST", text });
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TRIGGER_TOAST") {
    sendToastToActiveTab(message.text);
  } else if (message.type === "START_TIMER") {
    const delayMs = Number(message.delayMs) || 0;
    chrome.alarms.create("toastAlarm", { when: Date.now() + delayMs });
  } else if (message.type === "SYSTEM_NOTIFICATION") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/img/icon.png",
      title: "Asian Mom Pomodoro",
      message: message.text || ""
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "toastAlarm") {
    sendToastToActiveTab("⏰ Időzítő lejárt – itt a toast!");
  }
});

export {};

