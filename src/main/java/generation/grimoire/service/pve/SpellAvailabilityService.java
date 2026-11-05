package generation.grimoire.service.pve;

import generation.grimoire.dto.pve.SpellCostModifierDTO;
import generation.grimoire.entity.Spell;
import generation.grimoire.entity.SpellEffect;
import generation.grimoire.entity.personnage.Personnage;
import generation.grimoire.enumeration.EquipmentEffectType;
import generation.grimoire.enumeration.KarmaAlignment;
import generation.grimoire.enumeration.Source;
import generation.grimoire.enumeration.SpellCastingType;
import generation.grimoire.event.CanCastCheckEvent;
import generation.grimoire.event.CastingTypeAdjustEvent;
import generation.grimoire.event.SpellCostAdjustEvent;
import generation.grimoire.model.pve.CombatSession;
import generation.grimoire.model.pve.SpellAvailability;
import generation.grimoire.repository.SpellRepository;
import generation.grimoire.service.PassiveDispatcher;
import generation.grimoire.utils.StatCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Calcule la disponibilité et les coûts dynamiques de chaque sort pour le joueur actif.
 * Reproduit la logique de validation de SpellService.castSpellGroup() en mode lecture seule.
 */
@Service
@RequiredArgsConstructor
class SpellAvailabilityService {

    private final SpellRepository spellRepository;
    private final PassiveDispatcher passiveDispatcher;

    void compute(CombatSession session) {
        if (session.isFinished())
            return;
        List<SpellAvailability> avails = new ArrayList<>();
        Personnage p = session.getActivePlayer();

        if (p == null) {
            session.setAvailableSpells(new ArrayList<>());
            session.setSpellAvailability(avails);
            return;
        }

        // Update the list of available spells for this active player
        List<Spell> validSpells = new ArrayList<>();
        for (Spell s : spellRepository.findAll()) {
            if (p.canCast(s) == null) {
                validSpells.add(s);
            }
        }
        session.setAvailableSpells(validSpells);

        java.io.PrintStream originalOut = System.out;
        try {
            System.setOut(new java.io.PrintStream(new java.io.OutputStream() {
                public void write(int b) {
                }
            }));

            for (Spell spell : session.getAvailableSpells()) {
                SpellAvailability avail = checkSpellAvailability(spell, p, session);
                avails.add(avail);
            }
        } finally {
            System.setOut(originalOut);
        }

        session.setSpellAvailability(avails);
    }

    private SpellAvailability checkSpellAvailability(Spell spell, Personnage p, CombatSession session) {
        // Calculer systématiquement les coûts réels et leurs modificateurs pour l'affichage dynamique
        ComputedSpellCosts computedCosts = computeSpellCosts(spell, p, session);

        String canCastError = p.canCast(spell);
        if (canCastError != null) {
            return buildAvailability(spell.getId(), false, "CONDITION", canCastError, computedCosts);
        }

        // 1) Déterminer le type de casting effectif (avec passif Création)
        SpellCastingType cType = spell.getCastingType();
        if (cType == null)
            cType = SpellCastingType.BANAL;

        // Simuler CastingTypeAdjustEvent (Création: banal → instantané si 1er sort)
        CastingTypeAdjustEvent castingEvent = new CastingTypeAdjustEvent(p, p, spell, cType);
        passiveDispatcher.dispatch(p, spell, castingEvent);
        cType = castingEvent.getCurrentType();

        // 2) Vérifications des limites d'action du tour
        // Rule A: Si canalisation en cours
        if (p.getRemainingChannelingTurns() > 0) {
            if (cType != SpellCastingType.INSTANTANE) {
                return buildAvailability(spell.getId(), false, "CHANNELING",
                        "Canalisation en cours : seuls les sorts instantanés sont autorisés", computedCosts);
            }
            if (!p.isAllowInstantDuringCurrentChanneling()) {
                return buildAvailability(spell.getId(), false, "CHANNELING",
                        "Cette canalisation interdit les sorts instantanés", computedCosts);
            }
        }

        // Rule B: Si un sort banal ou une attaque a déjà été lancé ce tour
        if (p.isBanalSpellCastThisTurn() && p.getRemainingChannelingTurns() == 0) {
            return buildAvailability(spell.getId(), false, "ACTION_LIMIT",
                    "Action majeure déjà effectuée ce tour (les sorts instantanés doivent être lancés avant)", computedCosts);
        }

        // Rule C: Si un sort instantané a déjà été lancé ce tour
        if (cType == SpellCastingType.INSTANTANE && p.isInstantSpellCastThisTurn()) {
            return buildAvailability(spell.getId(), false, "ACTION_LIMIT",
                    "Sort instantané déjà lancé ce tour", computedCosts);
        }

        // 3) Vérification des conditions de spiritualité (Esprit, Ténèbres, Karma)
        CanCastCheckEvent canCastEvent = new CanCastCheckEvent(p, p, spell);
        passiveDispatcher.dispatch(p, spell, canCastEvent);
        if (!canCastEvent.isAllowed()) {
            return buildAvailability(spell.getId(), false, "CONDITION",
                    getConditionTooltip(p, spell), computedCosts);
        }

        int actualManaCost = computedCosts.finalManaCost();
        int actualHealCost = computedCosts.finalHealCost();
        int actualHeatCost = computedCosts.finalHeatCost();

        // 5) Vérification des ressources
        if (p.getManaCurrent() < actualManaCost) {
            return buildAvailability(spell.getId(), false, "RESOURCE",
                    "Mana insuffisant (" + p.getManaCurrent() + "/" + actualManaCost + ")",
                    computedCosts);
        }
        if (p.getHealthCurrent() < actualHealCost) {
            return buildAvailability(spell.getId(), false, "RESOURCE",
                    "PV insuffisants (" + p.getHealthCurrent() + "/" + actualHealCost + ")",
                    computedCosts);
        }
        int currentHeat = p.getPassiveState("destruction_heat", 0);
        if (actualHeatCost > 0 && currentHeat < actualHeatCost) {
            return buildAvailability(spell.getId(), false, "RESOURCE",
                    "Chaleur insuffisante (" + currentHeat + "/" + actualHeatCost + ")",
                    computedCosts);
        }

        int actualSeedCost = spell.getSeedCost();
        int currentBuds = p.getPassiveState("creation_buds", 0);
        boolean willPassiveTrigger = currentBuds > 0 && p.getPassiveState("creation_used_this_turn", 0) == 0;
        int requiredBuds = actualSeedCost + (willPassiveTrigger ? 1 : 0);
        if (currentBuds < requiredBuds) {
            return buildAvailability(spell.getId(), false, "RESOURCE",
                    "Graines insuffisantes (" + currentBuds + "/" + requiredBuds + ")",
                    computedCosts);
        }

        return buildAvailability(spell.getId(), true, null, null, computedCosts);
    }

    private record ComputedSpellCosts(
            int finalManaCost,
            int finalHealCost,
            int finalHeatCost,
            int rawManaCost,
            int percentManaAmount,
            int rawHealCost,
            int percentHealAmount,
            int rawHeatCost,
            int percentHeatAmount,
            List<SpellCostModifierDTO> manaModifiers,
            List<SpellCostModifierDTO> healModifiers,
            List<SpellCostModifierDTO> heatModifiers
    ) {}

    private SpellAvailability buildAvailability(Long spellId, boolean castable, String reason, String tooltip,
                                                ComputedSpellCosts c) {
        return new SpellAvailability(
                spellId,
                castable,
                reason,
                tooltip,
                c.finalManaCost(),
                c.finalHealCost(),
                c.finalHeatCost(),
                c.rawManaCost(),
                c.percentManaAmount(),
                c.rawHealCost(),
                c.percentHealAmount(),
                c.rawHeatCost(),
                c.percentHeatAmount(),
                c.manaModifiers(),
                c.healModifiers(),
                c.heatModifiers()
        );
    }

    private ComputedSpellCosts computeSpellCosts(Spell spell, Personnage p, CombatSession session) {
        Personnage defaultTarget = p;
        if (session != null && session.getEnemies() != null) {
            for (generation.grimoire.model.pve.ActiveMonster m : session.getEnemies()) {
                if (!m.isDead() && m.getAsPersonnage() != null && m.getAsPersonnage().getHealthCurrent() > 0) {
                    defaultTarget = m.getAsPersonnage();
                    break;
                }
            }
        }

        List<SpellCostModifierDTO> manaModifiers = new ArrayList<>();
        List<SpellCostModifierDTO> healModifiers = new ArrayList<>();
        List<SpellCostModifierDTO> heatModifiers = new ArrayList<>();

        // 1. Coût Mana de base + %
        int baseMana = spell.getManaCost();
        int pctMana = spell.getPercentManaCost();
        Source manaSource = spell.getPercentManaCostSource() != null
                ? spell.getPercentManaCostSource()
                : Source.CASTER_MANA_MAX;
        int percentManaAmount = 0;
        if (pctMana > 0) {
            double manaBase = StatCalculator.getSourceValue(manaSource, p, defaultTarget);
            percentManaAmount = (int) (manaBase * pctMana / 100);
        }
        int rawManaCost = baseMana + percentManaAmount;
        int actualManaCost = rawManaCost;

        // 2. Surcoût d'arme/équipement maudit : Incantations Lourdes (CURSED_MANA_TAX)
        int cursedTaxPct = p.getSpecialEffectValue(EquipmentEffectType.CURSED_MANA_TAX);
        if (cursedTaxPct != 0 && actualManaCost > 0) {
            int taxPct = Math.abs(cursedTaxPct);
            int taxAmount = (int) Math.ceil(actualManaCost * (taxPct / 100.0));
            actualManaCost += taxAmount;
            manaModifiers.add(new SpellCostModifierDTO(
                    "Incantations Lourdes (+" + taxPct + "%)",
                    "+" + taxAmount + " Mana",
                    false));
        }

        // 3. Coût PV (Sacrifice) de base + %
        int baseHeal = spell.getHealCost();
        int pctHeal = spell.getPercentHealCost();
        Source healSource = spell.getPercentHealCostSource() != null
                ? spell.getPercentHealCostSource()
                : Source.CASTER_HEALTH_MAX;
        int percentHealAmount = 0;
        if (pctHeal > 0) {
            double healBase = StatCalculator.getSourceValue(healSource, p, defaultTarget);
            percentHealAmount = (int) (healBase * pctHeal / 100);
        }
        int rawHealCost = baseHeal + percentHealAmount;
        int actualHealCost = rawHealCost;

        // 4. Coût Chaleur de base + % + effets négatifs
        int baseHeat = spell.getHeatCost();
        int pctHeat = spell.getPercentHeatCost();
        int percentHeatAmount = pctHeat > 0 ? (int) (100.0 * pctHeat / 100.0) : 0;
        int minRequiredHeatFromEffects = 0;
        if (spell.getEffects() != null) {
            for (SpellEffect effect : spell.getEffects()) {
                if (effect.getRequiredChoiceKey() == null) {
                    if (effect instanceof generation.grimoire.entity.spell.type.effect.HeatFixedEffect hfe) {
                        if (hfe.getAmount() < 0) {
                            minRequiredHeatFromEffects += -hfe.getAmount();
                        }
                    } else if (effect instanceof generation.grimoire.entity.spell.type.effect.HeatPercentageEffect hpe) {
                        if (hpe.getPercentage() < 0) {
                            double srcVal = StatCalculator.getSourceValue(hpe.getSource(), p, defaultTarget);
                            minRequiredHeatFromEffects += (int) (-hpe.getPercentage() * srcVal);
                        }
                    }
                }
            }
        }
        int rawHeatCost = baseHeat + percentHeatAmount + minRequiredHeatFromEffects;
        int actualHeatCost = rawHeatCost;

        // 5. Ajustement des coûts via les passifs (Création, Destruction, Karma)
        int prevHeatWasMax = p.getPassiveState("destruction_heat_was_max", 0);
        int prevHeatGen = p.getPassiveState("destruction_heat_generated_this_cast", 0);
        int manaBeforePassives = actualManaCost;
        int healBeforePassives = actualHealCost;
        int heatBeforePassives = actualHeatCost;

        int[] costs = { actualManaCost, actualHealCost, actualHeatCost };
        SpellCostAdjustEvent costEvent = new SpellCostAdjustEvent(p, p, spell, costs);
        passiveDispatcher.dispatch(p, spell, costEvent);
        actualManaCost = costs[0];
        actualHealCost = costs[1];
        actualHeatCost = costs[2];

        p.setPassiveState("destruction_heat_was_max", prevHeatWasMax);
        p.setPassiveState("destruction_heat_generated_this_cast", prevHeatGen);

        // Identifier les passifs ayant réduit/modifié les coûts pour l'infobulle détaillée
        recordPassiveModifiers(spell, p,
                manaBeforePassives, actualManaCost, manaModifiers, "Mana",
                healBeforePassives, actualHealCost, healModifiers, "PV",
                heatBeforePassives, actualHeatCost, heatModifiers, "Chaleur");

        // 6. Effets d'équipements maudits / reliques / épiques liés à la dépense de mana
        if (actualManaCost > 0) {
            int hpLossPct = p.getSpecialEffectValue(EquipmentEffectType.CURSED_HP_LOSS_ON_MANA);
            if (hpLossPct != 0) {
                int hpLoss = (int) (actualManaCost * Math.abs(hpLossPct) / 100.0);
                if (hpLoss > 0) {
                    manaModifiers.add(new SpellCostModifierDTO(
                            "Brèche spirituelle (" + Math.abs(hpLossPct) + "%)",
                            "-" + hpLoss + " PV subis",
                            false));
                    healModifiers.add(new SpellCostModifierDTO(
                            "Brèche spirituelle (" + Math.abs(hpLossPct) + "% mana)",
                            "+" + hpLoss + " PV",
                            false));
                }
            }

            int vitalArcanePct = p.getSpecialEffectValue(EquipmentEffectType.VITAL_ARCANE);
            if (vitalArcanePct > 0) {
                int heal = (int) (actualManaCost * vitalArcanePct / 100.0);
                if (heal > 0) {
                    manaModifiers.add(new SpellCostModifierDTO(
                            "Arcane Vitale (+" + vitalArcanePct + "%)",
                            "+" + heal + " PV soignés",
                            true));
                }
            }
        }

        return new ComputedSpellCosts(
                actualManaCost,
                actualHealCost,
                actualHeatCost,
                rawManaCost,
                percentManaAmount,
                rawHealCost,
                percentHealAmount,
                rawHeatCost,
                percentHeatAmount,
                manaModifiers,
                healModifiers,
                heatModifiers
        );
    }

    private void recordPassiveModifiers(
            Spell spell, Personnage p,
            int manaBefore, int manaAfter, List<SpellCostModifierDTO> manaMods, String manaUnit,
            int healBefore, int healAfter, List<SpellCostModifierDTO> healMods, String healUnit,
            int heatBefore, int heatAfter, List<SpellCostModifierDTO> heatMods, String heatUnit) {

        boolean isInstantOriginal = spell.getAction() == 1
                || (spell.getAction() <= 0 && spell.getCastingType() == SpellCastingType.INSTANTANE);
        boolean creationFreeActive = isInstantOriginal
                && p.getPassiveState("creation_buds", 0) > 0
                && p.getPassiveState("creation_used_this_turn", 0) == 0;
        boolean destructionFreeActive = p.getPassiveState("destruction_heat", 0) >= 100;

        int karmaGauge = p.getPassiveState("karma_locked", 0) == 0 ? p.getPassiveState("karma_gauge", 0) : 0;
        boolean karmaIllumination = karmaGauge >= 3
                && spell.getKarmaAlignment() == KarmaAlignment.PROTECTIVE
                && spell.getSpiritualite() != null
                && p.getSpiritualite() != null
                && Objects.equals(spell.getSpiritualite().getId(), p.getSpiritualite().getId());

        addSingleResourcePassiveMod(manaBefore, manaAfter, manaMods, manaUnit,
                creationFreeActive, destructionFreeActive, karmaIllumination, karmaGauge);
        addSingleResourcePassiveMod(healBefore, healAfter, healMods, healUnit,
                creationFreeActive, destructionFreeActive, karmaIllumination, karmaGauge);
        addSingleResourcePassiveMod(heatBefore, heatAfter, heatMods, heatUnit,
                false, destructionFreeActive, karmaIllumination, karmaGauge);
    }

    private void addSingleResourcePassiveMod(
            int before, int after, List<SpellCostModifierDTO> mods, String unit,
            boolean creationFreeActive, boolean destructionFreeActive,
            boolean karmaIllumination, int karmaGauge) {
        if (before == after) {
            return;
        }
        int diff = after - before; // négatif si réduction
        if (after == 0 && before > 0) {
            if (creationFreeActive) {
                mods.add(new SpellCostModifierDTO("Voie de la Création (Bourgeon)", "-" + before + " " + unit + " (Gratuit)", true));
                return;
            }
            if (destructionFreeActive) {
                mods.add(new SpellCostModifierDTO("Voie de la Destruction (Surcharge)", "-" + before + " " + unit + " (Gratuit)", true));
                return;
            }
            if (karmaIllumination) {
                mods.add(new SpellCostModifierDTO("Karma (Illumination)", "-" + before + " " + unit + " (Gratuit)", true));
                return;
            }
        }
        if (karmaGauge > 0 && diff < 0) {
            int pct = karmaGauge * 10;
            mods.add(new SpellCostModifierDTO("Esprit Karmique (-" + pct + "%)", diff + " " + unit, true));
            return;
        }
        mods.add(new SpellCostModifierDTO("Effet Passif", (diff > 0 ? "+" : "") + diff + " " + unit, diff < 0));
    }

    /**
     * Génère un tooltip explicatif pour les conditions de spiritualité bloquantes.
     */
    private String getConditionTooltip(Personnage p, Spell spell) {
        if (p.getSpiritualite() != null && p.getSpiritualite().getNom() != null) {
            String spiritName = p.getSpiritualite().getNom().toLowerCase();
            if (spiritName.contains("esprit")) {
                return "Condition Esprit non remplie (≥ 20% PV ET Mana requis)";
            }
            if (spiritName.contains("ténèbres") || spiritName.contains("tenebres")) {
                return "Condition Ténèbres non remplie (≤ 80% PV ou Mana requis)";
            }
            if (spiritName.contains("karma")) {
                if (p.getPassiveState("karma_locked", 0) == 1) {
                    return "Karma verrouillé (corruption ou illumination)";
                }
            }
        }
        return "Condition de lancement non remplie";
    }
}
