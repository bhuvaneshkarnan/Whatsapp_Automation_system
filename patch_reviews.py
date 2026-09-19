import re

file_path = 'e:/AI Whatsapp automation system/services/crm-frontend/src/app/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Connect Google button
content = content.replace(
    'className="px-2.5 py-1 bg-surface hover:bg-surface-subtle border border-border hover:border-blue-400 text-text-secondary hover:text-blue-600 rounded-md text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"',
    'className="px-2.5 py-1.5 bg-surface hover:bg-surface-subtle border border-border text-text-primary rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"'
)
content = content.replace(
    '<Globe className="w-3.5 h-3.5 text-blue-500" />',
    '<Globe className="w-3.5 h-3.5 text-text-muted" />'
)

# 2. Copy Link button
content = content.replace(
    'className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"',
    'className="px-2.5 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"'
)

# 3. Open Portal button
content = content.replace(
    'className="p-1 text-text-muted hover:text-text-primary bg-surface hover:bg-surface-subtle rounded-md border border-border transition-colors cursor-pointer"',
    'className="p-1.5 text-text-muted hover:text-text-primary bg-surface hover:bg-surface-subtle rounded-md border border-border transition-colors cursor-pointer shadow-xs"'
)

# 4. QR Standee & Print button
content = content.replace(
    'className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-primary rounded-md border border-border text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"',
    'className="px-2.5 py-1.5 bg-surface hover:bg-surface-subtle text-text-primary rounded-md border border-border text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"'
)
content = content.replace(
    '<QrCode className="w-3.5 h-3.5 text-blue-600 stroke-[2]" />',
    '<QrCode className="w-3.5 h-3.5 text-text-muted" />'
)

# 5. Page Config button
content = content.replace(
    'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700 font-semibold',
    'bg-surface-subtle text-text-primary font-medium'
)
content = content.replace(
    'className={`px-2 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${',
    'className={`px-2.5 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${'
)
content = content.replace(
    '<Tag className="w-3 h-3 text-violet-500" />',
    '<Tag className="w-3.5 h-3.5 text-text-muted" />'
)

# 6. Source Tabs (Google, Private, All)
content = content.replace(
    '<div className="flex items-center p-0.5 bg-surface rounded-md border border-border shrink-0 shadow-2xs">',
    '<div className="flex items-center p-0.5 bg-surface-subtle rounded-md border border-border shrink-0">'
)
# Google Active state
content = content.replace(
    'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700',
    'bg-surface text-text-primary font-medium shadow-xs border-border'
)
# Private Active state
content = content.replace(
    'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-700',
    'bg-surface text-text-primary font-medium shadow-xs border-border'
)
# All Active state
content = content.replace(
    'bg-surface-subtle text-text-primary font-bold border border-border',
    'bg-surface text-text-primary font-medium shadow-xs border-border'
)
# Source tab base classes
content = content.replace(
    'className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${',
    'className={`px-2.5 py-1 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${'
)

# Tab text - fixing exact strings
content = content.replace('<span>Google (4–5★)</span>', '<span>Google</span>')
content = content.replace('<span>Private (1–3★)</span>', '<span>Private</span>')
content = content.replace('<Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />', '<Globe className="w-3.5 h-3.5 text-text-muted" />')
content = content.replace('<Building2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />', '<Building2 className="w-3.5 h-3.5 text-text-muted" />')

# Badges inside tabs
content = content.replace('bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300', 'bg-surface-subtle border border-border text-text-muted')
content = content.replace('bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300', 'bg-surface-subtle border border-border text-text-muted')

# 7. Star Sub-Filters
content = content.replace(
    'className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-0.5 ${',
    'className={`px-2.5 py-1 rounded-sm text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 border ${'
)
content = content.replace(
    "reviewRatingFilter === s ? 'bg-amber-500 text-slate-950 font-bold' : 'text-text-secondary hover:text-text-primary'",
    "reviewRatingFilter === s ? 'bg-surface text-text-primary shadow-xs border-border' : 'text-text-secondary hover:text-text-primary border-transparent'"
)
content = content.replace("{s === 'all' ? 'All★' : (", "{s === 'all' ? 'All Ratings' : (")
content = content.replace('<Star className="w-2.5 h-2.5 fill-current" />', '<Star className="w-3 h-3 text-text-muted fill-transparent" />')

# 8. Reply Status Filter
content = content.replace(
    'className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors cursor-pointer ${',
    'className={`px-2.5 py-1 rounded-sm text-xs font-medium capitalize transition-colors cursor-pointer border ${'
)
content = content.replace(
    "reviewStatusFilter === st ? 'bg-accent text-white font-bold' : 'text-text-secondary hover:text-text-primary'",
    "reviewStatusFilter === st ? 'bg-surface text-text-primary shadow-xs border-border' : 'text-text-secondary hover:text-text-primary border-transparent'"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Patch completed!')
