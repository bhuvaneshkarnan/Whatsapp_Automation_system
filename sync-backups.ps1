# ==============================================================================
# WhatsApp CRM Platform - Automated Database Backup & Local PC Sync
# ==============================================================================

param (
    [switch]$ForceFreshDump = $true
)

$ErrorActionPreference = "Stop"

# Configuration
$VpsIp = "168.138.172.197"
$VpsUser = "ubuntu"
$SshKey = Join-Path $HOME ".ssh\oracle_vps.key"
$LocalBackupDir = "E:\AI Whatsapp automation system\backups"

# Ensure local backup directory exists
if (-not (Test-Path -Path $LocalBackupDir)) {
    New-Item -ItemType Directory -Path $LocalBackupDir -Force | Out-Null
    Write-Host "[INIT] Created local backup directory: $LocalBackupDir" -ForegroundColor Cyan
}

Write-Host "================================================================================" -ForegroundColor Green
Write-Host "  WHATSAPP CRM - DATABASE BACKUP & LOCAL PC SYNC" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green

# 1. Trigger fresh backup on VPS if requested
if ($ForceFreshDump) {
    Write-Host "[1/3] Triggering fresh database dump on VPS ($VpsIp)..." -ForegroundColor Yellow
    $triggerCmd = "ssh -i `"$SshKey`" -o StrictHostKeyChecking=no ${VpsUser}@${VpsIp} `"/home/ubuntu/scripts/backup_db.sh`""
    Invoke-Expression $triggerCmd
}

# 2. Download the latest backup from the VPS
Write-Host "`n[2/3] Securely downloading latest backup to your local PC..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

$targetEncFile = Join-Path $LocalBackupDir "whatsapp_platform_$timestamp.sql.gz.enc"
$scpEncCmd = "scp -i `"$SshKey`" ${VpsUser}@${VpsIp}:/home/ubuntu/backups/latest.sql.gz.enc `"$targetEncFile`""

try {
    Invoke-Expression $scpEncCmd 2>$null
} catch {
    # Fallback handled below
}

$targetFile = $targetEncFile
$isEncrypted = $true

if (-not (Test-Path -Path $targetEncFile) -or (Get-Item $targetEncFile).Length -lt 200) {
    # Fallback to standard .sql.gz if server hasn't created an encrypted dump yet
    Remove-Item $targetEncFile -ErrorAction SilentlyContinue
    $targetFile = Join-Path $LocalBackupDir "whatsapp_platform_$timestamp.sql.gz"
    $scpCmd = "scp -i `"$SshKey`" ${VpsUser}@${VpsIp}:/home/ubuntu/backups/latest.sql.gz `"$targetFile`""
    Invoke-Expression $scpCmd
    $isEncrypted = $false
}

# 3. Verify downloaded backup
Write-Host "`n[3/3] Verifying downloaded backup file..." -ForegroundColor Yellow
if (Test-Path -Path $targetFile) {
    $fileItem = Get-Item $targetFile
    $sizeKb = [math]::Round($fileItem.Length / 1KB, 2)
    if ($fileItem.Length -gt 1000) {
        Write-Host "================================================================================" -ForegroundColor Green
        Write-Host "  SUCCESS: DATABASE BACKUP STORED ON YOUR LOCAL PC!" -ForegroundColor Green
        Write-Host "  File Name: $($fileItem.Name)" -ForegroundColor White
        Write-Host "  Location:  $($fileItem.FullName)" -ForegroundColor White
        Write-Host "  Size:      $sizeKb KB" -ForegroundColor White
        Write-Host "  Timestamp: $($fileItem.CreationTime)" -ForegroundColor White
        Write-Host "================================================================================" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Downloaded file is unexpectedly small ($($fileItem.Length) bytes). Please verify server logs." -ForegroundColor Red
    }
} else {
    Write-Host "[ERROR] Failed to download backup file to $targetFile" -ForegroundColor Red
}
