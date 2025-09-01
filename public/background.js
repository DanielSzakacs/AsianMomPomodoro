// Itt lehet a háttérlogika (event handling, message routing, stb.)
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "stage-notification") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/img/icon.png"),
      title: msg.title || "Asian Mom",
      message: msg.message || "",
    });
  }
});
