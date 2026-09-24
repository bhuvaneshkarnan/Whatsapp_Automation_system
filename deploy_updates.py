import os
import subprocess
import tarfile

key_path = os.path.expanduser('~/.ssh/oracle_vps.key')
vps_host = 'ubuntu@168.138.172.197'
remote_dir = '/home/ubuntu/whatsapp-app'
archive_name = 'patch_deploy.tar.gz'

print('[1/4] Creating patch tar archive...')
with tarfile.open(archive_name, 'w:gz') as tar:
    # Services core-worker, crm-api, auth-service, frontend_dist, and nginx.conf
    tar.add('services/core-worker', arcname='services/core-worker')
    tar.add('services/crm-api', arcname='services/crm-api')
    tar.add('services/auth-service', arcname='services/auth-service')
    tar.add('infrastructure/nginx/nginx.conf', arcname='infrastructure/nginx/nginx.conf')
    tar.add('frontend_dist', arcname='frontend_dist')

print(f'Archive created: {archive_name} ({os.path.getsize(archive_name)} bytes)')

print('[2/4] Uploading archive to VPS...')
scp_cmd = [
    'scp', '-i', key_path, '-o', 'StrictHostKeyChecking=no',
    archive_name, f'{vps_host}:{remote_dir}/{archive_name}'
]
res = subprocess.run(scp_cmd, capture_output=True, text=True)
if res.returncode != 0:
    print('SCP Failed:', res.stderr)
    exit(1)
print('Upload complete.')

print('[3/4] Extracting archive and restarting backend-monolith on VPS...')
remote_bash = f'''
set -e
cd {remote_dir}
tar -xzf {archive_name}
rm -f {archive_name}
docker restart whatsapp-app-backend-monolith-1
docker exec whatsapp-app-nginx-1 nginx -s reload || true
echo "RESTART_COMPLETE"
'''
ssh_cmd = [
    'ssh', '-i', key_path, '-o', 'StrictHostKeyChecking=no',
    vps_host, remote_bash
]
res = subprocess.run(ssh_cmd, capture_output=True, text=True)
print(res.stdout)
if res.stderr:
    print('Remote stderr:', res.stderr)

if os.path.exists(archive_name):
    os.remove(archive_name)

print('[4/4] Checking backend status...')
check_cmd = [
    'ssh', '-i', key_path, '-o', 'StrictHostKeyChecking=no',
    vps_host, 'docker ps --filter "name=whatsapp-app-backend-monolith-1"'
]
res = subprocess.run(check_cmd, capture_output=True, text=True)
print(res.stdout)
print('Deployment finished successfully.')
