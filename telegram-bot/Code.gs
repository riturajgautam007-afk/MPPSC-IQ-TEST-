const TEST_URL = 'https://riturajgautam007-afk.github.io/MPPSC-IQ-TEST-/?v=60';

function doGet() {
  return ContentService.createTextOutput('MPPSC IQ Telegram Bot is running');
}

function doPost(e) {
  try {
    const update = JSON.parse(e.postData.contents || '{}');
    const msg = update.message;

    if (!msg || !msg.text) {
      return ContentService.createTextOutput('ok');
    }

    const text = msg.text.trim();
    if (text === '/test' || text.startsWith('/test@')) {
      sendTestButton(msg.chat.id);
    }

    return ContentService.createTextOutput('ok');
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput('ok');
  }
}

function sendTestButton(chatId) {
  const token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');

  const payload = {
    chat_id: chatId,
    text:
      '📚 <b>MPPSC IQ TEST 01</b>\n\n' +
      '100 MCQs • +3 / −1 / 0\n' +
      '⏱️ समय: 60 मिनट\n\n' +
      'नीचे दिए बटन से टेस्ट शुरू करें 👇',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🚀 START TEST',
          web_app: { url: TEST_URL }
        }
      ]]
    }
  };

  UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + token + '/sendMessage',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );
}

function setWebhook(webAppUrl) {
  const token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  const url = 'https://api.telegram.org/bot' + token + '/setWebhook?url=' + encodeURIComponent(webAppUrl);
  return UrlFetchApp.fetch(url).getContentText();
}

function deleteWebhook() {
  const token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  return UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/deleteWebhook').getContentText();
}
