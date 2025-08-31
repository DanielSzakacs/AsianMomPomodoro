// Oldalba injektált logika – DOM-hoz fér hozzá
console.log('Content script loaded on', location.href);

chrome.runtime.onMessage.addListener((request) => {
  if (request && request.type === 'show-notification') {
    import(chrome.runtime.getURL('notification.js')).then(({ showNotification }) => {
      showNotification({ sender: request.sender, message: request.message });
    });
  }
});
