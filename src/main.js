import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import i18n from './i18n';

const app = createApp(App);
app.use(i18n);
app.mount('#app');

chrome.runtime?.onMessage.addListener((msg) => {
  if (msg?.type === 'CLOSE_APP_WINDOW') {
    window.close();
  }
});
