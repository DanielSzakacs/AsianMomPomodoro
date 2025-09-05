<template>
  <div class="home">
    <img
      src="/assets/img/mom_pomodoro.png"
      alt="Asian Mom Pomodoro icon"
      class="home__icon"
    />
    <div class="home__timer" :class="timerClasses">{{ formattedTime }}</div>
    <div v-if="!isStarted">
      <button class="btn btn--start" @click="startTimer">{{ t("start") }}</button>

    </div>
    <div v-else class="home__controls">
      <button v-if="isRunning" class="btn btn--stop" @click="stopTimer">
        {{ t("stop") }}
      </button>
      <button v-else class="btn btn--start" @click="startTimer">
        {{ t("start") }}
      </button>
      <button class="btn btn--restart" @click="restartTimer">
        {{ t("restart") }}
      </button>
    </div>
    <!-- <button @click="startTimerTest">Indíts 10 mp-es időzítőt</button>
    <button @click="openStageTabTest">Nyisd meg a stage teszt lapot</button>
    <div class="home__debug">
      <div>Cookies:</div>
      <ul>
        <li v-for="(value, key) in cookies" :key="key">
          {{ key }}: {{ value }}
        </li>
      </ul>
      <div>Storage:</div>
      <ul>
        <li v-for="(value, key) in storageValues" :key="key">
          {{ key }}: {{ value }}
        </li>
      </ul>
    </div> -->
    <section class="settings-section">
      <h2 class="settings-section__title">{{ t("settings") }}</h2>
      <Settings @update="updateCookies" />
    </section>
    <div class="mom-bubble">
      <div>{{ progressMessage }}</div>
      <div>{{ momPhrase }}</div>
    </div>
    <section class="settings-section">
      <h2 class="settings-section__title">{{ t("settings") }}</h2>
      <Settings @update="updateCookies" />
    </section>
    <div class="mom-bubble">
      <div>{{ progressMessage }}</div>
      <div>{{ momPhrase }}</div>
    </div>
  </div>
</template>

<script setup>
import Settings from "./components/Settings.vue";
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  getLanguage,
  getSendMessage,
  getPlaySound,
  getTimerStatus,
  setTimerStatus,
  getTimerStarted,
  setTimerStarted,
  getTimerStartTime,
  setTimerStartTime,
  getTimerElapsed,
  setTimerElapsed,
} from "./settings";

const { t, locale } = useI18n();

const cookies = ref({
  language: getLanguage(),
  sendMessage: getSendMessage(),
  playSound: getPlaySound(),
  pomodoroRunning: getTimerStatus(),
  pomodoroStarted: getTimerStarted(),
  pomodoroStart: getTimerStartTime(),
  pomodoroElapsed: getTimerElapsed(),
});

const storageValues = ref({});

async function loadStorageValues() {
  if (chrome?.storage?.local) {
    storageValues.value = await chrome.storage.local.get();
  }
}

onMounted(() => {
  loadStorageValues();
  chrome?.storage?.onChanged?.addListener(loadStorageValues);
  pickMomPhrase();
});
watch(locale, pickMomPhrase);

const stages = [
  20 * 60, // fokus
  5 * 60,
  20 * 60, // fokus
  5 * 60,
  20 * 60, // fokus
  5 * 60,
  20 * 60, // fokus
  15 * 60,
];
const totalDuration = stages.reduce((a, b) => a + b, 0) * 1000;
const currentStage = ref(0);
const timeLeft = ref(stages[0]);
const isRunning = ref(getTimerStatus());
const isStarted = ref(getTimerStarted());
const startTime = ref(getTimerStartTime());
const elapsedWhenStopped = ref(getTimerElapsed());

let intervalId = null;

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60);
  const s = timeLeft.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

const isFocusStage = computed(() => currentStage.value % 2 === 0);
const isWarning = computed(() => timeLeft.value < 120);
const timerClasses = computed(() => ({
  "home__timer--focus": isFocusStage.value,
  "home__timer--break": !isFocusStage.value,
  "home__timer--warning": isWarning.value,
}));
const progressMessage = computed(() =>
  t("progressFeedback", { minutes: Math.ceil(timeLeft.value / 60) })
);

const momPhrases = {
  en: [
    "Did you finish your homework?",
    "Asian mom is watching!",
    "No distractions!",
  ],
  ja: [
    "宿題は終わった？",
    "ママは見てるよ！",
    "集中して！",
  ],

  ru: [
    "Ты сделал уроки?",
    "Азиатская мама следит за тобой!",
    "Никаких отвлечений!",
  ],
};
const momPhrase = ref("");
function pickMomPhrase() {
  const arr = momPhrases[locale.value] || momPhrases.en;
  momPhrase.value = arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Tesztidőzítő indítása 10 másodpercre.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
function startTimerTest() {
  chrome.runtime.sendMessage({ type: "START_TIMER", delayMs: 10_000 });
}

function openStageTabTest() {
  chrome.runtime.sendMessage({
    type: "STAGE_ACTION",
    stage: "work",
    openTab: true,
  });
}

/**
 * Aktuális pomodoro állapot számítása.
 *
 * Visszatérési érték:
 *   void: Frissíti az állapotot, nem ad vissza értéket.
 */
function calculate() {
  if (!isStarted.value) {
    currentStage.value = 0;
    timeLeft.value = stages[0];
    return;
  }

  let elapsed = isRunning.value
    ? Date.now() - startTime.value
    : elapsedWhenStopped.value;

  if (elapsed >= totalDuration) {
    restartTimer();
    return;
  }

  let idx = 0;
  let remaining = elapsed;
  while (remaining >= stages[idx] * 1000) {
    remaining -= stages[idx] * 1000;
    idx++;
  }
  const prev = currentStage.value;
  currentStage.value = idx;
  if (prev !== idx) {
    pickMomPhrase();
  }
  timeLeft.value = Math.ceil((stages[idx] * 1000 - remaining) / 1000);
}

/**
 * Pomodoro időzítő elindítása vagy folytatása.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
function startTimer() {
  if (intervalId) clearInterval(intervalId);

  if (isStarted.value && !isRunning.value) {
    startTime.value = Date.now() - elapsedWhenStopped.value;
  } else {
    startTime.value = Date.now();
    elapsedWhenStopped.value = 0;
  }

  isRunning.value = true;
  isStarted.value = true;
  setTimerStatus(true);
  setTimerStarted(true);
  setTimerStartTime(startTime.value);
  setTimerElapsed(elapsedWhenStopped.value);
  Object.assign(cookies.value, {
    pomodoroRunning: true,
    pomodoroStarted: true,
    pomodoroStart: startTime.value,
    pomodoroElapsed: elapsedWhenStopped.value,
  });

  calculate();
  chrome.runtime.sendMessage({
    type: "SCHEDULE_POMODORO",
    startTime: startTime.value,
    stages,
  });
  intervalId = setInterval(calculate, 1000);
}

/**
 * Pomodoro időzítő megállítása.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
function stopTimer() {
  clearInterval(intervalId);
  elapsedWhenStopped.value = Date.now() - startTime.value;
  isRunning.value = false;
  setTimerStatus(false);
  setTimerElapsed(elapsedWhenStopped.value);
  cookies.value.pomodoroRunning = false;
  cookies.value.pomodoroElapsed = elapsedWhenStopped.value;
  chrome.runtime.sendMessage({ type: "CLEAR_POMODORO_ALARMS" });
}

/**
 * Pomodoro időzítő visszaállítása alaphelyzetbe.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
function restartTimer() {
  clearInterval(intervalId);
  currentStage.value = 0;
  timeLeft.value = stages[0];
  isRunning.value = false;
  isStarted.value = false;
  startTime.value = 0;
  elapsedWhenStopped.value = 0;
  setTimerStatus(false);
  setTimerStarted(false);
  setTimerStartTime(0);
  setTimerElapsed(0);
  Object.assign(cookies.value, {
    pomodoroRunning: false,
    pomodoroStarted: false,
    pomodoroStart: 0,
    pomodoroElapsed: 0,
  });
  chrome.runtime.sendMessage({ type: "CLEAR_POMODORO_ALARMS" });
  pickMomPhrase();
}

onMounted(() => {
  if (isStarted.value) {
    calculate();
    if (isRunning.value) {
      intervalId = setInterval(calculate, 1000);
    }
  }
});

/**
 * Sütik frissítése a beállításokból kapott értékekkel.
 *
 * Paraméterek:
 *   val (object): A frissítendő kulcs–érték párok.
 *
 * Visszatérési érték:
 *   void: Nem ad vissza értéket.
 */
function updateCookies(val) {
  cookies.value = { ...cookies.value, ...val };
  loadStorageValues();
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: #f8f1e7;
  color: #242424;

  padding: 2rem;
}

.home__icon {
  width: 178px;
  height: 178px;
  /* margin: 1rem 0; */
}

.home__timer {
  font-size: 4rem;
  margin-top: 1rem;
  font-family: "Courier New", monospace;
  transition: color 0.3s;
}

.home__timer--focus {
  color: #e74c3c;
}

.home__timer--break {
  color: #2ecc71;
}

.home__timer--warning {
  animation: blink 1s step-start infinite;
}

@keyframes blink {
  50% {
    opacity: 0.4;
  }
}

.btn {
  padding: 1rem 2rem;

  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  margin: 0 0.5rem;
  transition: filter 0.2s;
  white-space: nowrap;
  min-width: 200px;

}

.btn:hover {
  filter: brightness(1.1);
}

.btn--start {
  background-color: #2ecc71;
  color: #242424;
}

.btn--stop {
  background-color: #e74c3c;
  color: #fff;
}

.btn--restart {
  background-color: #f39c12;
  color: #fff;
}

.home__controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.settings-section {
  margin-top: 2rem;
  width: 100%;
  max-width: 320px;
  color: #ccc;
  font-size: 0.9rem;
}

.settings-section__title {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.mom-bubble {
  margin-top: 2rem;
  background: #333;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  text-align: center;
  font-size: 0.9rem;
  color: #f5f5f5;

}
</style>
