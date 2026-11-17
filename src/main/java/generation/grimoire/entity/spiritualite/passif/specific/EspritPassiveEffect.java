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
@DiscriminatorValue("ESPRIT_PASSIVE")
public class EspritPassiveEffect extends SpiritualitePassiveEffect {

    @Override
    public void onSpellCast(Personnage personnage, Spell spell) {
        // Contrainte de lancement uniquement
    }

    @Override
    public void onTurnStart(Personnage personnage) {
        int manaRegen = computeTurnStartManaRegen(personnage);
        if (manaRegen > 0) {
            personnage.restoreMana(manaRegen);
        }

        if (personnage.getHealthCurrent() < (personnage.getHealthMax() * 0.20)) {
            int shieldAmount = (int) (personnage.getHealthMax() * 0.05);
            if (shieldAmount > 0) {
                personnage.addShield(shieldAmount, 2, "Passif Esprit");
                System.out.println(personnage.getName() + " reçoit un bouclier de " + shieldAmount + " via l'Esprit.");
            }
        }
    }

    /**
     * Calcule la quantité de mana régénérée au début du tour par le passif Esprit.
     */
    public static int computeTurnStartManaRegen(Personnage personnage) {
        if (personnage == null) {
            return 0;
        }
        return (int) (personnage.getManaCurrent() * 0.10);
    }

    /**
     * Construit le libellé SSOT du bonus passif Esprit actif pour l'affichage en combat.
     */
    public static String buildActiveBonusSummary(Personnage personnage) {
        if (personnage == null || personnage.getSpiritualite() == null
                || personnage.getSpiritualite().getNom() == null
                || !personnage.getSpiritualite().getNom().toLowerCase().contains("esprit")) {
            return null;
        }
        int manaRegen = computeTurnStartManaRegen(personnage);
        String summary = "Bonus actuel : +" + manaRegen + " Mana régénéré / tour (10% actuel)";
        if (personnage.getHealthCurrent() < (personnage.getHealthMax() * 0.20)) {
            int shieldAmount = (int) (personnage.getHealthMax() * 0.05);
            if (shieldAmount > 0) {
                summary += " · +" + shieldAmount + " Bouclier (2 tours)";
            }
        }
        return summary;
    }

    @Override
    public boolean canCastSpell(Personnage caster, Spell spell) {
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

        // Obligé d'avoir soit plus de 20% hp, soit 20% mana
        boolean hasEnoughHp = caster.getHealthCurrent() >= (caster.getHealthMax() * 0.20);
        boolean hasEnoughMana = caster.getManaCurrent() >= (caster.getManaMax() * 0.20);

        if (!hasEnoughHp || !hasEnoughMana) {
            System.out.println(caster.getName()
                    + " n'a pas les prérequis d'Esprit (>= 20% HP ET >= 20% Mana) pour lancer " + spell.getNom());
            return false;
        }
        return true;
    }
}
