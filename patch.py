import re

file_path = 'e:/AI Whatsapp automation system/services/crm-frontend/src/app/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Standard Shopify-like Card layout class for standard views
std_class = 'flex-1 flex flex-col overflow-y-auto space-y-4 bg-surface border border-border shadow-sm rounded-xl p-4 sm:p-5'
std_hidden_class = 'flex-1 flex flex-col overflow-hidden space-y-4 bg-surface border border-border shadow-sm rounded-xl p-4 sm:p-5'

# Replace View 0-A
content = re.sub(
    r'(\{\s*/\*\s*-- VIEW 0-A.*?\n\s*\{activeNav === \'overview\' && settingsForm.plan === \'review_only\' && \(\n\s*)<div className=\"flex-1 flex flex-col overflow-y-auto space-y-[^\"]+\">',
    r'\g<1><div className=\"' + std_class + '\">',
    content
)

# Replace View 0-B
content = re.sub(
    r'(\{\s*/\*\s*-- VIEW 0-B.*?\n\s*\{activeNav === \'overview\' && settingsForm.plan !== \'review_only\' && \(\n\s*)<div className=\"flex-1 flex flex-col overflow-y-auto space-y-[^\"]+\">',
    r'\g<1><div className=\"' + std_class + '\">',
    content
)

# Replace View 1
content = re.sub(
    r'(\{\s*/\*\s*-- VIEW 1: BOOKINGS.*?\n\s*\{activeNav === \'bookings\' && \(\n\s*)<div className=\"flex-1 flex flex-col overflow-hidden space-y-[^\"]+\">',
    r'\g<1><div className=\"' + std_hidden_class + '\">',
    content
)

# Replace View 2
content = re.sub(
    r'(\{\s*/\*\s*-- VIEW 2: CALENDAR.*?\n\s*\{activeNav === \'calendar\' && \(\n\s*)<div className=\"flex-1 flex flex-col overflow-hidden space-y-[^\"]+\">',
    r'\g<1><div className=\"' + std_hidden_class + '\">',
    content
)

# Replace View 3
content = re.sub(
    r'(\{\s*/\*\s*-- VIEW 3: INBOX.*?\n\s*\{activeNav === \'inbox\' && \(\n\s*)<div className=\"flex-1 flex overflow-hidden border border-border md:rounded-md bg-surface h-full\">',
    r'\g<1><div className=\"flex-1 flex overflow-hidden border border-border shadow-sm md:rounded-xl bg-surface h-full\">',
    content
)

# Replace View 5 (Reviews and Settings)
content = re.sub(
    r'(\{activeNav === \'reviews\' && \(\n\s*)<div className=\"flex-1 flex flex-col min-h-0 overflow-y-auto space-y-[^\"]+\">',
    r'\g<1><div className=\"' + std_class + ' min-h-0\">',
    content
)
content = re.sub(
    r'(\{activeNav === \'settings\' && \(\n\s*)<div className=\"flex-1 overflow-y-auto space-y-[^\"]+\">',
    r'\g<1><div className=\"' + std_class.replace('flex flex-col ', '') + '\">',
    content
)

# Replace View 6
content = re.sub(
    r'(\{activeNav === \'marketing\' && canManageMarketing && \(settingsForm.plan !== \'review_only\'\) && \(\n\s*)<div className=\"flex-1 flex flex-col overflow-y-auto space-y-[^\"]+\">',
    r'\g<1><div className=\"' + std_class + ' max-w-7xl mx-auto w-full\">',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
