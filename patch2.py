import re

with open(r'e:\AI Whatsapp automation system\services\crm-frontend\src\app\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# LoadCustomers fetch
target_refetch1 = """      const data = await crm.getCustomers({
        status: followupStatusFilter,
        lead_probability: followupProbabilityFilter,
        preferred_doctor: depDoctor || followupDoctorFilter,
        health_concern: depConcern,
        next_action: followupActionFilter,
        q: followupSearch,
        limit: 1000,
      });
      if (Array.isArray(data)) {"""

replacement_refetch1 = """      const [data, statsData] = await Promise.all([
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
      if (statsData) setCustomerStats(statsData);
      if (Array.isArray(data)) {"""
content = content.replace(target_refetch1, replacement_refetch1)

# Interval fetch
target_refetch2 = """            const fresh = await crm.getCustomers({
              status: followupStatusFilter,
              lead_probability: followupProbabilityFilter,
              preferred_doctor: followupDoctorFilter,
              next_action: followupActionFilter,
              q: followupSearch,
              limit: 1000,
            });
            if (isMounted) {
              if (Array.isArray(fresh)) {"""

replacement_refetch2 = """            const [fresh, statsData] = await Promise.all([
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
              if (statsData) setCustomerStats(statsData);
              if (Array.isArray(fresh)) {"""
content = content.replace(target_refetch2, replacement_refetch2)

# UI block
target_ui = """                        <div className="flex items-center gap-3.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-text-muted stroke-[1.8]" />
                            <span className="text-[11px] text-text-muted">Total:</span>
                            <span className="font-bold text-text-primary font-mono text-xs">{customers.length}</span>
                          </div>
                          <span className="text-border text-xs hidden sm:inline">•</span>
                          <div className="flex items-center gap-1.5">
                            <Clock3 className="w-3.5 h-3.5 text-amber-600 stroke-[1.8]" />
                            <span className="text-[11px] text-amber-800 font-medium">Pending:</span>
                            <span className="font-bold text-amber-900 font-mono text-xs">
                              {customers.filter(c => c.status === 'follow-up' || c.status === 'new').length}
                            </span>
                          </div>
                          <span className="text-border text-xs hidden sm:inline">•</span>
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20 stroke-[1.8]" />
                            <span className="text-[11px] text-rose-700 font-medium">Hot Leads:</span>
                            <span className="font-bold text-rose-900 font-mono text-xs">
                              {customers.filter(c => c.lead_probability === 'hot').length}
                            </span>
                          </div>
                          <span className="text-border text-xs hidden sm:inline">•</span>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[1.8]" />
                            <span className="text-[11px] text-emerald-700 font-medium">Converted:</span>
                            <span className="font-bold text-emerald-900 font-mono text-xs flex items-center gap-1">
                              {customers.filter(c => c.status === 'converted' || c.converted).length}
                              <span className="text-[9px] text-emerald-700/80 font-semibold tracking-tighter">
                                ({Math.round((customers.filter(c => c.status === 'converted' || c.converted).length / (customers.length || 1)) * 100)}%)
                              </span>
                            </span>
                          </div>
                        </div>"""

replacement_ui = """                        <div className="flex items-center gap-3.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
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
                          </div>
                        </div>"""
content = content.replace(target_ui, replacement_ui)

with open(r'e:\AI Whatsapp automation system\services\crm-frontend\src\app\dashboard\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied!")
