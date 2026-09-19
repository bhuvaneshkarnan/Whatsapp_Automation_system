import re
file_path = 'e:/AI Whatsapp automation system/services/crm-frontend/src/app/dashboard/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\\">', '">')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed closing quotes!')
