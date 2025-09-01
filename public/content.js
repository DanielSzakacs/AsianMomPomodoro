// Oldalba injektált logika – DOM-hoz fér hozzá
console.log("Content script loaded on", location.href);

// Fogadjuk a háttér/popup üzeneteit és rajzolunk egy toastot a lap aljára

function ensureContainer() {
  let c = document.getElementById("__ext_toast_container__");
  if (!c) {
    c = document.createElement("div");
    c.id = "__ext_toast_container__";
    Object.assign(c.style, {
      position: "fixed",
      left: "50%",
      bottom: "24px",
      transform: "translateX(-50%)",
      zIndex: 2147483647,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      pointerEvents: "none",
    });
    document.documentElement.appendChild(c);
  }
  return c;
}

function showToast(text) {
  const container = ensureContainer();
  const toast = document.createElement("div");
  toast.textContent = text;
  Object.assign(toast.style, {
    maxWidth: "min(90vw, 560px)",
    padding: "12px 16px",
    borderRadius: "10px",
    background: "rgba(20,20,20,0.92)",
    color: "#fff",
    fontSize: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    pointerEvents: "auto",
    transition: "transform 180ms ease, opacity 180ms ease",
    transform: "translateY(12px)",
    opacity: "0.001",
  });

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
    setTimeout(() => toast.remove(), 220);
  }, 4000);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "SHOW_TOAST") {
    showToast(msg.text || "Toast üzenet");
  }
});

console.log("Content script ready on", location.href);
