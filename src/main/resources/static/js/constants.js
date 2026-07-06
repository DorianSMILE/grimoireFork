export const GLOBAL_STAT_LABELS = {};
export const GLOBAL_SRC_LABELS = {};
export const javaClassToCode = {};

export async function initMeta() {
    try {
        const [statsRes, srcRes] = await Promise.all([
            globalFetch('/api/meta/stat-types'),
            globalFetch('/api/meta/sources')
        ]);
        if (statsRes.ok) {
            const stats = await statsRes.json();
            stats.forEach(s => GLOBAL_STAT_LABELS[s.name] = s.label);
        }
        if (srcRes.ok) {
            const srcs = await srcRes.json();
            srcs.forEach(s => GLOBAL_SRC_LABELS[s.name] = s.label);
        }
    } catch (e) {
        console.error("Error loading global meta:", e);
    }
}

