#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

$PgVersion = "18"
$PgBin = "C:\Program Files\PostgreSQL\$PgVersion\bin"
$PgData = "C:\Program Files\PostgreSQL\$PgVersion\data"
$PgHba = Join-Path $PgData "pg_hba.conf"
$ServiceName = "postgresql-x64-$PgVersion"
$DbPassword = "1221"
$DbName = "Guesthouse_db"

if (-not (Test-Path $PgHba)) {
  Write-Error "pg_hba.conf not found at $PgHba. Adjust PgVersion in this script."
}

Write-Host "==> Backing up pg_hba.conf..."
$Backup = "$PgHba.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $PgHba $Backup

try {
  Write-Host "==> Enabling trust auth for localhost (temporary)..."
  $content = Get-Content $PgHba -Raw
  $content = $content -replace '(?m)^host\s+all\s+all\s+127\.0\.0\.1/32\s+\S+', 'host    all             all             127.0.0.1/32            trust'
  $content = $content -replace '(?m)^host\s+all\s+all\s+::1/128\s+\S+', 'host    all             all             ::1/128                 trust'
  Set-Content -Path $PgHba -Value $content -NoNewline

  Write-Host "==> Reloading PostgreSQL..."
  & "$PgBin\pg_ctl.exe" reload -D $PgData

  Start-Sleep -Seconds 2

  Write-Host "==> Setting postgres password to match .env..."
  & "$PgBin\psql.exe" -U postgres -h localhost -d postgres -c "ALTER USER postgres WITH PASSWORD '$DbPassword';"

  Write-Host "==> Creating database $DbName (if missing)..."
  $createDb = "SELECT 1 FROM pg_database WHERE datname = '$DbName'"
  $exists = & "$PgBin\psql.exe" -U postgres -h localhost -d postgres -tAc $createDb
  if ($exists -ne "1") {
    & "$PgBin\psql.exe" -U postgres -h localhost -d postgres -c "CREATE DATABASE `"$DbName`";"
  } else {
    Write-Host "    Database already exists."
  }

  Write-Host "==> Restoring pg_hba.conf security (scram-sha-256)..."
  Copy-Item $Backup $PgHba -Force
  & "$PgBin\pg_ctl.exe" reload -D $PgData

  Start-Sleep -Seconds 2

  Write-Host "==> Testing password authentication..."
  $env:PGPASSWORD = $DbPassword
  & "$PgBin\psql.exe" -U postgres -h localhost -d $DbName -c "SELECT current_database(), current_user;"
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

  Write-Host ""
  Write-Host "SUCCESS! PostgreSQL is ready." -ForegroundColor Green
  Write-Host "Next steps:"
  Write-Host "  cd server"
  Write-Host "  npx prisma migrate dev"
  Write-Host "  npx prisma db seed"
  Write-Host "  npm run dev"
}
catch {
  Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
  if (Test-Path $Backup) {
    Copy-Item $Backup $PgHba -Force
    & "$PgBin\pg_ctl.exe" reload -D $PgData
    Write-Host "Restored pg_hba.conf from backup."
  }
  exit 1
}
