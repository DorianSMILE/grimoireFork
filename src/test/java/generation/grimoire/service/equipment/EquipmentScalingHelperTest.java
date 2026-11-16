package generation.grimoire.service.equipment;

import generation.grimoire.dto.equipment.EquipmentStatsSnapshotDTO;
import generation.grimoire.entity.Equipment;
import generation.grimoire.enumeration.EquipmentEffectType;
import generation.grimoire.enumeration.EquipmentRarity;
import generation.grimoire.enumeration.EquipmentSlot;
import generation.grimoire.service.equipment.EquipmentScalingHelper.ScalingStat;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EquipmentScalingHelperTest {

    @Test
    void isUpgradeEligible_onlyAllowsLegendaireEpiqueReliqueMauditNonTemplateNonConsumable() {
        Equipment eq = new Equipment();
        eq.setSlot(EquipmentSlot.CASQUE);
        eq.setTemplate(false);

        for (EquipmentRarity rarity : EquipmentRarity.values()) {
            eq.setRarity(rarity);
            boolean expected = rarity == EquipmentRarity.LEGENDAIRE
                    || rarity == EquipmentRarity.EPIQUE
                    || rarity == EquipmentRarity.RELIQUE
                    || rarity == EquipmentRarity.MAUDIT;
            assertEquals(expected, EquipmentScalingHelper.isUpgradeEligible(eq), "Failed for " + rarity);
        }

        eq.setRarity(EquipmentRarity.LEGENDAIRE);
        eq.setTemplate(true);
        assertFalse(EquipmentScalingHelper.isUpgradeEligible(eq));

        eq.setTemplate(false);
        eq.setSlot(EquipmentSlot.CONSOMMABLE);
        assertFalse(EquipmentScalingHelper.isUpgradeEligible(eq));
    }

    @Test
    void scaleStat_usesAdaptiveTwentyPercentThresholdForBaseOne() {
        // ARME_DROITE + DEFENSE has M = 1.40; LEGENDAIRE rPos = 0.08 -> delta = 0.112/lvl -> >= 0.20 at +2
        assertEquals(1, EquipmentScalingHelper.scaleStat(1, 0, EquipmentRarity.LEGENDAIRE, EquipmentSlot.ARME_DROITE, ScalingStat.DEFENSE));
        assertEquals(1, EquipmentScalingHelper.scaleStat(1, 1, EquipmentRarity.LEGENDAIRE, EquipmentSlot.ARME_DROITE, ScalingStat.DEFENSE));
        assertEquals(2, EquipmentScalingHelper.scaleStat(1, 2, EquipmentRarity.LEGENDAIRE, EquipmentSlot.ARME_DROITE, ScalingStat.DEFENSE));

        // PLASTRON + SPEED has M = 0.65; LEGENDAIRE rPos = 0.08 -> delta = 0.052/lvl -> >= 0.20 at +4
        assertEquals(1, EquipmentScalingHelper.scaleStat(1, 1, EquipmentRarity.LEGENDAIRE, EquipmentSlot.PLASTRON, ScalingStat.SPEED));
        assertEquals(1, EquipmentScalingHelper.scaleStat(1, 3, EquipmentRarity.LEGENDAIRE, EquipmentSlot.PLASTRON, ScalingStat.SPEED));
        assertEquals(2, EquipmentScalingHelper.scaleStat(1, 4, EquipmentRarity.LEGENDAIRE, EquipmentSlot.PLASTRON, ScalingStat.SPEED));

        // ANNEAU + REGEN_MANA has M = 0.50; LEGENDAIRE rPos = 0.08 -> delta = 0.04/lvl -> >= 0.20 at +5
        assertEquals(1, EquipmentScalingHelper.scaleStat(1, 4, EquipmentRarity.LEGENDAIRE, EquipmentSlot.ANNEAU, ScalingStat.REGEN_MANA));
        assertEquals(2, EquipmentScalingHelper.scaleStat(1, 5, EquipmentRarity.LEGENDAIRE, EquipmentSlot.ANNEAU, ScalingStat.REGEN_MANA));
    }

    @Test
    void scaleStat_handlesMultiValueAndNegativeMalus() {
        // Base 20 OFFENSE on ARME_DEUX_MAINS (M = 1.25), EPIQUE (rPos = 0.10), level +5
        // gain = 1 + 5 * 0.10 * 1.25 = 1.625 -> round(20 * 1.625) = 33
        assertEquals(33, EquipmentScalingHelper.scaleStat(20, 5, EquipmentRarity.EPIQUE, EquipmentSlot.ARME_DEUX_MAINS, ScalingStat.OFFENSE));

        // Negative stat -10: LEGENDAIRE rNeg = 0.04, level +5 -> round(-10 * (1 + 0.20)) = -12
        assertEquals(-12, EquipmentScalingHelper.scaleStat(-10, 5, EquipmentRarity.LEGENDAIRE, EquipmentSlot.CASQUE, ScalingStat.DEFENSE));

        // Negative stat -1: RELIQUE rNeg = 0.06, level +4 -> round(-1.24) = -1, level +5 -> -1.3 -> -1 (no boost for single-unit malus below 1.5x)
        assertEquals(-1, EquipmentScalingHelper.scaleStat(-1, 2, EquipmentRarity.RELIQUE, EquipmentSlot.CASQUE, ScalingStat.SPEED));
    }

    @Test
    void scaleSpecialEffect_scalesNormalEffectsAndLeavesCheatDeathFixed() {
        Equipment relic = new Equipment();
        relic.setRarity(EquipmentRarity.RELIQUE);
        relic.setSlot(EquipmentSlot.ARME_DEUX_MAINS);
        relic.setSpecialEffect(EquipmentEffectType.LIFESTEAL);
        relic.setSpecialEffectValue(10);
        relic.setUpgradeLevel(5);

        // RELIQUE rEff = 0.05, +5 -> round(10 * 1.25) = 13
        assertEquals(13, EquipmentScalingHelper.getEffectiveSpecialEffectValue(relic));

        relic.setSpecialEffect(EquipmentEffectType.CHEAT_DEATH);
        relic.setSpecialEffectValue(1);
        assertEquals(1, EquipmentScalingHelper.getEffectiveSpecialEffectValue(relic));
    }

    @Test
    @SuppressWarnings("deprecation")
    void deprecatedArmeSlotResolvesAsArmeGauche() {
        Equipment oldWeapon = new Equipment();
        oldWeapon.setRarity(EquipmentRarity.EPIQUE);
        oldWeapon.setSlot(EquipmentSlot.ARME);
        oldWeapon.setBonusStrength(10);
        oldWeapon.setUpgradeLevel(5);

        // ARME -> ARME_GAUCHE (OFFENSE = 1.20), EPIQUE rPos = 0.10, +5 -> round(10 * 1.60) = 16
        EquipmentStatsSnapshotDTO snap = EquipmentScalingHelper.computeSnapshot(oldWeapon, 5);
        assertEquals(16, snap.bonusStrength());
    }
}
