import re

file_path = 'e:/AI Whatsapp automation system/services/crm-frontend/src/app/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

std_class = 'flex-1 flex flex-col overflow-y-auto space-y-4 bg-surface border border-border shadow-sm rounded-xl p-4 sm:p-5'
std_hidden_class = 'flex-1 flex flex-col overflow-hidden space-y-4 bg-surface border border-border shadow-sm rounded-xl p-4 sm:p-5'

content = content.replace(
    "{activeNav === 'overview' && settingsForm.plan === 'review_only' && (\n              <div className=\"flex-1 flex flex-col overflow-y-auto space-y-3.5 pr-1\">",
    "{activeNav === 'overview' && settingsForm.plan === 'review_only' && (\n              <div className=\"" + std_class + "\">"
)

content = content.replace(
    "{activeNav === 'overview' && settingsForm.plan !== 'review_only' && (\n              <div className=\"flex-1 flex flex-col overflow-y-auto space-y-6 pr-1\">",
    "{activeNav === 'overview' && settingsForm.plan !== 'review_only' && (\n              <div className=\"" + std_class + "\">"
)

content = content.replace(
    "{activeNav === 'bookings' && (\n              <div className=\"flex-1 flex flex-col overflow-hidden space-y-4\">",
    "{activeNav === 'bookings' && (\n              <div className=\"" + std_hidden_class + "\">"
)

content = content.replace(
    "{activeNav === 'calendar' && (\n              <div className=\"flex-1 flex flex-col overflow-hidden space-y-3\">",
    "{activeNav === 'calendar' && (\n              <div className=\"" + std_hidden_class + "\">"
)

content = content.replace(
    "{activeNav === 'inbox' && (\n              <div className=\"flex-1 flex overflow-hidden border border-border md:rounded-md bg-surface h-full\">",
    "{activeNav === 'inbox' && (\n              <div className=\"flex-1 flex overflow-hidden border border-border shadow-sm md:rounded-xl bg-surface h-full\">"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
