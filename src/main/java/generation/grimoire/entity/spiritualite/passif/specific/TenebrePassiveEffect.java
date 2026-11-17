package generation.grimoire.entity.spiritualite.passif.specific;

import generation.grimoire.entity.Spell;
import generation.grimoire.entity.personnage.Personnage;
import generation.grimoire.entity.spiritualite.passif.SpiritualitePassiveEffect;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@DiscriminatorValue("TENEBRE_PASSIVE")
public class TenebrePassiveEffect extends SpiritualitePassiveEffect {

    @Override
    public void onSpellCast(Personnage personnage, Spell spell) {
        // Remplacé par la contrainte de lancement
    }

    private static final double MISSING_STAT_DMG_RATIO = 0.10;

    @Override
    public void onTurnStart(Personnage personnage) {
        int[] bonuses = computeTurnStartDamageBonuses(personnage);
        int physBonusDmg = bonuses[0];
        int magBonusDmg = bonuses[1];

        if (physBonusDmg > 0) {
            generation.grimoire.entity.spell.type.effect.BuffDebuffEffect physBuff = new generation.grimoire.entity.spell.type.effect.BuffDebuffEffect();
            physBuff.setStatAffected(generation.grimoire.enumeration.StatType.DAMAGE_GIVEN_PHYSIC);
            physBuff.setFlatValue(physBonusDmg);
            physBuff.setDuration(1);
            physBuff.setSourceName("Passif Ténèbres");
            personnage.getActiveBuffs().add(physBuff);
        }

        if (magBonusDmg > 0) {
            generation.grimoire.entity.spell.type.effect.BuffDebuffEffect magBuff = new generation.grimoire.entity.spell.type.effect.BuffDebuffEffect();
            magBuff.setStatAffected(generation.grimoire.enumeration.StatType.DAMAGE_GIVEN_MAGIC);
            magBuff.setFlatValue(magBonusDmg);
            magBuff.setDuration(1);
            magBuff.setSourceName("Passif Ténèbres");
            personnage.getActiveBuffs().add(magBuff);
        }

        if (physBonusDmg > 0 || magBonusDmg > 0) {
            System.out.println(personnage.getName() + " gagne " + physBonusDmg + " dégâts physiques et " + magBonusDmg + " dégâts magiques ce tour via Ténèbres.");
        }
    }

    /**
     * Calcule les bonus de dégâts [physiques, magiques] gagnés au début du prochain tour.
     */
    public static int[] computeTurnStartDamageBonuses(Personnage personnage) {
        if (personnage == null) {
            return new int[] { 0, 0 };
        }
        int missingHp = Math.max(0, personnage.getHealthMax() - personnage.getHealthCurrent());
        int missingMana = Math.max(0, personnage.getManaMax() - personnage.getManaCurrent());
        int physBonusDmg = (int) (missingHp * MISSING_STAT_DMG_RATIO);
        int magBonusDmg = (int) (missingMana * MISSING_STAT_DMG_RATIO);
        return new int[] { physBonusDmg, magBonusDmg };
    }

    /**
     * Construit le libellé SSOT des bonus de dégâts physiques et magiques Ténèbres pour l'affichage en combat.
     */
    public static String buildActiveBonusSummary(Personnage personnage) {
        if (personnage == null || personnage.getSpiritualite() == null
                || personnage.getSpiritualite().getNom() == null) {
            return null;
        }
        String spName = personnage.getSpiritualite().getNom().toLowerCase();
        if (!spName.contains("ténèbre") && !spName.contains("tenebre")) {
            return null;
        }
        int[] bonuses = computeTurnStartDamageBonuses(personnage);
        return "Prochain tour : +" + bonuses[0] + " Dégâts Phy · +" + bonuses[1] + " Dégâts Mag (1 tour)";
    }

    @Override
    public boolean canCastSpell(Personnage caster, Spell spell) {
        if (spell.getNom() != null && spell.getNom().toLowerCase().contains("base")) {
            return true;
        }

        // Ne vérifier la condition que pour les sorts de cette spiritualité
        if (spell.getSpiritualite() == null || this.getSpiritualite() == null) {
            return true;
        }
        boolean sameId = spell.getSpiritualite().getId() != null && this.getSpiritualite().getId() != null
                && spell.getSpiritualite().getId().equals(this.getSpiritualite().getId());
        boolean sameName = spell.getSpiritualite().getNom() != null && this.getSpiritualite().getNom() != null
                && spell.getSpiritualite().getNom().equals(this.getSpiritualite().getNom());
        if (!sameId && !sameName) {
            return true; // Le sort n'est pas de cette spiritualité, ne pas bloquer
        }

        // Obligé d'avoir moins de 80% hp ou 80% mana
        boolean conditionHp = caster.getHealthCurrent() <= (caster.getHealthMax() * 0.80);
        boolean conditionMana = caster.getManaCurrent() <= (caster.getManaMax() * 0.80);

        if (!conditionHp && !conditionMana) {
            System.out.println(caster.getName() + " n'a pas les prérequis de Ténèbres (<= 80% HP ou <= 80% Mana) pour lancer " + spell.getNom());
            return false;
        }
        return true;
    }
}
