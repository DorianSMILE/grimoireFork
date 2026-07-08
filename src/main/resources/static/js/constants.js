export const GLOBAL_STAT_LABELS = {};
export const GLOBAL_SRC_LABELS = {};
export const javaClassToCode = {};

export async function initMeta() {
    if (window.GRIMOIRE_META) return;
    try {
        const res = await globalFetch('/api/meta/all');
        if (res && res.ok) {
            const allMeta = await res.json();
            window.GRIMOIRE_META = allMeta;
            
            // Retro-compatibility
            if (allMeta.statTypes) {
                allMeta.statTypes.forEach(s => GLOBAL_STAT_LABELS[s.name] = s.label);
            }
            if (allMeta.sources) {
                allMeta.sources.forEach(s => GLOBAL_SRC_LABELS[s.name] = s.label);
            }
            
            // Build Quick Access Maps
            window.SLOT_LABELS = {};
            if (allMeta.equipmentSlots) {
                allMeta.equipmentSlots.forEach(s => {
                    window.SLOT_LABELS[s.name] = { label: s.label, icon: s.icon, color: s.color || '#ef4444', extraClass: s.extraClass || '' };
                });
                window.SLOT_LABELS['ANOMALIE'] = { label: 'Anomalie', icon: 'auto_awesome', color: '#f59e0b', extraClass: '' };
            }
            
            window.CONSUMABLE_CATEGORIES = {};
            if (allMeta.consumableCategories) {
                allMeta.consumableCategories.forEach(c => {
                    window.CONSUMABLE_CATEGORIES[c.name] = { label: c.label, icon: c.icon, color: c.color || '#854c4c' };
                });
            }
            
            window.CATEGORY_ICONS = {};
            if (allMeta.anomalieCategories) {
                allMeta.anomalieCategories.forEach(c => {
                    window.CATEGORY_ICONS[c.name] = c.icon;
                });
            }
        }
    } catch (e) {
        console.error("Error loading global meta:", e);
    }
}

