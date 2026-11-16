package generation.grimoire.service.equipment;

import generation.grimoire.dto.equipment.EquipmentStatsSnapshotDTO;
import generation.grimoire.entity.Equipment;
import generation.grimoire.enumeration.EquipmentEffectType;
import generation.grimoire.enumeration.EquipmentRarity;
import generation.grimoire.enumeration.EquipmentSlot;

import java.util.EnumMap;
import java.util.Map;

/**
 * Moteur SSOT de scaling des statistiques d'équipement selon le palier d'éveil (+0 à +5),
 * la rareté et la matrice d'affinité (Slot x Stat).
 * Utilisable à la fois depuis les services Spring et depuis les entités/helpers statiques.
 */
public final class EquipmentScalingHelper {

    public static final int MAX_UPGRADE_LEVEL = 5;

    public enum ScalingStat {
        HEALTH, MANA, OFFENSE, DEFENSE, SPEED, CRIT, REGEN_HP, REGEN_MANA
    }

    private record RarityRates(double rPos, double rNeg, double rEff) {}

    private static final Map<EquipmentRarity, RarityRates> RARITY_RATES = new EnumMap<>(EquipmentRarity.class);
    private static final Map<EquipmentSlot, Map<ScalingStat, Double>> SLOT_AFFINITY = new EnumMap<>(EquipmentSlot.class);

    static {
        RARITY_RATES.put(EquipmentRarity.LEGENDAIRE, new RarityRates(0.08, 0.04, 0.00));
        RARITY_RATES.put(EquipmentRarity.EPIQUE,     new RarityRates(0.10, 0.05, 0.04));
        RARITY_RATES.put(EquipmentRarity.RELIQUE,    new RarityRates(0.12, 0.06, 0.05));
        RARITY_RATES.put(EquipmentRarity.MAUDIT,     new RarityRates(0.14, 0.07, 0.05));

        registerAffinity(EquipmentSlot.ARME_DEUX_MAINS, 0.85, 0.85, 1.25, 0.75, 0.70, 0.90, 0.90, 0.90);
        registerAffinity(EquipmentSlot.ARME_GAUCHE,     0.95, 0.95, 1.20, 0.95, 0.80, 0.90, 0.95, 0.95);
        registerAffinity(EquipmentSlot.ARME_DROITE,     1.20, 0.95, 0.85, 1.40, 0.80, 0.80, 1.15, 0.80);
        registerAffinity(EquipmentSlot.PLASTRON,        0.75, 0.85, 0.75, 0.85, 0.65, 0.65, 1.10, 0.85);
        registerAffinity(EquipmentSlot.CASQUE,          0.80, 0.95, 0.85, 0.90, 0.75, 0.75, 0.90, 0.90);
        registerAffinity(EquipmentSlot.ANNEAU,          0.85, 0.80, 0.95, 0.85, 0.65, 0.75, 0.85, 0.50);
        registerAffinity(EquipmentSlot.ANNEAU_GAUCHE,   0.85, 0.80, 0.95, 0.85, 0.65, 0.75, 0.85, 0.50);
        registerAffinity(EquipmentSlot.ANNEAU_DROIT,    0.85, 0.80, 0.95, 0.85, 0.65, 0.75, 0.85, 0.50);
        registerAffinity(EquipmentSlot.BOTTES,          0.80, 0.85, 0.85, 1.00, 0.60, 0.80, 0.85, 0.85);
        registerAffinity(EquipmentSlot.CAPE,            0.75, 0.95, 0.90, 0.95, 0.75, 0.75, 0.90, 0.65);
    }

    private static void registerAffinity(EquipmentSlot slot, double hp, double mana, double offense,
                                         double defense, double speed, double crit, double regHp, double regMana) {
        Map<ScalingStat, Double> m = new EnumMap<>(ScalingStat.class);
        m.put(ScalingStat.HEALTH, hp);
        m.put(ScalingStat.MANA, mana);
        m.put(ScalingStat.OFFENSE, offense);
        m.put(ScalingStat.DEFENSE, defense);
        m.put(ScalingStat.SPEED, speed);
        m.put(ScalingStat.CRIT, crit);
        m.put(ScalingStat.REGEN_HP, regHp);
        m.put(ScalingStat.REGEN_MANA, regMana);
        SLOT_AFFINITY.put(slot, m);
    }

    private EquipmentScalingHelper() {}

    public static boolean isUpgradeEligible(Equipment eq) {
        if (eq == null || eq.isTemplate()) return false;
        if (eq.getSlot() == EquipmentSlot.CONSOMMABLE) return false;
        return isRarityEligible(eq.getRarity());
    }

    public static boolean isRarityEligible(EquipmentRarity rarity) {
        return rarity != null && RARITY_RATES.containsKey(rarity);
    }

    public static int clampLevel(Equipment eq) {
        if (eq == null || !isRarityEligible(eq.getRarity()) || eq.getSlot() == EquipmentSlot.CONSOMMABLE) {
            return 0;
        }
        return Math.max(0, Math.min(MAX_UPGRADE_LEVEL, eq.getUpgradeLevel()));
    }

    @SuppressWarnings("deprecation")
    public static EquipmentSlot normalizeSlot(EquipmentSlot slot) {
        if (slot == EquipmentSlot.ARME) return EquipmentSlot.ARME_GAUCHE;
        return slot;
    }

    public static double getAffinity(EquipmentSlot slot, ScalingStat stat) {
        EquipmentSlot normalized = normalizeSlot(slot);
        Map<ScalingStat, Double> slotMap = normalized != null ? SLOT_AFFINITY.get(normalized) : null;
        if (slotMap == null) return 1.0;
        return slotMap.getOrDefault(stat, 1.0);
    }

    public static int scaleStat(int base, int upgradeLevel, EquipmentRarity rarity, EquipmentSlot slot, ScalingStat stat) {
        if (base == 0 || upgradeLevel <= 0 || !isRarityEligible(rarity)) {
            return base;
        }
        RarityRates rates = RARITY_RATES.get(rarity);
        int up = Math.max(0, Math.min(MAX_UPGRADE_LEVEL, upgradeLevel));
        if (base < 0) {
            return (int) Math.round(base * (1.0 + up * rates.rNeg()));
        }
        double affinity = getAffinity(slot, stat);
        double delta = up * rates.rPos() * affinity;
        if (base == 1) {
            if (delta >= 0.20 || up >= MAX_UPGRADE_LEVEL) {
                return Math.max(2, (int) Math.round(1.0 + delta));
            }
            return 1;
        }
        return (int) Math.round(base * (1.0 + delta));
    }

    public static int scaleSpecialEffect(int baseValue, int upgradeLevel, EquipmentRarity rarity, EquipmentEffectType effectType) {
        if (baseValue == 0 || upgradeLevel <= 0 || !isRarityEligible(rarity)) {
            return baseValue;
        }
        if (effectType == EquipmentEffectType.CHEAT_DEATH && baseValue == 1) {
            return 1;
        }
        RarityRates rates = RARITY_RATES.get(rarity);
        if (rates.rEff() <= 0.0) {
            return baseValue;
        }
        int up = Math.max(0, Math.min(MAX_UPGRADE_LEVEL, upgradeLevel));
        return (int) Math.round(baseValue * (1.0 + up * rates.rEff()));
    }

    public static EquipmentStatsSnapshotDTO computeSnapshot(Equipment eq, int levelOverride) {
        if (eq == null) {
            return new EquipmentStatsSnapshotDTO(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
        int up = isRarityEligible(eq.getRarity()) && eq.getSlot() != EquipmentSlot.CONSOMMABLE
                ? Math.max(0, Math.min(MAX_UPGRADE_LEVEL, levelOverride))
                : 0;
        EquipmentRarity r = eq.getRarity();
        EquipmentSlot s = eq.getSlot();
        return new EquipmentStatsSnapshotDTO(
                scaleStat(eq.getBonusHealthMax(), up, r, s, ScalingStat.HEALTH),
                scaleStat(eq.getBonusManaMax(), up, r, s, ScalingStat.MANA),
                scaleStat(eq.getBonusPower(), up, r, s, ScalingStat.OFFENSE),
                scaleStat(eq.getBonusStrength(), up, r, s, ScalingStat.OFFENSE),
                scaleStat(eq.getBonusArmor(), up, r, s, ScalingStat.DEFENSE),
                scaleStat(eq.getBonusResistance(), up, r, s, ScalingStat.DEFENSE),
                scaleStat(eq.getBonusSpeed(), up, r, s, ScalingStat.SPEED),
                scaleStat(eq.getBonusCrit(), up, r, s, ScalingStat.CRIT),
                scaleStat(eq.getRegenHealthPerTurn(), up, r, s, ScalingStat.REGEN_HP),
                scaleStat(eq.getRegenManaPerTurn(), up, r, s, ScalingStat.REGEN_MANA),
                scaleSpecialEffect(eq.getSpecialEffectValue(), up, r, eq.getSpecialEffect())
        );
    }

    public static EquipmentStatsSnapshotDTO computeSnapshot(Equipment eq) {
        return computeSnapshot(eq, eq != null ? eq.getUpgradeLevel() : 0);
    }

    public static int getEffectiveHealthMax(Equipment eq) {
        return scaleStat(eq.getBonusHealthMax(), clampLevel(eq), eq.getRarity(), eq.getSlot(), ScalingStat.HEALTH);
    }

    public static int getEffectiveManaMax(Equipment eq) {
        return scaleStat(eq.getBonusManaMax(), clampLevel(eq), eq.getRarity(), eq.getSlot(), ScalingStat.MANA);
    }

    public static int getEffectivePower(Equipment eq) {
        return scaleStat(eq.getBonusPower(), clampLevel(eq), eq.getRarity(), eq.getSlot(), ScalingStat.OFFENSE);
    }

    public static int getEffectiveStrength(Equipment eq) {
        return scaleStat(eq.getBonusStrength(), clampLevel(eq), eq.getRarity(), eq.getSlot(), ScalingStat.OFFENSE);
    }

    public static int getEffectiveArmor(Equipment eq) {
        return scaleStat(eq.getBonusArmor(), clampLevel(eq), eq.getRarity(), eq.getSlot(), ScalingStat.DEFENSE);
    }

    public static int getEffectiveResistance(Equipment eq) {
        return scaleStat(eq.getBonusResistance(), clampLevel(eq), eq.getRarity(), eq.getSlot(), ScalingStat.DEFENSE);
    }

    public static int getEffectiveSpeed(Equipment eq) {
        return scaleStat(eq.getBonusSpeed(), clampLevel(eq), eq.getRarity(), eq.getSlot(), ScalingStat.SPEED);
    }

    public static int getEffectiveCrit(Equipment eq) {
        return scaleStat(eq.getBonusCrit(), clampLevel(eq), eq.getRarity(), eq.getSlot(), ScalingStat.CRIT);
    }

    public static int getEffectiveRegenHealthPerTurn(Equipment eq) {
        return scaleStat(eq.getRegenHealthPerTurn(), clampLevel(eq), eq.getRarity(), eq.getSlot(), ScalingStat.REGEN_HP);
    }

    public static int getEffectiveRegenManaPerTurn(Equipment eq) {
        return scaleStat(eq.getRegenManaPerTurn(), clampLevel(eq), eq.getRarity(), eq.getSlot(), ScalingStat.REGEN_MANA);
    }

    public static int getEffectiveSpecialEffectValue(Equipment eq) {
        return scaleSpecialEffect(eq.getSpecialEffectValue(), clampLevel(eq), eq.getRarity(), eq.getSpecialEffect());
    }
}
