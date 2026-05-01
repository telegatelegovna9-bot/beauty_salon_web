# Beauty Studio — Frontend Launcher (PowerShell)
Write-Host "🌐 Starting Beauty Studio Frontend on http://localhost:3000..." -ForegroundColor Cyan
Set-Location frontend
npx serve -s . -l 3000
