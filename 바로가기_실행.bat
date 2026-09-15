@echo off
chcp 65001 > nul
echo 글로벌 번역기 서버를 준비 중입니다. 잠시만 기다려주세요...
echo.
echo (참고: 같이 열린 까만 서버 창은 앱을 사용하는 동안 닫지 마세요!)

:: 백그라운드 서버 실행 (새 창)
start "글로벌 번역기 서버" cmd /c "npm run dev"

:: 서버가 켜질 때까지 3초 대기
timeout /t 3 /nobreak > nul

:: 브라우저로 앱 열기
start http://localhost:5173
