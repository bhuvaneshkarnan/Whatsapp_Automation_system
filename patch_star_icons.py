import re
file_path = 'e:/AI Whatsapp automation system/services/crm-frontend/src/app/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Sidebar nav review icon
content = content.replace(
    "text-amber-500 fill-amber-400",
    "text-text-primary"
)
# View 0-A header review icon
content = content.replace(
    "text-amber-500 fill-amber-400 stroke-[1.8]",
    "text-text-primary stroke-[1.5]"
)
# View 5 Reviews header
content = content.replace(
    "text-amber-500 fill-amber-400 stroke-[1.5]",
    "text-text-primary stroke-[1.5]"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
