const jwt = require('jsonwebtoken');

// Dev mode authentication - for testing without Telegram
function devAuth(req, res, next) {
  if (process.env.NODE_ENV !== 'production' && req.headers['x-dev-user-id']) {
    req.devUser = {
      id: parseInt(req.headers['x-dev-user-id']),
      isDev: true
    };
    return next();
  }
  next();
}

// Telegram initialization data verification
async function verifyTelegramInitData(req, res, next) {
  const telegramData = req.headers['x-telegram-init-data'];
  
  if (!telegramData) {
    // Allow dev mode
    return devAuth(req, res, next);
  }

  // Parse query string from Telegram
  const urlSearchParams = new URLSearchParams(telegramData);
  const initData = Object.fromEntries(urlSearchParams.entries());

  // Store user data from Telegram
  if (initData.user) {
    const userData = JSON.parse(initData.user);
    req.telegramUser = {
      id: parseInt(userData.id),
      username: userData.username,
      first_name: userData.first_name,
      last_name: userData.last_name,
      isAuth: true
    };
  }

  next();
}

// Admin middleware
function requireAdmin(req, res, next) {
  const userId = req.telegramUser?.id || req.devUser?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admin check would query the database
  // For now, check against env variable
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (userId.toString() !== adminId.toString() && !req.devUser?.isDev) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

module.exports = {
  verifyTelegramInitData,
  requireAdmin,
  devAuth
};
