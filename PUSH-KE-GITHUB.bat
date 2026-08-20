@echo off
setlocal EnableExtensions
cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git belum terpasang atau belum masuk PATH.
  echo Install Git for Windows, lalu jalankan file ini lagi.
  pause
  exit /b 1
)

echo Repository tujuan: https://github.com/aifrfx/surveydosen.git
echo.

if not exist ".git" (
  git init
  if errorlevel 1 goto :fail
)

git branch -M main

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin https://github.com/aifrfx/surveydosen.git
) else (
  git remote set-url origin https://github.com/aifrfx/surveydosen.git
)

git config user.name >nul 2>nul
if errorlevel 1 (
  set /p GIT_NAME=Masukkan nama untuk commit Git: 
  git config user.name "%GIT_NAME%"
)

git config user.email >nul 2>nul
if errorlevel 1 (
  set /p GIT_EMAIL=Masukkan email untuk commit Git: 
  git config user.email "%GIT_EMAIL%"
)

git add .
if errorlevel 1 goto :fail

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "feat: tambah sistem perhitungan penilaian kinerja"
  if errorlevel 1 goto :fail
) else (
  echo Tidak ada perubahan baru untuk di-commit.
)

echo.
echo Mendorong branch main ke GitHub...
git push -u origin main
if errorlevel 1 goto :fail

echo.
echo [OK] Project berhasil di-push ke GitHub.
pause
exit /b 0

:fail
echo.
echo [ERROR] Proses berhenti. Baca pesan error Git di atas.
echo Panduan manual tersedia di GITHUB-PUSH.md.
pause
exit /b 1
