export const GLOBAL_STAT_LABELS = {};
export const GLOBAL_SRC_LABELS = {};
export const javaClassToCode = {};

export const STAT_DEFS = [
    { key: 'bonusHealthMax', label: 'PV', icon: 'favorite', color: '#ec4899' },
    { key: 'bonusManaMax', label: 'Mana', icon: 'water_drop', color: '#38bdf8' },
    { key: 'bonusPower', label: 'Pui', icon: 'auto_awesome', color: '#a855f7' },
    { key: 'bonusStrength', label: 'For', icon: 'fitness_center', color: '#f43f5e' },
    { key: 'bonusArmor', label: 'Arm', icon: 'shield', color: '#3b82f6' },
    { key: 'bonusResistance', label: 'Rés', icon: 'shield', color: '#10b981' },
    { key: 'bonusSpeed', label: 'Vit', icon: 'bolt', color: '#f59e0b' },
    { key: 'bonusCrit', label: 'Crit', icon: 'gps_fixed', color: '#ef4444' },
    { key: 'regenHealthPerTurn', label: 'PV/t', icon: 'healing', color: '#10b981' },
    { key: 'regenManaPerTurn', label: 'Mana/t', icon: 'cyclone', color: '#38bdf8' },
    { key: 'consumableHpPercent', label: 'PV Max', icon: 'favorite', color: '#ec4899', isPercent: true },
    { key: 'consumableManaPercent', label: 'Mana Max', icon: 'water_drop', color: '#38bdf8', isPercent: true },
    { key: 'consumableMissingHpPercent', label: 'PV Manq', icon: 'healing', color: '#f43f5e', isPercent: true },
    { key: 'consumableMissingManaPercent', label: 'Mana Manq', icon: 'cyclone', color: '#a855f7', isPercent: true }
];

window.STAT_DEFS = STAT_DEFS;

export const WEIGHT_LIMITS = {
    CASQUE: { COMMUN: 5, INHABITUEL: 9, RARE: 14, MYTHIQUE: 18, LEGENDAIRE: 22, EPIQUE: 35, RELIQUE: 40, MAUDIT: 27 },
    PLASTRON: { COMMUN: 9, INHABITUEL: 14, RARE: 19, MYTHIQUE: 24, LEGENDAIRE: 29, EPIQUE: 40, RELIQUE: 46, MAUDIT: 35 },
    ANNEAU_GAUCHE: { COMMUN: 3, INHABITUEL: 4, RARE: 6, MYTHIQUE: 8, LEGENDAIRE: 10, EPIQUE: 15, RELIQUE: 17, MAUDIT: 12 },
    ANNEAU_DROIT: { COMMUN: 3, INHABITUEL: 4, RARE: 6, MYTHIQUE: 8, LEGENDAIRE: 10, EPIQUE: 15, RELIQUE: 17, MAUDIT: 12 },
    BOTTES: { COMMUN: 4, INHABITUEL: 8, RARE: 12, MYTHIQUE: 15, LEGENDAIRE: 19, EPIQUE: 30, RELIQUE: 34, MAUDIT: 25 },
    CAPE: { COMMUN: 5, INHABITUEL: 9, RARE: 14, MYTHIQUE: 18, LEGENDAIRE: 22, EPIQUE: 35, RELIQUE: 40, MAUDIT: 27 },
    ARME_DEUX_MAINS: { COMMUN: 9, INHABITUEL: 14, RARE: 19, MYTHIQUE: 24, LEGENDAIRE: 29, EPIQUE: 40, RELIQUE: 46, MAUDIT: 35 },
    ARME_GAUCHE: { COMMUN: 5, INHABITUEL: 7, RARE: 10, MYTHIQUE: 12, LEGENDAIRE: 15, EPIQUE: 20, RELIQUE: 23, MAUDIT: 18 },
    ARME_DROITE: { COMMUN: 5, INHABITUEL: 7, RARE: 10, MYTHIQUE: 12, LEGENDAIRE: 15, EPIQUE: 20, RELIQUE: 23, MAUDIT: 18 },
    CONSOMMABLE: { COMMUN: 5, INHABITUEL: 7, RARE: 9, MYTHIQUE: 11, LEGENDAIRE: 14, EPIQUE: 20, RELIQUE: 24, MAUDIT: 17 }
};

window.WEIGHT_LIMITS = WEIGHT_LIMITS;

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

