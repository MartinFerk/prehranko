@echo off
REM Nastavi e-mail uporabnika
set EMAIL=X@c.com

REM Nastavi ime slike
set IMAGE=m2.jpg

REM Pošlji zahtevo na lokalni strežnik
curl -X POST http://localhost:5000/api/auth/verify -F "email=%EMAIL%" -F "image=@%IMAGE%"

pause
