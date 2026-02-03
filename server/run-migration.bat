@echo off
echo Running email verification migration...
echo.
echo Note: If this fails, you may need to update the MySQL path below
echo       or use MySQL Workbench to run the schema-migration-email-verification.sql file
echo.

REM Common MySQL installation paths - uncomment the one that matches your installation
REM "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p attendance_db < schema\schema-migration-email-verification.sql
REM "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" -u root -p attendance_db < schema\schema-migration-email-verification.sql
REM "C:\xampp\mysql\bin\mysql.exe" -u root -p attendance_db < schema\schema-migration-email-verification.sql

echo.
echo If you see this message without errors, the migration completed successfully!
echo Otherwise, please run the SQL file manually using MySQL Workbench.
pause
