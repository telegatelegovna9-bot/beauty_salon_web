/**
 * Main entry point for Railway deployment
 * Runs from backend directory - starts both API and Telegram bot
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Current directory is backend/
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = __dirname;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('='.repeat(60));
console.log('🚀 Beauty Salon Bot - Starting up...');
console.log('='.repeat(60));
console.log(`Environment: ${NODE_ENV}`);
console.log(`Port: ${PORT}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`WEBAPP_URL: ${process.env.WEBAPP_URL || 'not set'}`);
console.log(`BOT_TOKEN: ${process.env.BOT_TOKEN ? '***set***' : '❌ NOT SET'}`);
console.log('='.repeat(60));

// ============================================
// START BACKEND API
// ============================================

console.log('\n📡 Starting Backend API...');

const backend = spawn('node', ['src/index.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: PORT.toString(),
    NODE_ENV: NODE_ENV
  }
});

backend.on('error', (error) => {
  console.error('❌ Failed to start backend:', error);
  process.exit(1);
});

backend.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend exited with code ${code}`);
    process.exit(1);
  }
});

// ============================================
// START BOT
// ============================================

console.log('\n🤖 Starting Telegram Bot...');

const bot = spawn('node', ['../bot/src/index.js'], {
  stdio: 'inherit',
  cwd: BACKEND_DIR,
  env: {
    ...process.env,
    // Tell bot where to find .env
    DOTENV_PATH: path.join(__dirname, '.env')
  }
});

bot.on('error', (error) => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});

bot.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Bot exited with code ${code}`);
    process.exit(1);
  }
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down...');
  backend.kill('SIGTERM');
  bot.kill('SIGTERM');
  setTimeout(() => process.exit(1), 10000);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down...');
  backend.kill('SIGINT');
  bot.kill('SIGINT');
  setTimeout(() => process.exit(1), 10000);
});

console.log('\n✅ All services started successfully!');
console.log('='.repeat(60));
