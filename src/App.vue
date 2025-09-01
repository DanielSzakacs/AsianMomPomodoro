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
    <!-- TODO: remove cookie debug output -->
    <p class="home__debug">
      language: {{ cookies.language }}, sendMessage: {{ cookies.sendMessage }},
      pomodoroRunning: {{ cookies.pomodoroRunning }}, pomodoroStarted:
      {{ cookies.pomodoroStarted }}, pomodoroStart: {{ cookies.pomodoroStart }},
      pomodoroElapsed: {{ cookies.pomodoroElapsed }}
    </p>
    Is in focus ? => {{ currentStage % 2 === 0 }}
    <Settings @update="updateCookies" />
    <div class="toast-demo">
      <button class="toast-demo__btn" @click="triggerToast">
        Mutasd a toastot
      </button>
      <button class="toast-demo__btn" @click="startToastTimer">
        Indíts 10 mp-es időzítőt
      </button>
    </div>
  </div>
</template>

<script setup>
import Settings from "./components/Settings.vue";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  getLanguage,
  getSendMessage,
  getTimerStatus,
  setTimerStatus,
  getTimerStarted,
  setTimerStarted,
  getTimerStartTime,
  setTimerStartTime,
  getTimerElapsed,
  setTimerElapsed,
} from "./settings";
import { showNotification } from "./notification";

const { t } = useI18n();

const cookies = ref({
  language: getLanguage(),
  sendMessage: getSendMessage(),
  pomodoroRunning: getTimerStatus(),
  pomodoroStarted: getTimerStarted(),
  pomodoroStart: getTimerStartTime(),
  pomodoroElapsed: getTimerElapsed(),
});

const stages = [
  1 * 60, // fokus
  1 * 60,
  1 * 60, // fokus
  1 * 60,
  1 * 60, // fokus
  1 * 60,
  1 * 60, // fokus
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

const focusMessages = ["Ideje koncentrálni!", "Rajta, fókuszálj!"];

const breakMessages = ["Itt a szünet ideje!", "Pihenj egy kicsit!"];

function notifyStage(stageIndex) {
  const msgs = stageIndex % 2 === 0 ? focusMessages : breakMessages;
  const message = msgs[Math.floor(Math.random() * msgs.length)];
  showNotification({ sender: "Asian Mom", message });
}

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60);
  const s = timeLeft.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

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
  if (idx !== currentStage.value) {
    currentStage.value = idx;
    notifyStage(idx);
  } else {
    currentStage.value = idx;
  }
  timeLeft.value = Math.ceil((stages[idx] * 1000 - remaining) / 1000);
}

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
  notifyStage(currentStage.value);
  intervalId = setInterval(calculate, 1000);
}

function stopTimer() {
  clearInterval(intervalId);
  elapsedWhenStopped.value = Date.now() - startTime.value;
  isRunning.value = false;
  setTimerStatus(false);
  setTimerElapsed(elapsedWhenStopped.value);
  cookies.value.pomodoroRunning = false;
  cookies.value.pomodoroElapsed = elapsedWhenStopped.value;
}

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
}

onMounted(() => {
  if (isStarted.value) {
    calculate();
    if (isRunning.value) {
      intervalId = setInterval(calculate, 1000);
    }
  }
});

function updateCookies(val) {
  cookies.value = { ...cookies.value, ...val };
}

function triggerToast() {
  chrome.runtime.sendMessage({
    type: "TRIGGER_TOAST",
    text: "👋 Egyedi, CSS-es toast!",
  });
}

function startToastTimer() {
  chrome.runtime.sendMessage({
    type: "START_TIMER",
    delayMs: 10000,
  });
}
</script>

<style scoped>
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

.home__debug {
  margin-top: 1rem;
}

.home__timer {
  font-size: 2rem;
  margin-top: 1rem;
}

.toast-demo {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.toast-demo__btn {
  padding: 0.5rem 1rem;
}
</style>
