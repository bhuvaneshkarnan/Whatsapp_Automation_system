# ==============================================================================
# WhatsApp CRM Platform - Automated Database Backup & Local PC Sync
# Zero Server Disk Space: Dump -> Download to PC -> Purge from VPS immediately
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
$LogFile = Join-Path $LocalBackupDir "backup_sync.log"

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $Message"
    Write-Host $line -ForegroundColor $Color
    try {
        Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
    } catch {}
}

# Ensure local backup directory exists
if (-not (Test-Path -Path $LocalBackupDir)) {
    New-Item -ItemType Directory -Path $LocalBackupDir -Force | Out-Null
}

Write-Log "================================================================================" "Green"
Write-Log "  WHATSAPP CRM - DATABASE BACKUP & LOCAL PC SYNC (ZERO SERVER FOOTPRINT)" "Green"
Write-Log "================================================================================" "Green"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$targetLocalFile = Join-Path $LocalBackupDir "whatsapp_platform_$timestamp.sql.gz"
$remoteTempFile = "/home/ubuntu/backups/whatsapp_sync_$timestamp.sql.gz"

try {
    # 1. Trigger database dump directly on VPS to temporary file
    Write-Log "[1/4] Triggering fresh database dump on VPS ($VpsIp)..." "Yellow"
    $dumpCmd = "ssh -i `"$SshKey`" -o StrictHostKeyChecking=no ${VpsUser}@${VpsIp} `"mkdir -p /home/ubuntu/backups && docker exec whatsapp-app-postgres-1 pg_dump -U platform_user whatsapp_platform | gzip > $remoteTempFile && ls -lh $remoteTempFile`""
    $dumpOutput = Invoke-Expression $dumpCmd 2>&1
    Write-Log "VPS Dump output: $dumpOutput" "Gray"

    # 2. Download backup to local PC via SCP
    Write-Log "[2/4] Securely downloading backup to local PC..." "Yellow"
    $scpCmd = "scp -i `"$SshKey`" -o StrictHostKeyChecking=no ${VpsUser}@${VpsIp}:${remoteTempFile} `"$targetLocalFile`""
    Invoke-Expression $scpCmd

    # 3. Verify downloaded file on PC
    Write-Log "[3/4] Verifying local backup file..." "Yellow"
    if ((Test-Path -Path $targetLocalFile) -and ((Get-Item $targetLocalFile).Length -gt 1000)) {
        $fileItem = Get-Item $targetLocalFile
        $sizeKb = [math]::Round($fileItem.Length / 1KB, 2)
        Write-Log "SUCCESS: Local backup verified: $($fileItem.Name) ($sizeKb KB)" "Green"

        # 4. Clean up VPS immediately so ZERO server disk space is occupied
        Write-Log "[4/4] Purging backup from VPS to keep server disk completely clean..." "Cyan"
        $cleanCmd = "ssh -i `"$SshKey`" -o StrictHostKeyChecking=no ${VpsUser}@${VpsIp} `"rm -f /home/ubuntu/backups/*.sql.gz* && echo VPS_CLEAN`""
        $cleanRes = Invoke-Expression $cleanCmd 2>&1
        Write-Log "VPS Cleanup: $cleanRes" "Cyan"

        # Local retention: rotate local backups older than 30 days
        Get-ChildItem -Path $LocalBackupDir -Filter "whatsapp_platform_*.sql.gz" |
            Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
            ForEach-Object {
                Write-Log "Rotating local archive older than 30 days: $($_.Name)" "Gray"
                Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
            }

        Write-Log "================================================================================" "Green"
        Write-Log "  BACKUP COMPLETED: Stored on your PC only: $($fileItem.FullName)" "Green"
        Write-Log "================================================================================" "Green"
    } else {
        Write-Log "ERROR: Backup download failed or file is too small!" "Red"
        throw "Backup verification failed."
    }
} catch {
    Write-Log "FATAL ERROR during backup: $_" "Red"
    throw $_
}
