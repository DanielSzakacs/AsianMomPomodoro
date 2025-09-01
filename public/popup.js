document.getElementById('notifyBtn').addEventListener('click', () => {
  const id = Date.now().toString();
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'assets/img/icon.png',
    title: 'Hello from My Extension',
    message: 'Ezt a gomb indította a popupban.',
    contextMessage: 'Manifest V3 notification'
  });
});
