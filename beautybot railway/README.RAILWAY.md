# 🚀 Деплой на Railway

Этот проект настроен для деплоя на Railway с использованием Docker.

## 📋 Что нужно задеплоить

Проект состоит из 3 сервисов:

1. **Backend** - API сервер (Express.js + SQLite)
2. **Bot** - Telegram бот (node-telegram-bot-api)
3. **Frontend** - Статическое веб-приложение (nginx)

## 🛠️ Шаг 1: Подготовка репозитория

1. Загрузите код в GitHub/GitLab/Bitbucket
2. Убедитесь, что `.env` файл в `.gitignore` (не должен коммититься)

## 🚀 Шаг 2: Создание сервисов на Railway

### 2.1 Backend

1. На Railway нажмите **"New Project"** → **"From Git Repo"**
2. Выберите ваш репозиторий
3. Выберите **directory**: `backend`
4. Railway автоматически обнаружит Dockerfile

### 2.2 Bot

1. Нажмите **"New Project"** → **"From Git Repo"**
2. Выберите тот же репозиторий
3. Выберите **directory**: `bot`
4. Railway автоматически обнаружит Dockerfile

### 2.3 Frontend

1. Нажмите **"New Project"** → **"From Git Repo"**
2. Выберите тот же репозиторий
3. Выберите **directory**: `frontend`
4. Railway автоматически обнаружит Dockerfile

## ⚙️ Шаг 3: Настройка Environment Variables

### Backend (Settings → Variables)

| Variable | Value |
|----------|-------|
| `BOT_TOKEN` | Токен вашего бота от @BotFather |
| `WEBAPP_URL` | URL отдеплоенного frontend (например, `https://your-app.onrender.com`) |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `DB_PATH` | `./data/beauty_salon.db` |
| `UPLOADS_PATH` | `./uploads` |
| `ADMIN_TELEGRAM_ID` | Ваш Telegram ID |

### Bot (Settings → Variables)

| Variable | Value |
|----------|-------|
| `BOT_TOKEN` | Токен вашего бота от @BotFather |
| `WEBAPP_URL` | URL отдеплоенного frontend |
| `BACKEND_URL` | URL отдеплоенного backend API |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

### Frontend (Settings → Variables)

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |

## 🔗 Шаг 4: Настройка связей между сервисами

После деплоя каждого сервиса, Railway присвоит ему URL. Настройте переменные:

1. **Frontend** → скопируйте URL (например, `https://frontend-xxx.railway.app`)
2. **Backend** → скопируйте URL (например, `https://backend-xxx.railway.app`)
3. В **Bot** переменных установите:
   - `WEBAPP_URL` = URL frontend
   - `BACKEND_URL` = URL backend

## ✅ Шаг 5: Проверка

1. **Backend**: `https://your-backend.railway.app/api/health`
   - Должен вернуть: `{"status":"ok","timestamp":"...","version":"1.0.0"}`

2. **Bot**: Откройте вашего бота в Telegram и нажмите `/start`
   - Должна появиться приветственная сообщение с кнопкой

3. **Frontend**: Откройте URL frontend в браузере
   - Должна загрузиться главная страница

## 📊 Мониторинг

- **Logs**: Railway Dashboard → Logs вкладка
- **Metrics**: Railway Dashboard → Metrics вкладка
- **Custom Domain**: Settings → Domains

## 🔧 Устранение проблем

### Деплой не начинается

- Убедитесь, что Dockerfile существует в правильной директории
- Проверьте Railway.toml файл

### Bot не отвечает

- Проверьте, что `BOT_TOKEN` правильно установлен
- Проверьте логи бота

### Backend не доступен

- Проверьте, что `PORT` переменная установлена
- Проверьте healthcheck endpoint

### Frontend не загружается

- Проверьте nginx.conf
- Убедитесь, что все статические файлы на месте

## 📁 Структура проекта

```
├── backend/
│   ├── Dockerfile
│   ├── Railway.toml
│   ├── .dockerignore
│   └── src/
├── bot/
│   ├── Dockerfile
│   ├── Railway.toml
│   ├── .dockerignore
│   └── src/
├── frontend/
│   ├── Dockerfile
│   ├── Railway.toml
│   ├── .dockerignore
│   ├── nginx.conf
│   └── (static files)
└── README.RAILWAY.md
```

## 💡 Советы

1. **SQLite на Railway**: База данных хранится в файловой системе контейнера. При перезапуске контейнера данные могут потеряться. Для продакшена рекомендуется использовать Railway PostgreSQL addon.

2. **File uploads**: Файлы в `uploads/` также хранятся в файловой системе контейнера. Для продакмена используйте S3-совместимое хранилище.

3. **Scaling**: Railway автоматически масштабирует сервисы. Вы можете настроить limits в Settings → Resources.

4. **Webhooks**: Для production рекомендуется использовать webhooks вместо long polling для бота.
