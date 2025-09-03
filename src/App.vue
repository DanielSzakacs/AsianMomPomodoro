<template>
  <div class="home">
    <img
      src="/assets/img/mom_img.png"
      alt="Asian Mom Pomodoro icon"
      class="home__icon"
    />
    <div class="home__timer">{{ formattedTime }}</div>
    <div v-if="!isStarted">
      <button class="home__start" @click="startTimer">{{ t("start") }}</button>
    </div>
    <div v-else class="home__controls">
      <button v-if="isRunning" class="home__stop" @click="stopTimer">
        {{ t("stop") }}
      </button>
      <button v-else class="home__start" @click="startTimer">
        {{ t("start") }}
      </button>
      <button class="home__restart" @click="restartTimer">
        {{ t("restart") }}
      </button>
    </div>
    <button @click="startTimerTest">Indíts 10 mp-es időzítőt</button>
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
    </div>
    Is in focus ? => {{ currentStage % 2 === 0 }}
    <Settings @update="updateCookies" />
  </div>
</template>

<script setup>
import Settings from "./components/Settings.vue";
import { ref, computed, onMounted } from "vue";
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

const { t } = useI18n();

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
});

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
      if (chrome?.storage?.local) {
        chrome.storage.local.set({
          pomodoro_mode: "focus",
          pomodoro_end_time: 0,
          pomodoro_running: String(isRunning.value),
        });
      }
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
    currentStage.value = idx;
    timeLeft.value = Math.ceil((stages[idx] * 1000 - remaining) / 1000);

    if (chrome?.storage?.local) {
      const endTime =
        startTime.value +
        stages.slice(0, idx + 1).reduce((a, b) => a + b, 0) * 1000;
      chrome.storage.local.set({
        pomodoro_mode: idx % 2 === 0 ? "focus" : "break",
        pomodoro_end_time: endTime,
        pomodoro_running: String(isRunning.value),
      });
    }
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
    if (chrome?.storage?.local) {
      chrome.storage.local.set({
        pomodoro_running: "false",
        pomodoro_end_time: 0,
      });
    }
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
    if (chrome?.storage?.local) {
      chrome.storage.local.set({
        pomodoro_mode: "focus",
        pomodoro_end_time: 0,
        pomodoro_running: "false",
      });
    }
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
.app {
  min-width: 280px;
  padding: 16px;
  font-family: system-ui, sans-serif;
}
button {
  margin-right: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  cursor: pointer;
}
.hint {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
}

.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
}

.home__icon {
  width: 128px;
  height: 128px;
  margin: 1rem 0;
}

.home__start {
  margin-top: 1rem;
}

.home__timer {
  font-size: 2rem;
  margin-top: 1rem;
}
</style>
