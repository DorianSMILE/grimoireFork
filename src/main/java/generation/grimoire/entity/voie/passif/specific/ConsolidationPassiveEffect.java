package generation.grimoire.entity.voie.passif.specific;

import generation.grimoire.entity.Spell;
import generation.grimoire.entity.personnage.Personnage;
import generation.grimoire.entity.personnage.PersonnageCombatHelper;
import generation.grimoire.entity.spell.type.effect.BuffDebuffEffect;
import generation.grimoire.entity.voie.passif.VoiePassiveEffect;
import generation.grimoire.enumeration.StatType;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@DiscriminatorValue("CONSOLIDATION_PASSIVE")
public class ConsolidationPassiveEffect extends VoiePassiveEffect {

    private static final String SOURCE_NAME = "CONSOLIDATION";
    private static final double EMERGENCY_THRESHOLD_RATIO = 0.20;
    private static final double HP_COST_RATIO = 0.05;
    private static final double SHIELD_RATIO = 0.10;
    private static final double EMERGENCY_DEFENSE_BONUS = 0.25;

    @Override
    public void onTurnStart(Personnage personnage) {
        int maxHp = personnage.getHealthMax();
        int currentHp = personnage.getHealthCurrent();
        double threshold = maxHp * EMERGENCY_THRESHOLD_RATIO;

        if (currentHp > threshold) {
            int hpCost = (int) (maxHp * HP_COST_RATIO);
            personnage.setHealthCurrent(Math.max(1, currentHp - hpCost));

            int shieldAmount = (int) (currentHp * SHIELD_RATIO);
            personnage.addShield(shieldAmount, 2, SOURCE_NAME);

            System.out.println(personnage.getName() + " perd " + hpCost + " PV et gagne un bouclier de " + shieldAmount + " (Consolidation).");
        } else {
            addModifierBuff(personnage, StatType.ARMURE, EMERGENCY_DEFENSE_BONUS);
            addModifierBuff(personnage, StatType.RESISTANCE, EMERGENCY_DEFENSE_BONUS);
            System.out.println(personnage.getName() + " bénéficie de +25% d'armure et de résistance magique (Consolidation - Urgence).");
        }
    }

    /**
     * Construit le libellé SSOT du bonus/coût Consolidation actif pour l'affichage en combat.
     */
    public static String buildActiveBonusSummary(Personnage personnage) {
        if (personnage == null || personnage.getVoie() == null
                || personnage.getVoie().getNom() == null
                || !personnage.getVoie().getNom().toLowerCase().contains("consolidation")) {
            return null;
        }
        int maxHp = personnage.getHealthMax();
        int currentHp = personnage.getHealthCurrent();
        if (currentHp > maxHp * EMERGENCY_THRESHOLD_RATIO) {
            int rawHpCost = (int) (maxHp * HP_COST_RATIO);
            int actualHpCost = currentHp - Math.max(1, currentHp - rawHpCost);
            int baseShield = (int) (currentHp * SHIELD_RATIO);
            double shieldMult = Math.max(0, personnage.getStatBuffMultiplier(StatType.SHIELD_RECEIVED));
            int effectiveShield = (int) (baseShield * shieldMult);
            return "Prochain tour : -" + actualHpCost + " PV prélevés · +" + effectiveShield + " Bouclier (2 tours)";
        }
        int armorGain = PersonnageCombatHelper.simulateAddedPositiveBuffDelta(
                personnage, StatType.ARMURE, EMERGENCY_DEFENSE_BONUS);
        int resistGain = PersonnageCombatHelper.simulateAddedPositiveBuffDelta(
                personnage, StatType.RESISTANCE, EMERGENCY_DEFENSE_BONUS);
        return "Prochain tour (≤ 20% PV) : +" + armorGain + " Armure · +" + resistGain + " Résistance (+25%, 2 tours)";
    }

    private void addModifierBuff(Personnage personnage, StatType stat, double modifier) {
        BuffDebuffEffect buff = new BuffDebuffEffect();
        buff.setStatAffected(stat);
        buff.setModifier(modifier);
        buff.setFlatValue(0);
        buff.setDuration(2);
        buff.setSourceName(SOURCE_NAME);
        personnage.getActiveBuffs().add(buff);
    }

    @Override
    public void onSpellCast(Personnage personnage, Spell spell) {
        // Plus d'effet au lancement de sort pour cette voie
    }

    @Override
    public void adjustSpellCosts(Personnage caster, Spell spell, int[] costs) {
        // Pas d'ajustement de coût
    }
}