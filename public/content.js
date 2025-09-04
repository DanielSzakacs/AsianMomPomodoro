/**
 * Értesítés megjelenítése a weboldalon.
 *
 * Paraméterek:
 *   sender (string): Az üzenet feladója.
 *   message (string): A feladó üzenete.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */


function showNotification({ sender, message }) {
  const existing = document.getElementById("amp-notification");
  if (existing) existing.remove();

  const container = document.createElement("div");
  container.id = "amp-notification";
  container.style.position = "fixed";
  container.style.top = "16px";
  container.style.right = "-400px";
  container.style.background = "#FFFFFF";
  container.style.borderRadius = "8px";
  container.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
  container.style.padding = "16px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "12px";
  container.style.maxWidth = "360px";
  container.style.fontFamily =
    '-apple-system, BlinkMacSystemFont, "San Francisco", Arial, Helvetica, sans-serif';
  container.style.zIndex = "2147483647"; // nagyon magas, hogy minden fölé kerüljön
  container.style.transition = "right 0.3s ease-out";

  const mainWrap = document.createElement("div");
  mainWrap.style.display = "flex";
  mainWrap.style.alignItems = "center";
  mainWrap.style.gap = "12px";

  const textWrap = document.createElement("div");
  textWrap.style.display = "flex";
  textWrap.style.flexDirection = "column";
  textWrap.style.gap = "6px";
  textWrap.style.userSelect = "none";

  const title = document.createElement("div");
  title.textContent = sender;
  title.style.fontWeight = "600";
  title.style.fontSize = "16px";
  title.style.color = "#000000";

  const msg = document.createElement("div");
  msg.textContent = message;
  msg.style.fontWeight = "400";
  msg.style.fontSize = "15px";
  msg.style.color = "#333333";

  textWrap.appendChild(title);
  textWrap.appendChild(msg);

  const icon = document.createElement("img");
  icon.src = chrome.runtime.getURL("assets/img/mom_img.png"); // <— fontos!
  icon.alt = "icon";
  icon.style.width = "40px";
  icon.style.height = "40px";
  icon.style.borderRadius = "50%";

  mainWrap.appendChild(icon);
  mainWrap.appendChild(textWrap);

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.justifyContent = "center";
  actions.style.paddingTop = "8px";
  actions.style.borderTop = "1px solid #eee";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.background = "#FFFFFF";
  closeBtn.style.border = "none";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.color = "#000000";
  closeBtn.style.fontSize = "15px";
  closeBtn.style.padding = "4px 8px";
  closeBtn.addEventListener("mouseenter", () => (closeBtn.style.color = "#FF0000"));
  closeBtn.addEventListener("mouseleave", () => (closeBtn.style.color = "#000000"));
  closeBtn.addEventListener("click", () => container.remove());

  actions.appendChild(closeBtn);


  container.appendChild(mainWrap);
  container.appendChild(actions);

  document.documentElement.appendChild(container);
  requestAnimationFrame(() => {
    container.style.right = "16px";
  });
}

// ===== Üzenetfogadás a backgroundtól/popupból =====
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "SHOW_WHATSAPP_NOTIFICATION") {
    const { sender = "Asian Mom", message = "Hi!" } = msg.payload || {};
    showNotification({ sender, message });
  }
});
