import re
file_path = 'e:/AI Whatsapp automation system/services/crm-frontend/src/app/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "'No Google Reviews (4–5★) Found'",
    "'No Google Reviews Found'"
)
content = content.replace(
    "'No Local Store Reviews (1–3★) Found'",
    "'No Private Reviews Found'"
)
content = content.replace(
    "${reviewRatingFilter}★ Filtered",
    "${reviewRatingFilter} Star Filtered"
)
content = content.replace(
    "Google 5★ Boosted",
    "Google 5 Star Boosted"
)
content = content.replace(
    "1-3★ caught privately",
    "1-3 Stars caught privately"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
