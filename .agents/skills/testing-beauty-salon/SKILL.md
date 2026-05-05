---
name: testing-beauty-salon
description: Test the beauty salon Telegram WebApp locally. Use when verifying frontend UI changes, profile page, or other visual changes.
---

# Testing Beauty Salon Web App

## Local Setup

1. **Backend setup:**
   ```bash
   cd backend && npm install
   mkdir -p data uploads
   ```

2. **Create `backend/.env`** (if not present):
   ```env
   BOT_TOKEN=test_token_for_dev
   WEBAPP_URL=http://localhost:3000
   PORT=3001
   NODE_ENV=development
   DB_PATH=./data/beauty_salon.db
   UPLOADS_PATH=./uploads
   ADMIN_TELEGRAM_ID=123456789
   ```

3. **Start backend:**
   ```bash
   cd backend && node src/index.js
   ```
   Backend runs on port 3001.

4. **Start frontend:**
   ```bash
   cd frontend && npx serve -s . -l 3000
   ```
   Frontend runs on port 3000.

## Dev Auth Bypass

- On localhost, the app uses a `dev_bypass` mode that skips Telegram auth.
- Pass `user_id` as a URL query param: `http://localhost:3000?user_id=123456789`
- The user matching `ADMIN_TELEGRAM_ID` in `.env` gets the `admin` role.
- First-time users are auto-created with `first_name=Dev`, `last_name=User`, `username=devuser`.

## Navigating to Pages

- Use `?page=<pageName>` query param to navigate directly:
  - `?page=profile` — Profile page
  - `?page=home` — Home page
  - `?page=book` — Booking page
  - `?page=bookings` — My bookings
  - `?page=portfolio` — Portfolio
- Bottom nav bar also allows navigation between pages.

## Key Architecture Notes

- Frontend is vanilla JS (no framework), served as static files.
- CSS is in `frontend/css/main.css` (main styles), `components.css`, `animations.css`.
- Page templates are in `frontend/js/pages/*.js` — each page has a `render()` method returning HTML strings.
- Backend uses Express + sql.js (pure JS SQLite).
- No CI is configured on this repo.
- No pre-commit hooks.

## Testing Tips

- For visual/UI testing, use Chrome with the app at `http://localhost:3000?user_id=123456789&page=<target>`.
- The app is designed as a Telegram WebApp (mobile-first). Consider testing with Chrome DevTools device emulation for more accurate results.
- Port 3001 might already be in use from a previous run. Use `fuser -k 3001/tcp` to free it before restarting the backend.
- The database is auto-created on first backend start. Delete `backend/data/beauty_salon.db` to reset.

## Devin Secrets Needed

None required for local development testing. The dev bypass mode handles auth without real Telegram credentials.
