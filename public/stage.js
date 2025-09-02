const params = new URLSearchParams(location.search);
const mode = params.get('mode') === 'break' ? 'break' : 'work';

const titleEl = document.getElementById('stageTitle');
const countdownEl = document.getElementById('countdown');
const okBtn = document.getElementById('okButton');

titleEl.textContent = mode === 'break' ? 'Start your break' : 'Work';
countdownEl.style.color = mode === 'break' ? 'red' : 'green';

let remaining = mode === 'break' ? 5 * 60 : 20 * 60;

function updateCountdown() {
  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  countdownEl.textContent = `${m}:${s}`;
}

updateCountdown();
const timer = setInterval(() => {
  remaining--;
  if (remaining >= 0) {
    updateCountdown();
  } else {
    clearInterval(timer);
  }
}, 1000);

okBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STAGE_ACTION', stage: mode });
  window.close();
});
