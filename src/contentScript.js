function ensureContainer() {
  let container = document.getElementById("__amp-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "__amp-toast-container";
    Object.assign(container.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      pointerEvents: "none"
    });
    document.body.appendChild(container);
  }
  return container;
}

function showToast(text) {
  const container = ensureContainer();
  const toast = document.createElement("div");
  toast.textContent = text;
  Object.assign(toast.style, {
    background: "rgba(0,0,0,0.85)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "4px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    marginTop: "8px",
    opacity: "0",
    transform: "translateY(20px)",
    transition: "opacity 0.3s, transform 0.3s",
    pointerEvents: "auto"
  });
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SHOW_TOAST") {
    showToast(message.text);
  }
});

export {};

