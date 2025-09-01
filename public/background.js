// Itt lehet a háttérlogika (event handling, message routing, stb.)
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// A notification-re kattintás kezelése
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);
  const followUpId = Date.now().toString();
  chrome.notifications.create(followUpId, {
    type: 'basic',
    iconUrl: 'assets/img/icon.png',
    title: 'Köszönöm a kattintást!',
    message: 'Ez egy follow-up notification.'
  });
});
