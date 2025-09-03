import { createI18n } from 'vue-i18n';
import { getLanguage } from './settings';

const messages = {
  en: {
    start: 'Start pomodoro',
    stop: 'Stop',
    restart: 'Restart',
    language: 'Language',
    sendMessage: 'Send me message',
    playSound: 'Play sound effect'
  },
  ja: {
    start: 'ポモドーロを開始',
    stop: '停止',
    restart: 'リスタート',
    language: '言語',
    sendMessage: 'メッセージを送ってください',
    playSound: '効果音を再生'
  },
  ru: {
    start: 'Начать помодоро',
    stop: 'Стоп',
    restart: 'Перезапуск',
    language: 'Язык',
    sendMessage: 'Отправлять мне сообщения',
    playSound: 'Воспроизводить звук'
  }
};

export default createI18n({
  legacy: false,
  locale: getLanguage(),
  messages
});
