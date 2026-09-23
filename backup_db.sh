#!/usr/bin/env bash
set -eo pipefail

BACKUP_DIR="/home/ubuntu/backups"
KEY_FILE="/home/ubuntu/.backup_key"
mkdir -p "${BACKUP_DIR}"

# Ensure AES-256 encryption key exists with restricted permissions
if [ ! -f "${KEY_FILE}" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Generating dedicated 256-bit backup encryption key..."
    openssl rand -hex 32 > "${KEY_FILE}"
    chmod 600 "${KEY_FILE}"
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/whatsapp_platform_${TIMESTAMP}.sql.gz.enc"
LATEST_LINK="${BACKUP_DIR}/latest.sql.gz.enc"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting automated encrypted database backup..."

# Locate postgres container dynamically
PG_CONTAINER=$(docker ps -q -f name=postgres | head -n 1)
if [ -z "${PG_CONTAINER}" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: PostgreSQL container is not running!" >&2
    exit 1
fi

# Execute pg_dump, compress with gzip, and encrypt with AES-256-CBC
docker exec "${PG_CONTAINER}" pg_dump -U platform_user whatsapp_platform \
    | gzip \
    | openssl enc -aes-256-cbc -salt -pbkdf2 -pass file:"${KEY_FILE}" \
    > "${BACKUP_FILE}"

# Verify backup size
FILESIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null)
if [ "${FILESIZE}" -lt 1000 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Encrypted backup file is too small (${FILESIZE} bytes), possible dump failure!" >&2
    exit 1
fi

# Update symlink to latest backup
ln -sf "${BACKUP_FILE}" "${LATEST_LINK}"

HUMAN_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup encrypted & completed successfully: ${BACKUP_FILE} (${HUMAN_SIZE})"

# Retention policy: remove backups older than 14 days
find "${BACKUP_DIR}" -type f -name "whatsapp_platform_*.sql.gz*" -mtime +14 -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Old backups rotated (retention: 14 days)."
