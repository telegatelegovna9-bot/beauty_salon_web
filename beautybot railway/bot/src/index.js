require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is not set in .env file');
  process.exit(1);
}

if (!WEBAPP_URL) {
  console.error('❌ WEBAPP_URL is not set in .env file');
  process.exit(1);
}

// ============================================
// HTTP SERVER FOR RAILWAY HEALTHCHECK
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'telegram-bot' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'telegram-bot', timestamp: new Date().toISOString() });
});

const httpServer = require('http').createServer(app);

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Beauty Salon Bot starting...');

// Start HTTP server (don't await, bot polling starts immediately)
httpServer.listen(PORT, () => {
  console.log(`🌐 Bot HTTP server listening on port ${PORT}`);
});

// ============================================
// COMMANDS
// ============================================

bot.setMyCommands([
  { command: 'start', description: '🌸 Открыть приложение салона' },
  { command: 'book', description: '📅 Записаться на услугу' },
  { command: 'mybookings', description: '📋 Мои записи' },
  { command: 'help', description: '❓ Помощь' }
]);

// /start command
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const param = match[1]?.trim();

  const welcomeText = `
✨ <b>Добро пожаловать в Beauty Studio!</b>

Мы рады видеть вас! 🌸

Здесь вы можете:
• 💅 Записаться на маникюр и педикюр
• 👁 Оформить брови и ресницы
• 📅 Управлять своими записями
• 👤 Просмотреть портфолио мастеров

Нажмите кнопку ниже, чтобы открыть приложение:
  `;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '💅 Открыть Beauty Studio',
        web_app: { url: WEBAPP_URL }
      }
    ]]
  };

  await bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'HTML',
    reply_markup: JSON.stringify(keyboard)
  });
});

// /book command
bot.onText(/\/book/, async (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📅 Записаться',
        web_app: { url: `${WEBAPP_URL}?page=book` }
      }
    ]]
  };

  await bot.sendMessage(chatId, '📅 <b>Запись на услугу</b>\n\nОткройте приложение для записи:', {
    parse_mode: 'HTML',
    reply_markup: JSON.stringify(keyboard)
  });
});

// /mybookings command
bot.onText(/\/mybookings/, async (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📋 Мои записи',
        web_app: { url: `${WEBAPP_URL}?page=bookings` }
      }
    ]]
  };

  await bot.sendMessage(chatId, '📋 <b>Ваши записи</b>\n\nОткройте приложение для просмотра:', {
    parse_mode: 'HTML',
    reply_markup: JSON.stringify(keyboard)
  });
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpText = `
❓ <b>Помощь</b>

<b>Команды:</b>
/start — Открыть приложение
/book — Записаться на услугу
/mybookings — Мои записи

<b>Как записаться:</b>
1. Нажмите /start или кнопку ниже
2. Выберите услугу
3. Выберите мастера
4. Выберите дату и время
5. Подтвердите запись

<b>Вопросы?</b>
Напишите нам в чат или позвоните по телефону.
  `;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '💅 Открыть приложение',
        web_app: { url: WEBAPP_URL }
      }
    ]]
  };

  await bot.sendMessage(chatId, helpText, {
    parse_mode: 'HTML',
    reply_markup: JSON.stringify(keyboard)
  });
});

// ============================================
// CALLBACK QUERIES (from notification buttons)
// ============================================

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('confirm_')) {
    const bookingId = data.replace('confirm_', '');
    await bot.answerCallbackQuery(query.id, { text: '✅ Запись подтверждена!' });
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: '✅ Подтверждено', callback_data: 'done' }]] },
      { chat_id: chatId, message_id: query.message.message_id }
    );

    // Notify backend
    try {
      const axios = require('axios');
      await axios.put(`${BACKEND_URL}/api/bookings/${bookingId}/status`, {
        status: 'confirmed'
      }, {
        headers: { 'X-Bot-Secret': process.env.BOT_TOKEN }
      });
    } catch (e) {
      console.error('Failed to confirm booking via API:', e.message);
    }
  }

  if (data.startsWith('cancel_')) {
    const bookingId = data.replace('cancel_', '');
    await bot.answerCallbackQuery(query.id, { text: '❌ Запись отменена' });
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: '❌ Отменено', callback_data: 'done' }]] },
      { chat_id: chatId, message_id: query.message.message_id }
    );

    try {
      const axios = require('axios');
      await axios.put(`${BACKEND_URL}/api/bookings/${bookingId}/status`, {
        status: 'cancelled',
        cancel_reason: 'Отменено клиентом через уведомление'
      }, {
        headers: { 'X-Bot-Secret': process.env.BOT_TOKEN }
      });
    } catch (e) {
      console.error('Failed to cancel booking via API:', e.message);
    }
  }

  if (data === 'done') {
    await bot.answerCallbackQuery(query.id);
  }
});

// ============================================
// WEB APP DATA (from WebApp)
// ============================================

bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  try {
    const data = JSON.parse(msg.web_app_data.data);

    if (data.type === 'booking_created') {
      await bot.sendMessage(chatId, `
✅ <b>Запись создана!</b>

📅 ${data.date}
🕐 ${data.time}
💅 ${data.service}
👤 Мастер: ${data.master}

Ждём вас! 🌸
      `, { parse_mode: 'HTML' });
    }
  } catch (e) {
    console.error('Failed to parse web_app_data:', e.message);
  }
});

// ============================================
// ERROR HANDLING
// ============================================

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('Bot error:', error.message);
});

// ============================================
// EXPORT FOR NOTIFICATIONS SERVICE
// ============================================

module.exports = bot;

console.log('✅ Beauty Salon Bot is running!');
console.log(`🌐 WebApp URL: ${WEBAPP_URL}`);
