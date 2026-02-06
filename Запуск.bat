@echo off
chcp 1251 > nul
title Танчики 2D

echo Запуск игры в Opera с отключенной безопасностью...
timeout /t 1 /nobreak >nul

REM ==============================================
REM УКАЗАН ВАШ ПРАВИЛЬНЫЙ ПУТЬ
REM ==============================================
set "OPERA_PATH=C:\Users\Bro\AppData\Local\Programs\Opera\opera.exe"

REM ==============================================
REM Проверяем существует ли Opera по указанному пути
REM ==============================================
if not exist "%OPERA_PATH%" (
    echo ОШИБКА: Opera не найдена по пути:
    echo %OPERA_PATH%
    echo.
    echo Проверьте что файл opera.exe существует:
    echo 1. Откройте папку C:\Users\Bro\AppData\Local\Programs\Opera
    echo 2. Убедитесь что там есть файл opera.exe
    echo 3. Если нет - Opera установлена в другом месте
    echo.
    pause
    exit
)

echo Opera найдена: %OPERA_PATH%
echo Запуск игры...

REM ==============================================
REM Запуск Opera с параметрами
REM ==============================================
start "" "%OPERA_PATH%" --disable-web-security --user-data-dir="C:\temp-opera" "%~dp0index.html"

echo.
echo Игра должна запуститься в Opera!
echo Если не открылось:
echo 1. Проверьте что все файлы в одной папке:
echo    - index.html
echo    - game.js
echo    - style.css
echo    - Запуск.bat
echo 2. Попробуйте открыть index.html вручную
echo.
timeout /t 5 /nobreak >nul
exit