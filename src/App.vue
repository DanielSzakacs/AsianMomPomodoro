<template>
  <div class="app">
    <div class="time">{{ minutes }}:{{ seconds }}</div>
    <button v-if="!running" @click="start">Start</button>
    <button v-else @click="stop">Stop</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const running = ref(false);
const remaining = ref(0);
let intervalId;

function update(endTime) {
  const ms = endTime - Date.now();
  remaining.value = Math.max(0, Math.round(ms / 1000));
  if (remaining.value <= 0) {
    running.value = false;
    clearInterval(intervalId);
  }
}

async function start() {
  const res = await chrome.runtime.sendMessage({ command: 'start' });
  running.value = true;
  update(res.endTime);
  clearInterval(intervalId);
  intervalId = setInterval(() => update(res.endTime), 1000);
}

async function stop() {
  await chrome.runtime.sendMessage({ command: 'stop' });
  running.value = false;
  clearInterval(intervalId);
  remaining.value = 0;
}

onMounted(async () => {
  const state = await chrome.runtime.sendMessage({ command: 'getState' });
  if (state.running) {
    running.value = true;
    update(state.endTime);
    intervalId = setInterval(() => update(state.endTime), 1000);
  }
});

onUnmounted(() => clearInterval(intervalId));

const minutes = computed(() => String(Math.floor(remaining.value / 60)).padStart(2, '0'));
const seconds = computed(() => String(remaining.value % 60).padStart(2, '0'));
</script>

<style scoped>
.app {
  min-width: 200px;
  text-align: center;
  padding: 16px;
}
.time {
  font-size: 32px;
  margin-bottom: 8px;
}
button {
  padding: 8px 16px;
}
</style>
