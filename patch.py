with open(r'e:\AI Whatsapp automation system\services\crm-frontend\src\app\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Initial fetch
content = re.sub(
    r"const \[bData, cData, tData, gData\] = await Promise\.all\(\[\s+crm\.getBookings\(undefined, 500\)\.catch\(\(\) => \[\]\),\s+crm\.getCustomers\(\{ limit: 1000 \}\)\.catch\(\(\) => \[\]\),\s+isMindBodyRecovery \? crm\.getTasks\('all'\)\.catch\(\(\) => \[\]\) : Promise\.resolve\(\[\]\),\s+crm\.getLiveCalendarAvailability\(\)\.catch\(\(\) => null\),\s+\]\);\s+if \(Array\.isArray\(bData\)\) setBookings\(bData\);\s+if \(Array\.isArray\(cData\) && cData\.length > 0\) setCustomers\(cData\);",
    r"""const [bData, cData, tData, gData, statsData] = await Promise.all([
          crm.getBookings(undefined, 500).catch(() => []),
          crm.getCustomers({ limit: 1000 }).catch(() => []),
          isMindBodyRecovery ? crm.getTasks('all').catch(() => []) : Promise.resolve([]),
          crm.getLiveCalendarAvailability().catch(() => null),
          crm.getCustomerStats().catch(() => null),
        ]);
        if (Array.isArray(bData)) setBookings(bData);
        if (Array.isArray(cData) && cData.length > 0) setCustomers(cData);
        if (statsData) setCustomerStats(statsData);""",
    content
)

# LoadCustomers fetch
content = re.sub(
    r"const data = await crm\.getCustomers\(\{\s+status: followupStatusFilter,\s+lead_probability: followupProbabilityFilter,\s+preferred_doctor: depDoctor \|\| followupDoctorFilter,\s+health_concern: depConcern,\s+next_action: followupActionFilter,\s+q: followupSearch,\s+limit: 1000,\s+\}\);\s+const list = Array\.isArray\(data\) \? data : \[\];\s+setCustomers\(list\);",
    r"""const [data, statsData] = await Promise.all([
        crm.getCustomers({
          status: followupStatusFilter,
          lead_probability: followupProbabilityFilter,
          preferred_doctor: depDoctor || followupDoctorFilter,
          health_concern: depConcern,
          next_action: followupActionFilter,
          q: followupSearch,
          limit: 1000,
        }),
        crm.getCustomerStats().catch(() => null)
      ]);
      const list = Array.isArray(data) ? data : [];
      setCustomers(list);
      if (statsData) setCustomerStats(statsData);""",
    content
)

# Interval fetch
content = re.sub(
    r"const fresh = await crm\.getCustomers\(\{\s+status: followupStatusFilter,\s+lead_probability: followupProbabilityFilter,\s+preferred_doctor: followupDoctorFilter,\s+next_action: followupActionFilter,\s+q: followupSearch,\s+limit: 1000,\s+\}\);\s+if \(isMounted\) \{\s+const freshList = Array\.isArray\(fresh\) \? fresh : \[\];\s+setCustomers\(freshList\);",
    r"""const [fresh, statsData] = await Promise.all([
              crm.getCustomers({
                status: followupStatusFilter,
                lead_probability: followupProbabilityFilter,
                preferred_doctor: followupDoctorFilter,
                next_action: followupActionFilter,
                q: followupSearch,
                limit: 1000,
              }),
              crm.getCustomerStats().catch(() => null)
            ]);
            if (isMounted) {
              const freshList = Array.isArray(fresh) ? fresh : [];
              setCustomers(freshList);
              if (statsData) setCustomerStats(statsData);""",
    content
)

# UI block
content = re.sub(
    r'<div className="flex items-center gap-1\.5">\s+<Users className="w-3\.5 h-3\.5 text-text-muted stroke-\[1\.8\]" />\s+<span className="text-\[11px\] text-text-muted">Total:</span>\s+<span className="font-bold text-text-primary font-mono text-xs">\{customers\.length\}</span>\s+</div>\s+<span className="text-border text-xs hidden sm:inline">•</span>\s+<div className="flex items-center gap-1\.5">\s+<Clock3 className="w-3\.5 h-3\.5 text-amber-600 stroke-\[1\.8\]" />\s+<span className="text-\[11px\] text-amber-800 font-medium">Pending:</span>\s+<span className="font-bold text-amber-900 font-mono text-xs">\s+\{customers\.filter\(c => c\.status === \'follow-up\' \|\| c\.status === \'new\'\)\.length\}\s+</span>\s+</div>\s+<span className="text-border text-xs hidden sm:inline">•</span>\s+<div className="flex items-center gap-1\.5">\s+<Flame className="w-3\.5 h-3\.5 text-rose-500 fill-rose-500/20 stroke-\[1\.8\]" />\s+<span className="text-\[11px\] text-rose-700 font-medium">Hot Leads:</span>\s+<span className="font-bold text-rose-900 font-mono text-xs">\s+\{customers\.filter\(c => c\.lead_probability === \'hot\'\)\.length\}\s+</span>\s+</div>\s+<span className="text-border text-xs hidden sm:inline">•</span>\s+<div className="flex items-center gap-1\.5">\s+<CheckCircle2 className="w-3\.5 h-3\.5 text-emerald-600 stroke-\[1\.8\]" />\s+<span className="text-\[11px\] text-emerald-700 font-medium">Converted:</span>\s+<span className="font-bold text-emerald-900 font-mono text-xs flex items-center gap-1">\s+\{customers\.filter\(c => c\.status === \'converted\' \|\| c\.converted\)\.length\}\s+<span className="text-\[9px\] text-emerald-700/80 font-semibold tracking-tighter">\s+\(\{Math\.round\(\(customers\.filter\(c => c\.status === \'converted\' \|\| c\.converted\)\.length / \(customers\.length \|\| 1\)\) \* 100\)\}%\)\s+</span>\s+</span>\s+</div>',
    r"""<div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-text-muted stroke-[1.8]" />
                            <span className="text-[11px] text-text-muted">Total:</span>
                            <span className="font-bold text-text-primary font-mono text-xs">{customerStats?.total ?? customers.length}</span>
                          </div>
                          <span className="text-border text-xs hidden sm:inline">•</span>
                          <div className="flex items-center gap-1.5">
                            <Clock3 className="w-3.5 h-3.5 text-amber-600 stroke-[1.8]" />
                            <span className="text-[11px] text-amber-800 font-medium">Pending:</span>
                            <span className="font-bold text-amber-900 font-mono text-xs">
                              {customerStats?.pending ?? customers.filter(c => c.status === 'follow-up' || c.status === 'new').length}
                            </span>
                          </div>
                          <span className="text-border text-xs hidden sm:inline">•</span>
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20 stroke-[1.8]" />
                            <span className="text-[11px] text-rose-700 font-medium">Hot Leads:</span>
                            <span className="font-bold text-rose-900 font-mono text-xs">
                              {customerStats?.hot_leads ?? customers.filter(c => c.lead_probability === 'hot').length}
                            </span>
                          </div>
                          <span className="text-border text-xs hidden sm:inline">•</span>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[1.8]" />
                            <span className="text-[11px] text-emerald-700 font-medium">Converted:</span>
                            <span className="font-bold text-emerald-900 font-mono text-xs flex items-center gap-1">
                              {customerStats?.converted ?? customers.filter(c => c.status === 'converted' || c.converted).length}
                              <span className="text-[9px] text-emerald-700/80 font-semibold tracking-tighter">
                                ({customerStats ? Math.round((customerStats.converted / (customerStats.total || 1)) * 100) : Math.round((customers.filter(c => c.status === 'converted' || c.converted).length / (customers.length || 1)) * 100)}%)
                              </span>
                            </span>
                          </div>""",
    content
)

with open(r'e:\AI Whatsapp automation system\services\crm-frontend\src\app\dashboard\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated with regex")
