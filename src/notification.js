export function showNotification({ sender, message }) {
  if (chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      type: 'stage-notification',
      title: sender,
      message,
    });
  }

  const existing = document.getElementById('amp-notification');
  if (existing) {
    existing.remove();
  }

  const container = document.createElement('div');
  container.id = 'amp-notification';
  container.style.position = 'fixed';
  container.style.top = '16px';
  container.style.right = '-400px';
  container.style.background = '#FFFFFF';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  container.style.padding = '8px 12px';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '8px';
  container.style.maxWidth = '300px';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "San Francisco", Arial, Helvetica, sans-serif';
  container.style.zIndex = '9999';
  container.style.transition = 'right 0.3s ease-out';
  container.style.position = 'fixed';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'close notification');
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '4px';
  closeBtn.style.right = '6px';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '12px';
  closeBtn.addEventListener('click', () => container.remove());

  const textWrap = document.createElement('div');
  textWrap.style.display = 'flex';
  textWrap.style.flexDirection = 'column';
  textWrap.style.gap = '4px';
  textWrap.style.marginRight = '8px';
  textWrap.style.userSelect = 'none';

  const title = document.createElement('div');
  title.textContent = sender;
  title.style.fontWeight = '600';
  title.style.fontSize = '15px';
  title.style.color = '#000000';

  const msg = document.createElement('div');
  msg.textContent = message;
  msg.style.fontWeight = '400';
  msg.style.fontSize = '14px';
  msg.style.color = '#333333';

  textWrap.appendChild(title);
  textWrap.appendChild(msg);

  const icon = document.createElement('img');
  icon.src = '/assets/img/mom_img.png';
  icon.alt = 'icon';
  icon.style.width = '32px';
  icon.style.height = '32px';
  icon.style.borderRadius = '50%';

  container.appendChild(closeBtn);
  container.appendChild(textWrap);
  container.appendChild(icon);

  document.body.appendChild(container);
  requestAnimationFrame(() => {
    container.style.right = '16px';
  });
}
