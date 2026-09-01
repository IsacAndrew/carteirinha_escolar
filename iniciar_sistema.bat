@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Carteirinha Escolar

set "PYTHON_REAL="
set "PYTHON_ARGUMENTOS="

rem Usar o ambiente do sistema se ele estiver funcionando
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -c "import sys; print(sys.version)" >nul 2>nul
  if not errorlevel 1 goto ambiente_pronto
)

rem Procurar pelo inicializador oficial do Python
where py.exe >nul 2>nul
if not errorlevel 1 (
  py.exe -3 -c "import sys; print(sys.executable)" >nul 2>nul
  if not errorlevel 1 (
    set "PYTHON_REAL=py.exe"
    set "PYTHON_ARGUMENTOS=-3"
  )
)

rem Procurar nas pastas normais do instalador do Python
if not defined PYTHON_REAL (
  for /d %%D in ("%LocalAppData%\Programs\Python\Python*") do (
    if exist "%%~fD\python.exe" set "PYTHON_REAL=%%~fD\python.exe"
  )
)

if not defined PYTHON_REAL (
  for /d %%D in ("%ProgramFiles%\Python*") do (
    if exist "%%~fD\python.exe" set "PYTHON_REAL=%%~fD\python.exe"
  )
)

rem Aceitar o PATH somente se nao for o atalho da Microsoft Store
if not defined PYTHON_REAL (
  for /f "delims=" %%P in ('where python.exe 2^>nul') do (
    echo %%P | findstr /i /c:"WindowsApps" >nul
    if errorlevel 1 if not defined PYTHON_REAL set "PYTHON_REAL=%%P"
  )
)

if not defined PYTHON_REAL goto python_nao_encontrado

"%PYTHON_REAL%" %PYTHON_ARGUMENTOS% -c "import sys; print(sys.version)" >nul 2>nul
if errorlevel 1 goto python_nao_encontrado

"%PYTHON_REAL%" %PYTHON_ARGUMENTOS% -m venv .venv
if errorlevel 1 goto erro_ambiente

:ambiente_pronto
set "PYTHON_AMBIENTE=%CD%\.venv\Scripts\python.exe"

"%PYTHON_AMBIENTE%" -m pip install -q -r requirements.txt
if errorlevel 1 goto erro_dependencias

if not exist "frontend\dist\index.html" (
  where npm.cmd >nul 2>nul
  if errorlevel 1 goto node_nao_encontrado
  pushd frontend
  call npm.cmd install
  if errorlevel 1 goto erro_frontend
  call npm.cmd run build
  if errorlevel 1 goto erro_frontend
  popd
)

start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:5050'"
"%PYTHON_AMBIENTE%" backend.py
if errorlevel 1 goto erro_servidor
exit /b 0

:python_nao_encontrado
echo.
echo A instalacao real do Python nao foi localizada.
echo O atalho da Microsoft Store foi ignorado.
echo.
echo Caminhos procurados:
echo %LocalAppData%\Programs\Python
echo %ProgramFiles%\Python
echo PATH do Windows
goto manter_aberto

:node_nao_encontrado
echo.
echo O frontend nao esta compilado e o Node.js nao foi localizado.
goto manter_aberto

:erro_ambiente
echo.
echo O Python foi localizado em:
echo %PYTHON_REAL%
echo Mas nao foi possivel criar o ambiente do sistema.
goto manter_aberto

:erro_dependencias
echo.
echo O ambiente Python foi criado, mas uma dependencia falhou.
echo Executavel usado:
echo %PYTHON_AMBIENTE%
echo.
echo Tentando novamente com a mensagem completa...
"%PYTHON_AMBIENTE%" -m pip install -r requirements.txt
goto manter_aberto

:erro_frontend
popd
echo.
echo Nao foi possivel gerar o frontend.
goto manter_aberto

:erro_servidor
echo.
echo O servidor foi encerrado com erro.
goto manter_aberto

:manter_aberto
echo.
pause
exit /b 1
