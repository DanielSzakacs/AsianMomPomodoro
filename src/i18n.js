import { createI18n } from 'vue-i18n';
import { getLanguage } from './settings';

const messages = {
  en: {
    start: 'Start pomodoro',
    stop: 'Stop (no excuses!)',
    restart: 'Restart (try again!)',
    settings: 'Settings',
    language: 'Language',
    sendMessage: 'Send me message',
    playSound: 'Play sound effect',
    progressFeedback: '{minutes} min left… don\'t slack!'
  },
  ja: {
    start: 'ポモドーロを開始',
    stop: '停止（言い訳なし！）',
    restart: 'リスタート（もう一度！）',
    settings: '設定',
    language: '言語',
    sendMessage: 'メッセージを送ってください',
    playSound: '効果音を再生',
    progressFeedback: '残り{minutes}分…サボるな！'
  },
  ru: {
    start: 'Начать помодоро',
    stop: 'Стоп (никаких оправданий!)',
    restart: 'Перезапуск (попробуй снова!)',
    settings: 'Настройки',
    language: 'Язык',
    sendMessage: 'Отправлять мне сообщения',
    playSound: 'Воспроизводить звук',
    progressFeedback: 'Осталось {minutes} мин... не отвлекайся!'
  }
};

export default createI18n({
  legacy: false,
  locale: getLanguage(),
  messages
});
