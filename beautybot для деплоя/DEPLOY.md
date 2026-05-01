# 🚀 Деплой Beauty Salon Bot на Railway

## Предварительные требования

1. Аккаунт на [Railway](https://railway.app)
2. Telegram бот (через @BotFather)
3. Git репозиторий с проектом

## Шаг 1: Подготовка Telegram бота

1. Откройте @BotFather в Telegram
2. Создайте нового бота командой `/newbot`
3. Скопируйте токен бота

## Шаг 2: Настройка Railway

### 2.1. Подключение репозитория

1. Войдите в Railway
2. Нажмите "New Project" → "Deploy from git repo"
3. Выберите ваш репозиторий (или подключите GitHub)

### 2.2. Переменные окружения

В настройках проекта на Railway перейдите в раздел "Variables" и добавьте:

| Variable | Value | Description |
|----------|-------|-------------|
| `BOT_TOKEN` | `your_telegram_bot_token` | Токен вашего Telegram бота |
| `WEBAPP_URL` | `https://your-app.up.railway.app` | URL вашего приложения (Railway предоставит автоматически) |
| `PORT` | `8080` | Порт для Railway (обязательно 8080) |
| `NODE_ENV` | `production` | Режим разработки |
| `ADMIN_TELEGRAM_ID` | `539246472` | Ваш Telegram ID для админ панели |

**ВАЖНО:** Railway автоматически предоставляет переменную `RAILWAY_PUBLIC_DOMAIN` - вы можете использовать её для `WEBAPP_URL`.

### 2.3. Деплой

1. Railway автоматически обнаружит `railway.json` и `Procfile`
2. Нажмите "Deploy"
3. Дождитесь завершения деплоя

## Шаг 3: Проверка

После деплоя проверьте:

1. **Backend API:** `https://your-app.up.railway.app/api/health`
2. **Telegram бот:** Откройте бота в Telegram и отправьте `/start`
3. **WebApp:** Нажмите кнопку "Открыть Beauty Studio" в боте

## Структура файлов для Railway

```
├── server.js              # Главный файл запуска (бэкенд + бот)
├── Procfile               # Procfile для Railway
├── railway.json           # Конфигурация Railway
├── package.json           # Корневые зависимости
├── .env                   # Переменные окружения (через Railway UI)
├── backend/
│   ├── src/
│   │   └── index.js       # Backend API (Express)
│   └── data/
│       └── beauty_salon.db # База данных (SQLite)
├── bot/
│   └── src/
│       └── index.js       # Telegram бот
└── frontend/
    ├── index.html
    ├── css/
    └── js/
```

## Решение проблем

### Проблема: Backend не запускается

**Решение:** Проверьте логи в Railway. Убедитесь, что `PORT=8080` и `BOT_TOKEN` правильно установлены.

### Проблема: Бот не отвечает

**Решение:** Убедитесь, что `BOT_TOKEN` правильный и нет ошибок в консоли.

### Проблема: Frontend не загружается

**Решение:** В production режиме frontend обслуживается через backend. Проверьте, что файлы frontend/ существуют в репозитории.

### Проблема: База данных не создается

**Решение:** Убедитесь, что директория `backend/data/` существует и имеет права на запись.

## Локальная разработка

```bash
# Установка зависимостей
npm run install:all

# Запуск бэкенда
cd backend && npm run dev

# Запуск бота
cd bot && npm run dev

# Запуск frontend (отдельно)
cd frontend && npm start
```

## Переменные окружения

См. [`backend/.env.example`](backend/.env.example) для примера.
