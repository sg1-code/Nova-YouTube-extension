:: Created by: raingart
@echo off&cls

set outFile="%temp%\nova-tube.user.js"
del /q %outFile%

(
type .\Userscript\meta.js
type .\Userscript\compatibility.js
type .\Userscript\plugin-container.js

for /f "delims=" %%i in ('dir /b /s .\plugins\*.js ^| findstr /i /v "\\-"') do type "%%i

type .\js\plugins.js
type .\Userscript\user.js

)>%outFile%

start notepad %outFile%

pause
exit
