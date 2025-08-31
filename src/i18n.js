import { createI18n } from 'vue-i18n';
import { getLanguage } from './settings';

const messages = {
  en: {
    start: 'Start pomodoro',
    language: 'Language',
    sendMessage: 'Send me message'
  },
  ja: {
    start: 'ポモドーロを開始',
    language: '言語',
    sendMessage: 'メッセージを送ってください'
  },
  ru: {
    start: 'Начать помодоро',
    language: 'Язык',
    sendMessage: 'Отправлять мне сообщения'
  }
};

export default createI18n({
  legacy: false,
  locale: getLanguage(),
  messages
});
