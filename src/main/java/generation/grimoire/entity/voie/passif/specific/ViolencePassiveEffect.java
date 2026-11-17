package generation.grimoire.entity.voie.passif.specific;

import generation.grimoire.entity.Spell;
import generation.grimoire.entity.personnage.Personnage;
import generation.grimoire.entity.personnage.PersonnageCombatHelper;
import generation.grimoire.entity.spell.type.effect.BuffDebuffEffect;
import generation.grimoire.entity.voie.passif.VoiePassiveEffect;
import generation.grimoire.enumeration.SpellCategory;
import generation.grimoire.enumeration.StatType;
import generation.grimoire.event.GameEvent;
import generation.grimoire.event.SpellCastEvent;
import generation.grimoire.event.TurnStartEvent;
import generation.grimoire.event.SpellChannelingTickEvent;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@DiscriminatorValue("VIOLENCE_PASSIVE")
public class ViolencePassiveEffect extends VoiePassiveEffect {

    private static final String STATE_INSPIRATION = "violence_inspiration";
    private static final String STATE_EXPIRATION = "violence_expiration";
    private static final int OVERLOAD_THRESHOLD = 6;
    private static final int BUFF_THRESHOLD_LOW = 4;
    private static final int BUFF_THRESHOLD_MAX = 7;

    /**
     * Calcule les dégâts par tour de la brûlure de surcharge Violence.
     */
    public static int computeOverloadBurnDamage(Personnage personnage) {
        if (personnage == null) {
            return 0;
        }
        int power = PersonnageCombatHelper.getEffectiveStat(personnage, StatType.POWER);
        int strength = PersonnageCombatHelper.getEffectiveStat(personnage, StatType.STRENGTH);
        return (int) Math.round((power * 0.15) + (strength * 0.15));
    }

    /**
     * Construit le libellé SSOT des cumuls d'Inspiration (gain de Critique au swap + brûlure si surcharge).
     */
    public static String buildInspirationSummary(Personnage personnage) {
        return buildOrbSummary(personnage, true);
    }

    /**
     * Construit le libellé SSOT des cumuls d'Expiration (gain de Force au swap + brûlure si surcharge).
     */
    public static String buildExpirationSummary(Personnage personnage) {
        return buildOrbSummary(personnage, false);
    }

    private static String buildOrbSummary(Personnage personnage, boolean isInspiration) {
        if (personnage == null || personnage.getVoie() == null
                || personnage.getVoie().getNom() == null
                || !personnage.getVoie().getNom().toLowerCase().contains("violence")) {
            return null;
        }
        int count = personnage.getPassiveState(isInspiration ? STATE_INSPIRATION : STATE_EXPIRATION, 0);
        String targetSwap = isInspiration ? "Expiration" : "Inspiration";
        String statLabel = isInspiration ? "Crit" : "Force";
        StatType statType = isInspiration ? StatType.CRIT : StatType.STRENGTH;

        String bonusPart;
        if (count < BUFF_THRESHOLD_LOW) {
            bonusPart = "Prochain swap (" + targetSwap + ") : aucun bonus (requis ≥ 4 cumuls)";
        } else {
            double modifier = isInspiration
                    ? (count >= BUFF_THRESHOLD_MAX ? 2.0 : 1.0)
                    : (count >= BUFF_THRESHOLD_MAX ? 0.60 : 0.30);
            int pct = (int) Math.round(modifier * 100);
            int gain = PersonnageCombatHelper.simulateAddedPositiveBuffDelta(personnage, statType, modifier);
            bonusPart = "Prochain swap (" + targetSwap + ") : +" + gain + " " + statLabel
                    + " (+" + pct + "%, 3 tours)";
        }

        if (count >= OVERLOAD_THRESHOLD) {
            int burnDamage = computeOverloadBurnDamage(personnage);
            String sameCategory = isInspiration ? "Inspiration" : "Expiration";
            return bonusPart + " · Surcharge (si " + sameCategory + ") : "
                    + burnDamage + " Brûlure/tour (3 tours)";
        }
        return bonusPart;
    }

    @Override
    public void onEvent(GameEvent event) {
        if (event instanceof SpellCastEvent e) {
            handleSpellCast(e);
        } else if (event instanceof SpellChannelingTickEvent e) {
            handleSpellChannelingTick(e);
        } else if (event instanceof TurnStartEvent e) {
            handleTurnStart(e);
        } else {
            super.onEvent(event);
        }
    }

    private void handleSpellChannelingTick(SpellChannelingTickEvent event) {
        Spell spell = event.getSpell();
        if (spell.getVoie() != null && "Voie de la Violence".equals(spell.getVoie().getNom())) {
            applyViolencePassive(event.getSource(), spell);
        }
    }

    private void handleSpellCast(SpellCastEvent event) {
        Spell spell = event.getSpell();
        if (spell.getVoie() != null && "Voie de la Violence".equals(spell.getVoie().getNom())) {
            applyViolencePassive(event.getSource(), spell);
        }
    }

    private void applyViolencePassive(Personnage personnage, Spell spell) {
        int inspirationCount = personnage.getPassiveState(STATE_INSPIRATION, 0);
        int expirationCount = personnage.getPassiveState(STATE_EXPIRATION, 0);

        if (spell.getCategory() == SpellCategory.INSPIRATION) {
            // Swap check: Consuming Expiration stacks
            if (expirationCount >= 4 && expirationCount <= 6) {
                applyBuff(personnage, StatType.STRENGTH, 0.30, 0, 3);
            } else if (expirationCount >= 7) {
                applyBuff(personnage, StatType.STRENGTH, 0.60, 0, 3);
            }

            personnage.setPassiveState(STATE_EXPIRATION, 0); // Reset Expiration

            // Check if we are casting same type after 6 stacks
            if (inspirationCount >= 6) {
                applyBurn(personnage);
            }

            inspirationCount = Math.min(inspirationCount + 1, 7);
            personnage.setPassiveState(STATE_INSPIRATION, inspirationCount);

            System.out.println(personnage.getName() + " cast Inspiration. Stacks: " + inspirationCount + "/7");

        } else if (spell.getCategory() == SpellCategory.EXPIRATION) {
            // Swap check: Consuming Inspiration stacks
            if (inspirationCount >= 4 && inspirationCount <= 6) {
                applyBuff(personnage, StatType.CRIT, 1.0, 0, 3);
            } else if (inspirationCount >= 7) {
                applyBuff(personnage, StatType.CRIT, 2.0, 0, 3);
            }

            personnage.setPassiveState(STATE_INSPIRATION, 0); // Reset Inspiration

            // Check if we are casting same type after 6 stacks
            if (expirationCount >= 6) {
                applyBurn(personnage);
            }

            expirationCount = Math.min(expirationCount + 1, 7);
            personnage.setPassiveState(STATE_EXPIRATION, expirationCount);

            System.out.println(personnage.getName() + " cast Expiration. Stacks: " + expirationCount + "/7");
        }
    }

    private void applyBuff(Personnage personnage, StatType statType, double modifier, int flatValue, int duration) {
        BuffDebuffEffect buff = new BuffDebuffEffect();
        buff.setStatAffected(statType);
        buff.setModifier(modifier);
        buff.setFlatValue(flatValue);
        buff.setDuration(duration);
        buff.setSourceName("Violence (Swap)");
        personnage.applyBuff(buff, modifier);
    }

    private void applyBurn(Personnage personnage) {
        int burnDamage = computeOverloadBurnDamage(personnage);

        BuffDebuffEffect burn = new BuffDebuffEffect();
        burn.setStatAffected(StatType.BURN);
        burn.setFlatValue(burnDamage);
        burn.setDuration(3);
        burn.setSourceName("Violence (Surcharge)");
        personnage.applyBuff(burn, 0.0); // modifier is 0.0, we use flatValue

        System.out.println(personnage.getName() + " subit un contrecoup de Brûlure (" + burnDamage
                + " dégâts de Brûlure par tour pour 3 tours).");
    }

    private void handleTurnStart(TurnStartEvent event) {
        // La logique des dégâts de surcharge a été remplacée par l'application de
        // brûlures lors du lancer.
    }

    // ─── Méthodes legacy (conservées pour rétro-compatibilité) ───

    @Override
    public void onSpellCast(Personnage personnage, Spell spell) {
        handleSpellCast(new SpellCastEvent(personnage, null, spell));
    }

    @Override
    public void onTurnStart(Personnage personnage) {
        handleTurnStart(new TurnStartEvent(personnage));
    }
}
