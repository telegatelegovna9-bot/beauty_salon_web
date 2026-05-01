const cron = require('node-cron');

// Notification scheduler - sends reminders for upcoming bookings
let botInstance = null;

function setBotInstance(bot) {
  botInstance = bot;
}

async function sendReminder(chatId, message) {
  if (!botInstance) {
    console.warn('Bot instance not set, skipping notification');
    return;
  }

  try {
    await botInstance.sendMessage(chatId, message);
    console.log('Notification sent to', chatId);
  } catch (error) {
    console.error('Failed to send notification:', error.message);
  }
}

function startNotificationScheduler() {
  // Run every 30 minutes to check for upcoming bookings
  cron.schedule('*/30 * * * *', async () => {
    console.log('Checking for upcoming notifications...');
    // Notification logic would go here
  });

  console.log('📅 Notification scheduler started');
}

module.exports = {
  setBotInstance,
  sendReminder,
  startNotificationScheduler
};
