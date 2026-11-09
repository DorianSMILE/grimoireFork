package generation.grimoire.utils;

import generation.grimoire.entity.personnage.Personnage;
import generation.grimoire.enumeration.Source;
import generation.grimoire.enumeration.StatType;

public class StatCalculator {

    /**
     * Récupère la valeur de la statistique définie par 'source' en utilisant les
     * données du caster et de la target.
     * Les bonus flat provenant des passifs (ex: Violence, buffs) sont inclus pour
     * les stats concernées.
     *
     * @param source l'énumération définissant la source du calcul
     * @param caster le personnage qui lance le sort
     * @param target la cible du sort
     * @return la valeur correspondant à la source choisie
     */
    public static double getSourceValue(Source source, Personnage caster, Personnage target) {
        if (source == null) {
            return 1.0;
        }
        if (target == null) {
            target = caster;
        }
        return switch (source) {
            case CASTER_POWER -> generation.grimoire.entity.personnage.PersonnageCombatHelper.getEffectiveStat(caster, StatType.POWER);
            case TARGET_POWER -> generation.grimoire.entity.personnage.PersonnageCombatHelper.getEffectiveStat(target, StatType.POWER);
            case CASTER_PHYSICAL_POWER -> generation.grimoire.entity.personnage.PersonnageCombatHelper.getEffectiveStat(caster, StatType.STRENGTH);
            case TARGET_PHYSICAL_POWER -> generation.grimoire.entity.personnage.PersonnageCombatHelper.getEffectiveStat(target, StatType.STRENGTH);
            case CASTER_MANA_MAX -> caster.getTotalManaMax();
            case TARGET_MANA_MAX -> target.getTotalManaMax();
            case TARGET_MANA_MISSING -> Math.max(0, target.getTotalManaMax() - target.getManaCurrent());
            case CASTER_MANA_MISSING -> Math.max(0, caster.getTotalManaMax() - caster.getManaCurrent());
            case TARGET_HEALTH_MAX -> target.getTotalHealthMax();
            case CASTER_HEALTH_MAX -> caster.getTotalHealthMax();
            case TARGET_HEALTH_MISSING -> Math.max(0, target.getTotalHealthMax() - target.getHealthCurrent());
            case CASTER_HEALTH_MISSING -> Math.max(0, caster.getTotalHealthMax() - caster.getHealthCurrent());
            case TARGET_HEALTH_CURRENT -> Math.max(0, target.getHealthCurrent());
            case CASTER_HEALTH_CURRENT -> Math.max(0, caster.getHealthCurrent());
            case CASTER_MANA_CURRENT -> Math.max(0, caster.getManaCurrent());
            case TARGET_MANA_CURRENT -> Math.max(0, target.getManaCurrent());
            case CASTER_SPEED -> caster.getTotalSpeed();
            case TARGET_SPEED -> target.getTotalSpeed();
            case CASTER_CRIT -> caster.getTotalCrit();
            case TARGET_CRIT -> target.getTotalCrit();
        };
    }

}
