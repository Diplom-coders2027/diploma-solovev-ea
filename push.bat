@echo off
chcp 65001 >nul
title Отправка на GitHub
cd /d "%~dp0"

echo ========================================
echo   Отправка проекта на GitHub
echo ========================================
echo.

REM Проверяем, что это git-репозиторий
if not exist ".git" (
    echo [ОШИБКА] Папка .git не найдена.
    echo Этот батник должен лежать в корне проекта.
    pause
    exit /b 1
)

REM Показываем, что изменено
echo Изменённые файлы:
git status --short
echo.

REM Проверяем, есть ли что коммитить
git diff --quiet && git diff --cached --quiet
if %errorlevel%==0 (
    echo [ИНФО] Изменений нет. Всё уже на GitHub.
    echo.
    pause
    exit /b 0
)

REM Получаем сообщение коммита
if "%~1"=="" (
    set /p MSG="Введите сообщение коммита: "
) else (
    set MSG=%~1
)

if "%MSG%"=="" (
    echo.
    echo [ОШИБКА] Сообщение коммита не может быть пустым.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Добавляю файлы...
echo ========================================
git add .

echo.
echo ========================================
echo Коммичу: %MSG%
echo ========================================
git commit -m "%MSG%"

if errorlevel 1 (
    echo.
    echo [ОШИБКА] Не удалось создать коммит.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Отправляю на GitHub...
echo ========================================
git push

if errorlevel 1 (
    echo.
    echo [ОШИБКА] Push не удался. Возможные причины:
    echo   - Нет интернета
    echo   - Нужна авторизация GitHub
    echo   - Конфликт с удалённой веткой
    echo.
    echo Попробуйте вручную:
    echo   git pull origin main --rebase
    echo   git push
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ГОТОВО! Проект на GitHub.
echo ========================================
pause