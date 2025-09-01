(async function init(){
  const minutesInput = document.getElementById("minutes");
  const saveBtn = document.getElementById("save");
  const startBtn = document.getElementById("start");

  // Betöltjük a beállított időt
  const { focusMinutes } = await chrome.storage.local.get(["focusMinutes"]);
  minutesInput.value = Number(focusMinutes || 25);

  saveBtn.addEventListener("click", async () => {
    const minutes = Number(minutesInput.value) || 25;
    await chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", minutes });
    saveBtn.textContent = "Mentve ✓";
    setTimeout(() => (saveBtn.textContent = "Mentés"), 1200);
  });

  startBtn.addEventListener("click", async () => {
    startBtn.disabled = true;
    await chrome.runtime.sendMessage({ type: "START_FOCUS", minutes: Number(minutesInput.value) || 25 });
    startBtn.textContent = "Fut…";
    setTimeout(() => {
      startBtn.disabled = false;
      startBtn.textContent = "Start pomodoro";
    }, 1000);
  });
})();

