@echo off
echo ============================================
echo   Smart Cooking Assistant - Full Setup
echo ============================================
echo.

echo [1/4] Creating all project files...
node create-all-dirs.js
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Failed to create project files. Make sure Node.js is installed.
  pause
  exit /b 1
)

echo.
echo [2/4] Installing server dependencies...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: npm install failed in server/
  pause
  exit /b 1
)

echo.
echo [3/4] Installing client dependencies...
cd ..\client
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: npm install failed in client/
  pause
  exit /b 1
)

cd ..

echo.
echo ============================================
echo   SETUP COMPLETE!
echo ============================================
echo.
echo   MongoDB must be running locally.
echo.
echo   To seed recipes into the database:
echo     cd server ^&^& npm run seed
echo.
echo   To start the app (open TWO terminals):
echo     Terminal 1:  cd server ^&^& npm run dev
echo     Terminal 2:  cd client ^&^& npm run dev
echo.
echo   Then open: http://localhost:5173
echo ============================================
pause
