<template>
  <div class="settings">
    <div class="settings__row">
      <label for="language">{{ t('language') }}</label>
      <select id="language" v-model="language">
        <option value="en">English</option>
        <option value="ja">日本語</option>
        <option value="ru">Русский</option>
      </select>
    </div>
    <div class="settings__row">
      <label for="sendMessage">💬 {{ t('sendMessage') }}</label>
      <input
        id="sendMessage"
        type="checkbox"
        v-model="sendMessage"
        class="settings__toggle"
      />
    </div>
    <div class="settings__row">
      <label for="playSound">🔔 {{ t('playSound') }}</label>
      <input
        id="playSound"
        type="checkbox"
        v-model="playSound"
        class="settings__toggle"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  getLanguage,
  setLanguage,
  getSendMessage,
  setSendMessage,
  getPlaySound,
  setPlaySound
} from '../settings';

const { t, locale } = useI18n();
const emit = defineEmits(['update']);


const language = ref(getLanguage());
const sendMessage = ref(getSendMessage());
const playSound = ref(getPlaySound());

locale.value = language.value;

watch(language, (val) => {
  locale.value = val;
  setLanguage(val);
  emit('update', { language: val, sendMessage: sendMessage.value, playSound: playSound.value });
});

watch(sendMessage, (val) => {
  setSendMessage(val);
  emit('update', { language: language.value, sendMessage: val, playSound: playSound.value });
});

watch(playSound, (val) => {
  setPlaySound(val);
  emit('update', { language: language.value, sendMessage: sendMessage.value, playSound: val });
});
</script>

<style scoped>
.settings {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 0.9rem;
  color: #ccc;
}
.settings__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
