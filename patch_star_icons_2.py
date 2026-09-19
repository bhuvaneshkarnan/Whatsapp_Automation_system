import re
file_path = 'e:/AI Whatsapp automation system/services/crm-frontend/src/app/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'fill-amber-400 text-amber-500',
    'text-text-primary'
)
content = content.replace(
    'fill-amber-400 stroke-[1.5]',
    'text-text-muted stroke-[1.5]'
)
# But restore for the actual rating stars:
content = content.replace(
    "i<(rev.rating||0)?'text-text-primary':'text-border'",
    "i<(rev.rating||0)?'fill-amber-400 text-amber-500':'text-border'"
)
content = content.replace(
    "i < (activeReplyReview.rating || 0) ? 'text-text-primary' : 'text-border'",
    "i < (activeReplyReview.rating || 0) ? 'fill-amber-400 text-amber-500' : 'text-border'"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
