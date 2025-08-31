<template>
  <div class="home">
    <img
      src="/assets/img/mom_img.png"
      alt="Asian Mom Pomodoro icon"
      class="home__icon"
    />
    <button class="home__start">{{ t('start') }}</button>
    <!-- TODO: remove cookie debug output -->
    <p class="home__debug">
      language: {{ cookies.language }}, sendMessage: {{ cookies.sendMessage }}
    </p>
    <Settings @update="updateCookies" />
  </div>
</template>

<script setup>
import Settings from './components/Settings.vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getLanguage, getSendMessage } from './settings';

const { t } = useI18n();

const cookies = ref({
  language: getLanguage(),
  sendMessage: getSendMessage()
});

function updateCookies(val) {
  cookies.value = val;
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
</style>
