// Itt lehet a háttérlogika (event handling, message routing, stb.)
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// MV3 service worker

async function sendToastToActiveTab(text) {
  const tab = await getActiveHttpTab();
  if (!tab) {
    console.warn(
      "Nincs alkalmas aktív lap (http/https). Ne a chrome://extensions lapon próbáld."
    );
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "SHOW_TOAST", text });
  } catch (e) {
    if (/Receiving end does not exist/i.test(String(e))) {
      await ensureContentScript(tab.id);
      try {
        await chrome.tabs.sendMessage(tab.id, { type: "SHOW_TOAST", text });
      } catch (e2) {
        console.error("Retry sendMessage failed:", e2);
      }
    } else {
      console.error("sendMessage failed:", e);
    }
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "TRIGGER_TOAST") {
      await sendToastToActiveTab(msg.text || "👋 Egyedi, CSS-es toast!");
      sendResponse({ ok: true });
    }
    if (msg?.type === "START_TIMER") {
      chrome.alarms.create("toastAlarm", {
        when: Date.now() + (msg.delayMs || 10000),
      });
      sendResponse({ ok: true });
    }
  })();
  return true; // async válasz
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "toastAlarm") {
    sendToastToActiveTab("⏰ Időzítő lejárt – itt a toast!");
  }
});

// ---- background.js (MV3 service worker) ----

// Egyszer definiáljuk
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
      files: ["content.js"], // a manifestben is így szerepel
    });
  } catch (e) {
    console.warn(
      "Content script injection failed (tiltott oldal vagy útvonal hiba):",
      e
    );
  }
}

// Általános küldő: először küld, ha nincs fogadó, injektál és újrapróbál
async function sendToActiveTabWithInjection(msg) {
  const tab = await getActiveHttpTab();
  if (!tab) {
    console.warn(
      "Nincs alkalmas aktív lap (http/https). Ne a chrome:// oldalon próbáld."
    );
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

// --- Üzenetkezelés a popup/App.vue felől ---
// Mindent a WhatsApp-stílusú csatornán küldünk a contentnek
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "TRIGGER_WHATSAPP_NOTIFICATION") {
      await sendToActiveTabWithInjection({
        type: "SHOW_WHATSAPP_NOTIFICATION",
        payload: msg.payload, // { sender, message }
      });
      sendResponse({ ok: true });
    }

    if (msg?.type === "START_TIMER") {
      chrome.alarms.create("toastAlarm", {
        when: Date.now() + (msg.delayMs || 10000),
      });
      sendResponse({ ok: true });
    }
  })();
  return true; // async válasz
});

// Timer: ugyanazt a vizuális notit küldi a lapra
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "toastAlarm") {
    sendToActiveTabWithInjection({
      type: "SHOW_WHATSAPP_NOTIFICATION",
      payload: { sender: "Asian Mom", message: "⏰ Ideje vissza a fókuszhoz!" },
    });
  }
});
