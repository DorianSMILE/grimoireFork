package generation.grimoire.service.equipment;

import generation.grimoire.enumeration.EquipmentRarity;
import generation.grimoire.enumeration.SpiritualiteType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Mapping SSOT associant chaque Secret (et le tronc générique) à son unique
 * Catalyseur (Niveau 4) et son unique Anomalie d'Éveil (Niveau 5),
 * ainsi que la courbe de coût par palier (+1 à +5).
 */
@Component
public class SecretAwakeningMapping {

    public record AwakeningDuo(
            String secretName,
            SpiritualiteType spiritualite,
            String catalystName,
            String awakeningName
    ) {}

    public record TierCost(
            int targetLevel,
            int catalystQty,
            int awakeningQty,
            double baseGold
    ) {}

    private static final AwakeningDuo GENERIC_DUO = new AwakeningDuo(
            null,
            SpiritualiteType.UNIVERSEL,
            "Poussière d'Éveil",
            "Pierre d'Ascension"
    );

    private static final List<AwakeningDuo> SECRET_DUOS = List.of(
            new AwakeningDuo("Secret du Chaos",       SpiritualiteType.DESTRUCTION,   "Éclat de Chaos",        "Cœur de Cendre"),
            new AwakeningDuo("Secret du Destin",      SpiritualiteType.KARMA,         "Fragment du Destin",    "Prisme Karmique"),
            new AwakeningDuo("Secret de l'Éther",     SpiritualiteType.ESPRIT,        "Souffle d'Éther",       "Cœur Empyréen"),
            new AwakeningDuo("Secret des Abysses",    SpiritualiteType.TENEBRES,      "Résidu Abyssal",        "Noyau Néant"),
            new AwakeningDuo("Secret de l'Abondance", SpiritualiteType.CREATION,      "Sève Mutagène",         "Ambre Parasitaire"),
            new AwakeningDuo("Voie Conviction",       SpiritualiteType.CONVICTION,    "Braises de Conviction", "Cœur de Lave Pure"),
            new AwakeningDuo("Voie Sûreté",           SpiritualiteType.SURETE,        "Larme de Pression",     "Perle des Profondeurs"),
            new AwakeningDuo("Voie Raison",           SpiritualiteType.RAISON,        "Ondes de Gravité",      "Singularité Lucide"),
            new AwakeningDuo("Voie Violence",         SpiritualiteType.VIOLENCE,      "Éclat Déflagrant",      "Noyau de Fureur"),
            new AwakeningDuo("Voie Trahison",         SpiritualiteType.TRAHISON,      "Fiole Corrosive",       "Venin Souverain"),
            new AwakeningDuo("Voie Consolidation",    SpiritualiteType.CONSOLIDATION, "Noyau Tellurique",      "Monolithe Éternel")
    );

    private static final Map<Integer, TierCost> TIER_COSTS = Map.of(
            1, new TierCost(1, 1, 0, 500),
            2, new TierCost(2, 2, 0, 1000),
            3, new TierCost(3, 0, 1, 2000),
            4, new TierCost(4, 1, 1, 3500),
            5, new TierCost(5, 2, 2, 6000)
    );

    public AwakeningDuo resolveForSecret(String requiredSecret) {
        if (requiredSecret == null || requiredSecret.trim().isEmpty()) {
            return GENERIC_DUO;
        }
        String normalized = requiredSecret.trim();
        for (AwakeningDuo duo : SECRET_DUOS) {
            if (duo.secretName() != null && duo.secretName().equalsIgnoreCase(normalized)) {
                return duo;
            }
        }
        return GENERIC_DUO;
    }

    public TierCost getTierCost(int targetLevel) {
        TierCost cost = TIER_COSTS.get(targetLevel);
        if (cost == null) {
            throw new IllegalArgumentException("Palier d'éveil invalide : " + targetLevel);
        }
        return cost;
    }

    public double getRarityMultiplier(EquipmentRarity rarity) {
        if (rarity == null) return 1.0;
        return switch (rarity) {
            case LEGENDAIRE -> 1.0;
            case MAUDIT -> 1.5;
            case EPIQUE -> 2.0;
            case RELIQUE -> 3.0;
            default -> 1.0;
        };
    }

    public double getGoldCost(int targetLevel, EquipmentRarity rarity) {
        return Math.ceil(getTierCost(targetLevel).baseGold() * getRarityMultiplier(rarity));
    }

    public double getCumulativeGoldInvested(int currentUpgradeLevel, EquipmentRarity rarity) {
        double total = 0;
        for (int lvl = 1; lvl <= currentUpgradeLevel; lvl++) {
            total += getGoldCost(lvl, rarity);
        }
        return total;
    }

    public int getCumulativeCatalystsSpent(int currentUpgradeLevel) {
        int total = 0;
        for (int lvl = 1; lvl <= currentUpgradeLevel; lvl++) {
            total += getTierCost(lvl).catalystQty();
        }
        return total;
    }

    public int getCumulativeAwakeningsSpent(int currentUpgradeLevel) {
        int total = 0;
        for (int lvl = 1; lvl <= currentUpgradeLevel; lvl++) {
            total += getTierCost(lvl).awakeningQty();
        }
        return total;
    }
}
