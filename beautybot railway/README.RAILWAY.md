# 🚀 Деплой на Railway

Этот проект настроен для деплоя на Railway с использованием Docker.

## 📋 Структура проекта

```
├── Dockerfile              # Единый Dockerfile для всех сервисов
├── railway.json            # Railway конфигурация
├── supervisord.conf        # Запуск нескольких процессов
├── nginx.conf              # Nginx конфигурация для фронтенда
├── .dockerignore           # Исключения для Docker
├── .env.example            # Пример переменных окружения
├── backend/                # Backend API (Express.js + SQLite)
├── bot/                    # Telegram бот
└── frontend/               # Статическое веб-приложение (nginx)
```

## 🚀 Быстрый старт

### Шаг 1: Подготовка репозитория

1. Загрузите код в GitHub/GitLab/Bitbucket
2. Убедитесь, что `.env` файл в `.gitignore` (не должен коммититься)

### Шаг 2: Создание проекта на Railway

1. На Railway нажмите **"New Project"** → **"From Git Repo"**
2. Выберите ваш репозиторий
3. Railway автоматически обнаружит `Dockerfile` и `railway.json`

### Шаг 3: Настройка Environment Variables

Перейдите в **Settings → Variables** и установите:

| Variable | Value |
|----------|-------|
| `BOT_TOKEN` | Токен вашего бота от @BotFather |
| `WEBAPP_URL` | URL вашего Railway деплоя (например, `https://your-app.railway.app`) |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `ADMIN_TELEGRAM_ID` | Ваш Telegram ID |

### Шаг 4: Проверка

1. **Health Check**: `https://your-app.railway.app/api/health`
   - Должен вернуть: `{"status":"ok","timestamp":"...","version":"1.0.0"}`

2. **Bot**: Откройте вашего бота в Telegram и нажмите `/start`
   - Должна появиться приветственная сообщение с кнопкой

3. **Frontend**: Откройте URL в браузере
   - Должна загрузиться главная страница

## ⚙️ Как это работает

### Единый контейнер

Все три сервиса запускаются в одном контейнере с помощью **supervisord**:

1. **Backend API** (порт 3001) - Express.js + SQLite
2. **Telegram Bot** (порт 3000) - node-telegram-bot-api + HTTP healthcheck
3. **Frontend** (порт 80) - nginx для статических файлов

### supervisord.conf

Конфигурация supervisord запускает два процесса Node.js:
- `backend` - API сервер
- `bot` - Telegram бот

Nginx запускается отдельно для обслуживания фронтенда.

## 📊 Мониторинг

- **Logs**: Railway Dashboard → Logs вкладка
- **Metrics**: Railway Dashboard → Metrics вкладка
- **Custom Domain**: Settings → Domains

## 🔧 Устранение проблем

### Деплой не начинается

- Убедитесь, что `Dockerfile` существует в корне репозитория
- Проверьте `railway.json` файл
- Посмотрите логи билда на Railway

### Backend не доступен

- Проверьте healthcheck endpoint: `/api/health`
- Убедитесь, что `PORT` переменная установлена в `3001`

### Bot не отвечает

- Проверьте, что `BOT_TOKEN` правильно установлен
- Проверьте логи бота

### Frontend не загружается

- Проверьте, что все файлы frontend на месте
- Убедитесь, что nginx.conf правильный

## 💡 Важные заметки

### SQLite на Railway

База данных хранится в файловой системе контейнера. При перезапуске контейнера данные могут сохраняться если использовать Railway PostgreSQL addon.

### Переменные окружения

- `BACKEND_URL` для бота автоматически устанавливается в `http://localhost:3001`
- `WEBAPP_URL` должен указывать на публичный URL вашего деплоя

### Порты

- **3001** - Backend API (основной порт для Railway)
- **80** - Frontend (nginx)
- **3000** - Bot HTTP server (для healthcheck)

## 📁 Файлы для Docker

| Файл | Описание |
|------|----------|
| `Dockerfile` | Multi-stage build для всех сервисов |
| `railway.json` | Railway конфигурация |
| `supervisord.conf` | Запуск нескольких процессов |
| `nginx.conf` | Nginx конфигурация для SPA |
| `.dockerignore` | Исключения для Docker билда |
