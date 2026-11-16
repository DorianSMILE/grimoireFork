package generation.grimoire.dto.equipment;

public record EquipmentStatsSnapshotDTO(
        int bonusHealthMax,
        int bonusManaMax,
        int bonusPower,
        int bonusStrength,
        int bonusArmor,
        int bonusResistance,
        int bonusSpeed,
        int bonusCrit,
        int regenHealthPerTurn,
        int regenManaPerTurn,
        int specialEffectValue
) {}
