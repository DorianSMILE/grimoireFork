package generation.grimoire.service.pve;

import generation.grimoire.dto.pve.SpellCostModifierDTO;
import generation.grimoire.dto.pve.SpellEffectPreviewDTO;
import generation.grimoire.dto.pve.SpellTargetPreviewDTO;
import generation.grimoire.entity.Spell;
import generation.grimoire.entity.SpellEffect;
import generation.grimoire.entity.personnage.Personnage;
import generation.grimoire.entity.spell.type.effect.*;
import generation.grimoire.entity.spiritualite.passif.specific.KarmaPassiveEffect;
import generation.grimoire.entity.voie.passif.specific.SuretePassiveEffect;
import generation.grimoire.enumeration.DamageType;
import generation.grimoire.enumeration.EffectTarget;
import generation.grimoire.enumeration.EquipmentEffectType;
import generation.grimoire.enumeration.KarmaAlignment;
import generation.grimoire.enumeration.Source;
import generation.grimoire.enumeration.SpellCastingType;
import generation.grimoire.enumeration.StatType;
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
        List<Personnage> allAliveEnemies = new ArrayList<>();
        Personnage defaultTarget = p;
        if (session != null && session.getEnemies() != null) {
            for (generation.grimoire.model.pve.ActiveMonster m : session.getEnemies()) {
                if (!m.isDead() && m.getAsPersonnage() != null && m.getAsPersonnage().getHealthCurrent() > 0) {
                    allAliveEnemies.add(m.getAsPersonnage());
                }
            }
            if (!allAliveEnemies.isEmpty()) {
                defaultTarget = allAliveEnemies.get(0);
            }
        }
        List<Personnage> allAliveAllies = new ArrayList<>();
        Personnage defaultAlly = p;
        if (session != null && session.getPlayers() != null) {
            for (Personnage ally : session.getPlayers()) {
                if (ally != null && ally.getHealthCurrent() > 0) {
                    allAliveAllies.add(ally);
                    if (ally != p && defaultAlly == p) {
                        defaultAlly = ally;
                    }
                }
            }
        }
        if (allAliveAllies.isEmpty()) {
            allAliveAllies.add(p);
        }

        // Calculer systématiquement les coûts réels et leurs modificateurs pour l'affichage dynamique
        ComputedSpellCosts computedCosts = computeSpellCostsForTargets(
                spell, p, defaultTarget, defaultAlly, allAliveEnemies, allAliveAllies);

        SpellAvailability avail;
        String canCastError = p.canCast(spell);
        if (canCastError != null) {
            avail = buildAvailability(spell.getId(), false, "CONDITION", canCastError, computedCosts);
        } else {
            avail = evaluateSpellRules(spell, p, computedCosts);
        }

        populateTargetPreviews(avail, spell, p, session, defaultTarget, defaultAlly, allAliveEnemies, allAliveAllies);
        return avail;
    }

    private SpellAvailability evaluateSpellRules(Spell spell, Personnage p, ComputedSpellCosts computedCosts) {
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

    private void populateTargetPreviews(
            SpellAvailability avail, Spell spell, Personnage p, CombatSession session,
            Personnage defaultTarget, Personnage defaultAlly,
            List<Personnage> allAliveEnemies, List<Personnage> allAliveAllies) {
        if (session == null) {
            return;
        }
        if (session.getEnemies() != null) {
            int enemyIdx = 0;
            for (generation.grimoire.model.pve.ActiveMonster m : session.getEnemies()) {
                if (!m.isDead() && m.getAsPersonnage() != null && m.getAsPersonnage().getHealthCurrent() > 0) {
                    Personnage enemyTarget = m.getAsPersonnage();
                    ComputedSpellCosts costs = computeSpellCostsForTargets(
                            spell, p, enemyTarget, defaultAlly, allAliveEnemies, allAliveAllies);
                    avail.getEnemyPreviews().put(enemyIdx, toTargetPreview(costs));
                }
                enemyIdx++;
            }
        }
        if (session.getPlayers() != null) {
            int allyIdx = 0;
            for (Personnage ally : session.getPlayers()) {
                if (ally != null && ally.getHealthCurrent() > 0) {
                    ComputedSpellCosts costs = computeSpellCostsForTargets(
                            spell, p, defaultTarget, ally, allAliveEnemies, allAliveAllies);
                    avail.getAllyPreviews().put(allyIdx, toTargetPreview(costs));
                }
                allyIdx++;
            }
        }
    }

    private SpellTargetPreviewDTO toTargetPreview(ComputedSpellCosts c) {
        return new SpellTargetPreviewDTO(
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
                c.heatModifiers(),
                c.effectPreviews()
        );
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
            List<SpellCostModifierDTO> heatModifiers,
            List<SpellEffectPreviewDTO> effectPreviews
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
                c.heatModifiers(),
                c.effectPreviews()
        );
    }

    private ComputedSpellCosts computeSpellCostsForTargets(Spell spell, Personnage p, Personnage target, Personnage ally) {
        return computeSpellCostsForTargets(spell, p, target, ally,
                target != null ? List.of(target) : List.of(),
                ally != null ? List.of(ally) : List.of());
    }

    private ComputedSpellCosts computeSpellCostsForTargets(
            Spell spell, Personnage p, Personnage target, Personnage ally,
            List<Personnage> allAliveEnemies, List<Personnage> allAliveAllies) {
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
            double manaBase = StatCalculator.getSourceValue(manaSource, p, target);
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
            double healBase = StatCalculator.getSourceValue(healSource, p, target);
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
                            double srcVal = StatCalculator.getSourceValue(hpe.getSource(), p, target);
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

        List<SpellEffectPreviewDTO> effectPreviews = computeSpellEffectPreviews(
                spell, p, target, ally, allAliveEnemies, allAliveAllies);

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
                heatModifiers,
                effectPreviews
        );
    }

    private List<SpellEffectPreviewDTO> computeSpellEffectPreviews(
            Spell spell, Personnage caster, Personnage defaultEnemyTarget, Personnage defaultAllyTarget) {
        return computeSpellEffectPreviews(spell, caster, defaultEnemyTarget, defaultAllyTarget,
                defaultEnemyTarget != null ? List.of(defaultEnemyTarget) : List.of(),
                defaultAllyTarget != null ? List.of(defaultAllyTarget) : List.of());
    }

    private List<SpellEffectPreviewDTO> computeSpellEffectPreviews(
            Spell spell, Personnage caster, Personnage defaultEnemyTarget, Personnage defaultAllyTarget,
            List<Personnage> allAliveEnemies, List<Personnage> allAliveAllies) {
        List<SpellEffectPreviewDTO> previews = new ArrayList<>();
        if (spell.getEffects() == null || spell.getEffects().isEmpty()) {
            return previews;
        }

        Personnage simCaster = cloneForSimulation(caster, null);
        Personnage simEnemy = defaultEnemyTarget != null
                ? cloneForSimulation(defaultEnemyTarget, null)
                : cloneNeutralTargetFromCaster(caster);
        Personnage simAlly = defaultAllyTarget != null
                ? cloneForSimulation(defaultAllyTarget, null)
                : simCaster;

        double karmaDamageAmp = computeKarmaDamageAmplification(spell, simCaster);
        double sureteHealAmp = computeSureteHealAmplification(simCaster);
        applyPreCastPassivesToSim(spell, simCaster, simEnemy);

        int i = 0;
        for (SpellEffect effect : spell.getEffects()) {
            EffectTarget tgt = effect.getEffectTarget() != null ? effect.getEffectTarget() : EffectTarget.TARGET;
            boolean isAoE = (tgt == EffectTarget.ALL_ENEMIES || tgt == EffectTarget.ALL_ALLIES || tgt == EffectTarget.ALL_COMBATANTS);

            if (!isAoE) {
                Personnage recipient = resolvePreviewRecipient(effect, simCaster, simEnemy, simAlly);
                Personnage primaryTarget = (tgt == EffectTarget.ALLY) ? simAlly : simEnemy;
                previews.add(computeSingleEffectPreview(i, effect, simCaster, recipient, primaryTarget, karmaDamageAmp, sureteHealAmp));
            } else {
                List<Personnage> targetsToHit = new ArrayList<>();
                if (tgt == EffectTarget.ALL_ENEMIES) {
                    if (allAliveEnemies != null && !allAliveEnemies.isEmpty()) {
                        targetsToHit.addAll(allAliveEnemies);
                    } else if (defaultEnemyTarget != null) {
                        targetsToHit.add(defaultEnemyTarget);
                    } else {
                        targetsToHit.add(simEnemy);
                    }
                } else if (tgt == EffectTarget.ALL_ALLIES) {
                    if (allAliveAllies != null && !allAliveAllies.isEmpty()) {
                        targetsToHit.addAll(allAliveAllies);
                    } else if (defaultAllyTarget != null) {
                        targetsToHit.add(defaultAllyTarget);
                    } else {
                        targetsToHit.add(simAlly);
                    }
                } else { // ALL_COMBATANTS
                    if (allAliveAllies != null && !allAliveAllies.isEmpty()) {
                        targetsToHit.addAll(allAliveAllies);
                    } else {
                        targetsToHit.add(simAlly);
                    }
                    if (allAliveEnemies != null && !allAliveEnemies.isEmpty()) {
                        targetsToHit.addAll(allAliveEnemies);
                    } else {
                        targetsToHit.add(simEnemy);
                    }
                }

                List<SpellEffectPreviewDTO> targetResults = new ArrayList<>();
                for (Personnage rawTarget : targetsToHit) {
                    Personnage targetClone = cloneForSimulation(rawTarget, null);
                    applySureteDebuffIfActive(simCaster, targetClone);
                    targetResults.add(computeSingleEffectPreview(
                            i, effect, simCaster, targetClone, targetClone, karmaDamageAmp, sureteHealAmp));
                }

                int minVal = Integer.MAX_VALUE;
                int maxVal = Integer.MIN_VALUE;
                int minHp = Integer.MAX_VALUE;
                int maxHp = Integer.MIN_VALUE;
                int minShield = Integer.MAX_VALUE;
                int maxShield = Integer.MIN_VALUE;
                int minBrut = Integer.MAX_VALUE;
                int maxBrut = Integer.MIN_VALUE;
                boolean sourceResolved = false;
                int pctMod = 0;

                for (SpellEffectPreviewDTO r : targetResults) {
                    minVal = Math.min(minVal, r.calculatedValue());
                    maxVal = Math.max(maxVal, r.calculatedValue());
                    minHp = Math.min(minHp, r.hpDamage());
                    maxHp = Math.max(maxHp, r.hpDamage());
                    minShield = Math.min(minShield, r.shieldAbsorbed());
                    maxShield = Math.max(maxShield, r.shieldAbsorbed());
                    minBrut = Math.min(minBrut, r.extraBrutDamage());
                    maxBrut = Math.max(maxBrut, r.extraBrutDamage());
                    if (r.sourceResolvedToFlat()) sourceResolved = true;
                    pctMod = r.calculatedPercentModifier();
                }

                previews.add(SpellEffectPreviewDTO.forAreaOfEffect(
                        i,
                        effect.getId(),
                        minVal,
                        maxVal,
                        pctMod,
                        sourceResolved,
                        minHp,
                        maxHp,
                        minShield,
                        maxShield,
                        minBrut,
                        maxBrut
                ));
            }
            i++;
        }
        return previews;
    }

    private Personnage cloneForSimulation(Personnage src, Personnage fallback) {
        if (src == null) {
            return fallback != null ? cloneForSimulation(fallback, null) : new Personnage();
        }
        Personnage copy = new Personnage();
        copy.setId(src.getId());
        copy.setName(src.getName());
        copy.setTeamId(src.getTeamId());
        copy.setMonsterType(src.getMonsterType());
        copy.setMonsterName(src.getMonsterName());
        copy.setHealthMax(src.getHealthMax());
        copy.setHealthCurrent(src.getHealthCurrent());
        copy.setManaMax(src.getManaMax());
        copy.setManaCurrent(src.getManaCurrent());
        copy.setPower(src.getPower());
        copy.setStrength(src.getStrength());
        copy.setArmor(src.getArmor());
        copy.setResistance(src.getResistance());
        copy.setCrit(src.getCrit());
        copy.setSpeed(src.getSpeed());
        copy.setRegenHp(src.getRegenHp());
        copy.setRegenMana(src.getRegenMana());
        copy.setVoie(src.getVoie());
        copy.setVoieLevel(src.getVoieLevel());
        copy.setSpiritualite(src.getSpiritualite());
        copy.setSpiritualiteLevel(src.getSpiritualiteLevel());
        copy.setUsedCheatDeath(src.isUsedCheatDeath());
        if (src.getEquipments() != null) {
            copy.setEquipments(new ArrayList<>(src.getEquipments()));
        }
        if (src.getPassiveStates() != null) {
            copy.setPassiveStates(new java.util.HashMap<>(src.getPassiveStates()));
        }
        if (src.getActiveBuffs() != null) {
            List<BuffDebuffEffect> buffs = new ArrayList<>();
            for (BuffDebuffEffect b : src.getActiveBuffs()) {
                if (b != null) {
                    buffs.add(b.cloneEffect());
                }
            }
            copy.setActiveBuffs(buffs);
        }
        if (src.getActiveShields() != null) {
            List<generation.grimoire.entity.personnage.ActiveShield> shields = new ArrayList<>();
            for (generation.grimoire.entity.personnage.ActiveShield s : src.getActiveShields()) {
                if (s != null && s.getAmount() > 0) {
                    shields.add(new generation.grimoire.entity.personnage.ActiveShield(
                            s.getAmount(), s.getDuration(), s.getSourceName()));
                }
            }
            copy.setActiveShields(shields);
        }
        if (src.getActiveDamageOverTimeEffects() != null) {
            List<DamageOverTimeEffect> dots = new ArrayList<>();
            for (DamageOverTimeEffect d : src.getActiveDamageOverTimeEffects()) {
                if (d != null) {
                    dots.add(d.cloneEffect());
                }
            }
            copy.setActiveDamageOverTimeEffects(dots);
        }
        return copy;
    }

    private Personnage cloneNeutralTargetFromCaster(Personnage caster) {
        Personnage dummy = new Personnage();
        if (caster != null) {
            dummy.setHealthMax(caster.getHealthMax());
            dummy.setHealthCurrent(caster.getHealthCurrent());
            dummy.setManaMax(caster.getManaMax());
            dummy.setManaCurrent(caster.getManaCurrent());
            dummy.setPower(caster.getPower());
            dummy.setStrength(caster.getStrength());
        } else {
            dummy.setHealthMax(100);
            dummy.setHealthCurrent(100);
            dummy.setManaMax(100);
            dummy.setManaCurrent(100);
        }
        return dummy;
    }

    private void applyPreCastPassivesToSim(Spell spell, Personnage simCaster, Personnage simEnemy) {
        if (simCaster == null || spell.getEffects() == null) {
            return;
        }
        if (simCaster.getVoie() != null && simCaster.getVoie().getPassiveEffects() != null) {
            boolean hasSurete = simCaster.getVoie().getPassiveEffects().stream()
                    .anyMatch(p -> p instanceof SuretePassiveEffect);
            if (hasSurete && simCaster.getPassiveState("surete_points", 0) >= 100) {
                boolean touchesEnemy = false;
                boolean touchesSelf = false;
                for (SpellEffect eff : spell.getEffects()) {
                    EffectTarget tgt = eff.getEffectTarget() != null ? eff.getEffectTarget() : EffectTarget.TARGET;
                    if (tgt == EffectTarget.TARGET || tgt == EffectTarget.ALL_ENEMIES || tgt == EffectTarget.ALL_COMBATANTS) {
                        touchesEnemy = true;
                    }
                    if (tgt == EffectTarget.CASTER || tgt == EffectTarget.ALL_COMBATANTS) {
                        touchesSelf = true;
                    }
                }
                if (touchesEnemy && simEnemy != null) {
                    applySureteDebuffIfActive(simCaster, simEnemy);
                }
                if (touchesSelf) {
                    BuffDebuffEffect buffPower = new BuffDebuffEffect();
                    buffPower.setStatAffected(StatType.POWER);
                    buffPower.setModifier(0.20);
                    buffPower.setDuration(3);
                    simCaster.getActiveBuffs().add(buffPower);
                }
            }
        }
    }

    private void applySureteDebuffIfActive(Personnage simCaster, Personnage target) {
        if (simCaster == null || target == null || simCaster.getVoie() == null || simCaster.getVoie().getPassiveEffects() == null) {
            return;
        }
        boolean hasSurete = simCaster.getVoie().getPassiveEffects().stream()
                .anyMatch(p -> p instanceof SuretePassiveEffect);
        if (hasSurete && simCaster.getPassiveState("surete_points", 0) >= 100) {
            if (target.getActiveBuffs() == null) {
                target.setActiveBuffs(new ArrayList<>());
            }
            BuffDebuffEffect debuffMag = new BuffDebuffEffect();
            debuffMag.setStatAffected(StatType.DAMAGE_TAKEN_MAGIC);
            debuffMag.setModifier(0.20);
            debuffMag.setDuration(2);
            target.getActiveBuffs().add(debuffMag);

            BuffDebuffEffect debuffPhys = new BuffDebuffEffect();
            debuffPhys.setStatAffected(StatType.DAMAGE_TAKEN_PHYSIC);
            debuffPhys.setModifier(0.20);
            debuffPhys.setDuration(2);
            target.getActiveBuffs().add(debuffPhys);
        }
    }

    private Personnage resolveTargetForSource(Source source, Personnage recipient, Personnage primaryTarget) {
        if (source != null && source.name().startsWith("TARGET_")) {
            return primaryTarget != null ? primaryTarget : recipient;
        }
        return recipient;
    }

    private Personnage resolvePreviewRecipient(
            SpellEffect effect, Personnage caster, Personnage defaultEnemyTarget, Personnage defaultAllyTarget) {
        if (effect instanceof HeatOverTimeEffect || effect instanceof HeatFixedEffect || effect instanceof HeatPercentageEffect) {
            return caster;
        }
        EffectTarget targetType = effect.getEffectTarget();
        if (targetType == null) {
            return defaultEnemyTarget != null ? defaultEnemyTarget : caster;
        }
        return switch (targetType) {
            case CASTER, ALL_ALLIES -> caster;
            case ALLY -> defaultAllyTarget != null ? defaultAllyTarget : caster;
            case TARGET, ALL_ENEMIES, ALL_COMBATANTS -> defaultEnemyTarget != null ? defaultEnemyTarget : caster;
        };
    }

    private double computeKarmaDamageAmplification(Spell spell, Personnage caster) {
        if (caster == null || caster.getSpiritualite() == null || caster.getSpiritualite().getPassiveEffects() == null) {
            return 1.0;
        }
        boolean hasKarmaPassive = caster.getSpiritualite().getPassiveEffects().stream()
                .anyMatch(p -> p instanceof KarmaPassiveEffect);
        if (!hasKarmaPassive || caster.getPassiveState("karma_locked", 0) != 0) {
            return 1.0;
        }
        int gauge = caster.getPassiveState("karma_gauge", 0);
        double amp = 1.0;
        if (gauge < 0) {
            amp *= (1.0 + Math.abs(gauge) * 0.1);
        }
        if (spell.getSpiritualite() != null
                && Objects.equals(spell.getSpiritualite().getId(), caster.getSpiritualite().getId())
                && spell.getKarmaAlignment() == KarmaAlignment.OFFENSIVE
                && (gauge - 1) <= -4) {
            amp *= 1.5;
        }
        return amp;
    }

    private double computeSureteHealAmplification(Personnage caster) {
        if (caster == null || caster.getVoie() == null || caster.getVoie().getPassiveEffects() == null) {
            return 1.0;
        }
        boolean hasSuretePassive = caster.getVoie().getPassiveEffects().stream()
                .anyMatch(p -> p instanceof SuretePassiveEffect);
        if (hasSuretePassive && caster.getPassiveState("surete_points", 0) >= 100) {
            return 1.5;
        }
        return 1.0;
    }

    private SpellEffectPreviewDTO computeSingleEffectPreview(
            int index, SpellEffect effect, Personnage caster, Personnage recipient, Personnage primaryTarget,
            double karmaDamageAmp, double sureteHealAmp) {
        if (effect instanceof DamageFixedEffect dfe) {
            DamageType dt = dfe.getDamageType();
            double amp = dfe.getAmplificationMultiplier();
            if (dt == DamageType.PHYSIC || dt == DamageType.MAGIC) {
                amp *= karmaDamageAmp;
            }
            double dmg = dfe.getDamage() * amp;
            dmg = dfe.applyEquipmentModifiers(dmg, caster, recipient, dt);
            int outgoingDmg = computeOutgoingDealDamage(caster, (int) dmg, dt);
            SimulatedDamageResult res = simulateDealAndTakeDamage(caster, recipient, outgoingDmg, dt);
            int totalDamage = res.hpDamage() + res.shieldAbsorbed();
            return new SpellEffectPreviewDTO(index, dfe.getId(), totalDamage, 0, false,
                    res.hpDamage(), res.shieldAbsorbed(), res.extraBrutDamage());
        }
        if (effect instanceof DamagePercentageEffect dpe) {
            DamageType dt = dpe.getDamageType();
            double amp = dpe.getAmplificationMultiplier();
            if (dt == DamageType.PHYSIC || dt == DamageType.MAGIC) {
                amp *= karmaDamageAmp;
            }
            Personnage targetForSrc = resolveTargetForSource(dpe.getDamageSource(), recipient, primaryTarget);
            double sourceVal = StatCalculator.getSourceValue(dpe.getDamageSource(), caster, targetForSrc);
            double dmg = dpe.calculateDamage(sourceVal) * amp;
            dmg = dpe.applyEquipmentModifiers(dmg, caster, recipient, dt);
            int outgoingDmg = computeOutgoingDealDamage(caster, (int) dmg, dt);
            SimulatedDamageResult res = simulateDealAndTakeDamage(caster, recipient, outgoingDmg, dt);
            int totalDamage = res.hpDamage() + res.shieldAbsorbed();
            return new SpellEffectPreviewDTO(index, dpe.getId(), totalDamage, 0, true,
                    res.hpDamage(), res.shieldAbsorbed(), res.extraBrutDamage());
        }
        if (effect instanceof DamageOverTimeEffect dot) {
            DamageType dt = dot.getDamageType();
            double amp = dot.getAmplificationMultiplier();
            if (dt == DamageType.PHYSIC || dt == DamageType.MAGIC) {
                amp *= karmaDamageAmp;
            }
            int baseDmg = dot.getFixedDamagePerTick();
            boolean hasPct = dot.getPercentageDamagePerTick() > 0;
            if (hasPct) {
                Personnage targetForSrc = resolveTargetForSource(dot.getDamageSource(), recipient, primaryTarget);
                double sourceVal = StatCalculator.getSourceValue(dot.getDamageSource(), caster, targetForSrc);
                baseDmg += (int) (sourceVal * dot.getPercentageDamagePerTick());
            }
            int totalDmg = (int) (baseDmg * amp);
            double reducedDmg = dot.applyEquipmentModifiers(totalDmg, caster, recipient, dt);
            int tickDmg = computeMitigatedDamageBeforeShields(
                    recipient, (int) reducedDmg, dt, Boolean.TRUE.equals(dot.getBurn()));
            if (recipient != null && recipient.getActiveDamageOverTimeEffects() != null) {
                DamageOverTimeEffect cloneDot = dot.cloneEffect();
                cloneDot.setFixedDamagePerTick((int) reducedDmg);
                cloneDot.setPercentageDamagePerTick(0);
                recipient.getActiveDamageOverTimeEffects().add(cloneDot);
            }
            return new SpellEffectPreviewDTO(index, dot.getId(), tickDmg, 0, hasPct);
        }
        if (effect instanceof HealFixedEffect hfe) {
            boolean isAllyTarget = hfe.getEffectTarget() == EffectTarget.ALLY || hfe.getEffectTarget() == EffectTarget.ALL_ALLIES;
            double amp = hfe.getAmplificationMultiplier() * (isAllyTarget ? sureteHealAmp : 1.0);
            double healGivenMult = Math.max(0, caster.getStatBuffMultiplier(StatType.HEAL_GIVEN));
            int rawHeal = (int) (hfe.getHealAmount() * amp * healGivenMult);
            int finalHeal = rawHeal > 0 ? computeReceivedHeal(recipient, rawHeal) : rawHeal;
            if (recipient != null) {
                recipient.setHealthCurrent(Math.max(0, Math.min(recipient.getTotalHealthMax(), recipient.getHealthCurrent() + finalHeal)));
            }
            return new SpellEffectPreviewDTO(index, hfe.getId(), finalHeal, 0, false);
        }
        if (effect instanceof HealPercentageEffect hpe) {
            boolean isAllyTarget = hpe.getEffectTarget() == EffectTarget.ALLY || hpe.getEffectTarget() == EffectTarget.ALL_ALLIES;
            double amp = hpe.getAmplificationMultiplier() * (isAllyTarget ? sureteHealAmp : 1.0);
            Personnage targetForSrc = resolveTargetForSource(hpe.getHealSource(), recipient, primaryTarget);
            double sourceVal = StatCalculator.getSourceValue(hpe.getHealSource(), caster, targetForSrc);
            double healGivenMult = Math.max(0, caster.getStatBuffMultiplier(StatType.HEAL_GIVEN));
            int rawHeal = (int) (hpe.calculateHeal(sourceVal) * amp * healGivenMult);
            int finalHeal = rawHeal > 0 ? computeReceivedHeal(recipient, rawHeal) : rawHeal;
            if (recipient != null) {
                recipient.setHealthCurrent(Math.max(0, Math.min(recipient.getTotalHealthMax(), recipient.getHealthCurrent() + finalHeal)));
            }
            return new SpellEffectPreviewDTO(index, hpe.getId(), finalHeal, 0, true);
        }
        if (effect instanceof HealOverTimeEffect hot) {
            boolean isAllyTarget = hot.getEffectTarget() == EffectTarget.ALLY || hot.getEffectTarget() == EffectTarget.ALL_ALLIES;
            double amp = hot.getAmplificationMultiplier() * (isAllyTarget ? sureteHealAmp : 1.0);
            int totalHeal = hot.getFixedHealPerTick();
            boolean hasPct = hot.getPercentageHealPerTick() != 0;
            if (hasPct) {
                Personnage targetForSrc = resolveTargetForSource(hot.getHealSource(), recipient, primaryTarget);
                double sourceVal = StatCalculator.getSourceValue(hot.getHealSource(), caster, targetForSrc);
                totalHeal += (int) (sourceVal * hot.getPercentageHealPerTick());
            }
            double healGivenMult = Math.max(0, caster.getStatBuffMultiplier(StatType.HEAL_GIVEN));
            int rawHeal = (int) (totalHeal * amp * healGivenMult);
            int finalHeal = rawHeal > 0 ? computeReceivedHeal(recipient, rawHeal) : rawHeal;
            return new SpellEffectPreviewDTO(index, hot.getId(), finalHeal, 0, hasPct);
        }
        if (effect instanceof ManaFixedEffect mfe) {
            int finalMana = (int) (mfe.getManaAmount() * mfe.getAmplificationMultiplier());
            if (recipient != null) {
                recipient.setManaCurrent(Math.max(0, Math.min(recipient.getTotalManaMax(), recipient.getManaCurrent() + finalMana)));
            }
            return new SpellEffectPreviewDTO(index, mfe.getId(), finalMana, 0, false);
        }
        if (effect instanceof ManaPercentageEffect mpe) {
            Source src = mpe.getManaSource() != null ? mpe.getManaSource() : Source.TARGET_MANA_MAX;
            Personnage targetForSrc = resolveTargetForSource(src, recipient, primaryTarget);
            double sourceVal = StatCalculator.getSourceValue(src, caster, targetForSrc);
            int finalMana = (int) (mpe.calculateMana(sourceVal) * mpe.getAmplificationMultiplier());
            if (recipient != null) {
                recipient.setManaCurrent(Math.max(0, Math.min(recipient.getTotalManaMax(), recipient.getManaCurrent() + finalMana)));
            }
            return new SpellEffectPreviewDTO(index, mpe.getId(), finalMana, 0, true);
        }
        if (effect instanceof ManaOverTimeEffect mot) {
            int totalMana = mot.getFixedManaPerTick();
            boolean hasPct = mot.getPercentageManaPerTick() != 0;
            if (hasPct) {
                Personnage targetForSrc = resolveTargetForSource(mot.getManaSource(), recipient, primaryTarget);
                double sourceVal = StatCalculator.getSourceValue(mot.getManaSource(), caster, targetForSrc);
                totalMana += (int) (sourceVal * mot.getPercentageManaPerTick());
            }
            totalMana = (int) (totalMana * mot.getAmplificationMultiplier());
            return new SpellEffectPreviewDTO(index, mot.getId(), totalMana, 0, hasPct);
        }
        if (effect instanceof ShieldEffect se) {
            double shieldAmount = se.getFixedValue();
            boolean hasPct = se.getShieldSource() != null && se.getPercentage() > 0;
            if (hasPct) {
                Personnage targetForSrc = resolveTargetForSource(se.getShieldSource(), recipient, primaryTarget);
                double sourceVal = StatCalculator.getSourceValue(se.getShieldSource(), caster, targetForSrc);
                shieldAmount += sourceVal * se.getPercentage();
            }
            double shieldGivenMult = Math.max(0, caster.getStatBuffMultiplier(StatType.SHIELD_GIVEN));
            shieldAmount *= shieldGivenMult;
            int rawShield = (int) shieldAmount;
            double shieldReceivedMult = recipient != null
                    ? Math.max(0, recipient.getStatBuffMultiplier(StatType.SHIELD_RECEIVED))
                    : 1.0;
            int finalShield = (int) (rawShield * shieldReceivedMult);
            if (recipient != null && finalShield > 0) {
                recipient.addShield(rawShield, se.getDuration(), "Sim");
            }
            return new SpellEffectPreviewDTO(index, se.getId(), finalShield, 0, hasPct);
        }
        if (effect instanceof BuffDebuffEffect bde) {
            int totalFlat = bde.getFlatValue();
            int pctMod = 0;
            boolean resolvedSource = false;
            double rawModToApply = 0.0;
            if (bde.getModifier() != 0) {
                if (bde.getModifierSource() != null) {
                    Personnage targetForSrc = resolveTargetForSource(bde.getModifierSource(), recipient, primaryTarget);
                    double baseVal = StatCalculator.getSourceValue(bde.getModifierSource(), caster, targetForSrc);
                    totalFlat += (int) Math.round(baseVal * bde.getModifier());
                    resolvedSource = true;
                } else {
                    pctMod = (int) Math.round(bde.getModifier() * 100);
                    rawModToApply = bde.getModifier();
                }
            }
            applySimulatedBuffDebuff(recipient, bde, totalFlat, rawModToApply);
            return new SpellEffectPreviewDTO(index, bde.getId(), totalFlat, pctMod, resolvedSource);
        }
        if (effect instanceof PurgeEffect pe) {
            if (recipient != null) {
                recipient.purgeAllBuffsAndDebuffs();
            }
            return new SpellEffectPreviewDTO(index, pe.getId(), 0, 0, false);
        }
        if (effect instanceof HeatFixedEffect hfe) {
            return new SpellEffectPreviewDTO(index, hfe.getId(), hfe.getAmount(), 0, false);
        }
        if (effect instanceof HeatPercentageEffect hpe) {
            Personnage targetForSrc = resolveTargetForSource(hpe.getSource(), caster, primaryTarget);
            double sourceVal = StatCalculator.getSourceValue(hpe.getSource(), caster, targetForSrc);
            int amount = (int) (sourceVal * hpe.getPercentage());
            return new SpellEffectPreviewDTO(index, hpe.getId(), amount, 0, true);
        }
        if (effect instanceof HeatOverTimeEffect hot) {
            int amount = hot.getFixedValue();
            boolean hasPct = hot.getPercentage() != 0;
            if (hasPct) {
                Personnage targetForSrc = resolveTargetForSource(hot.getSource(), caster, primaryTarget);
                double sourceVal = StatCalculator.getSourceValue(hot.getSource(), caster, targetForSrc);
                amount += (int) (sourceVal * hot.getPercentage());
            }
            return new SpellEffectPreviewDTO(index, hot.getId(), amount, 0, hasPct);
        }
        if (effect instanceof BudEffect be) {
            return new SpellEffectPreviewDTO(index, be.getId(), be.getAmount(), 0, false);
        }
        return new SpellEffectPreviewDTO(index, effect.getId(), 0, 0, false);
    }

    private void applySimulatedBuffDebuff(
            Personnage recipient, BuffDebuffEffect bde, int totalFlatToApply, double totalModifierToApply) {
        if (recipient == null) return;
        if (bde.getStatAffected() == StatType.AME_DETACHEE) {
            boolean exists = recipient.getActiveBuffs().stream()
                    .anyMatch(b -> b.getStatAffected() == StatType.AME_DETACHEE);
            if (!exists) {
                BuffDebuffEffect clone = bde.cloneEffect();
                clone.setDuration(3);
                recipient.getActiveBuffs().add(clone);
            }
            return;
        }
        if (totalFlatToApply != 0) {
            if (bde.getDuration() > 0) {
                BuffDebuffEffect cloneFlat = bde.cloneEffect();
                cloneFlat.setFlatValue(totalFlatToApply);
                cloneFlat.setModifier(0);
                recipient.getActiveBuffs().add(cloneFlat);
            } else {
                try {
                    recipient.applyFlatBuff(bde.getStatAffected(), totalFlatToApply);
                } catch (Exception ignored) {
                }
            }
        }
        if (totalModifierToApply != 0) {
            BuffDebuffEffect cloneMult = bde.cloneEffect();
            cloneMult.setFlatValue(0);
            cloneMult.setModifier(totalModifierToApply);
            recipient.getActiveBuffs().add(cloneMult);
        }
    }

    private record SimulatedDamageResult(int hpDamage, int shieldAbsorbed, int extraBrutDamage) {}

    private SimulatedDamageResult simulateDealAndTakeDamage(
            Personnage caster, Personnage target, int outgoingDmg, DamageType dt) {
        if (target == null) {
            return new SimulatedDamageResult(outgoingDmg, 0, 0);
        }
        DamageType effectiveType = dt != null ? dt : DamageType.MAGIC;
        int extraBrutTotal = 0;

        // 1. Passif Voie de la Trahison (s'applique avant l'impact physique principal)
        if (effectiveType == DamageType.PHYSIC && caster != null
                && caster.getVoie() != null && caster.getVoie().getPassiveEffects() != null) {
            boolean hasTrahison = caster.getVoie().getPassiveEffects().stream()
                    .anyMatch(p -> p instanceof generation.grimoire.entity.voie.passif.specific.TrahisonPassiveEffect);
            if (hasTrahison) {
                if (caster.getPassiveState("trahison_used_this_turn", 0) == 0) {
                    int extra = (int) Math.round(outgoingDmg * 0.10);
                    if (extra > 0) {
                        SimulatedDamageResult r = simulateTakeDamage(target, extra, DamageType.BRUT, caster, false);
                        extraBrutTotal += r.hpDamage() + r.shieldAbsorbed();
                    }
                    caster.setPassiveState("trahison_used_this_turn", 1);
                }
                if (caster.getPassiveState("trahison_low_hp_used_this_turn", 0) == 0
                        && target.getHealthCurrent() <= target.getHealthMax() * 0.5) {
                    int extra = (int) Math.round(outgoingDmg * 0.20);
                    if (extra > 0) {
                        SimulatedDamageResult r = simulateTakeDamage(target, extra, DamageType.BRUT, caster, false);
                        extraBrutTotal += r.hpDamage() + r.shieldAbsorbed();
                    }
                    caster.setPassiveState("trahison_low_hp_used_this_turn", 1);
                }
                if (caster.getPassiveState("trahison_debuff_used_this_turn", 0) == 0 && target.hasDebuff()) {
                    int extra = (int) Math.round(outgoingDmg * 0.15);
                    if (extra > 0) {
                        SimulatedDamageResult r = simulateTakeDamage(target, extra, DamageType.BRUT, caster, false);
                        extraBrutTotal += r.hpDamage() + r.shieldAbsorbed();
                    }
                    caster.setPassiveState("trahison_debuff_used_this_turn", 1);
                }
            }
        }

        // 2. Impact principal (avec gestion Hybride si le lanceur est un monstre Hybride)
        int mainHpDmg = 0;
        int mainShieldAbs = 0;
        int baseForDemon = outgoingDmg;
        if (caster != null
                && caster.getMonsterType() == generation.grimoire.enumeration.MonsterType.HYBRIDE
                && effectiveType != DamageType.BRUT) {
            int total = (int) (outgoingDmg * 1.2);
            SimulatedDamageResult r1 = simulateTakeDamage(target, total / 2, DamageType.PHYSIC, caster, false);
            SimulatedDamageResult r2 = simulateTakeDamage(target, total - (total / 2), DamageType.MAGIC, caster, false);
            mainHpDmg = r1.hpDamage() + r2.hpDamage();
            mainShieldAbs = r1.shieldAbsorbed() + r2.shieldAbsorbed();
            baseForDemon = total;
        } else {
            SimulatedDamageResult r = simulateTakeDamage(target, outgoingDmg, effectiveType, caster, false);
            mainHpDmg = r.hpDamage();
            mainShieldAbs = r.shieldAbsorbed();
        }

        // 3. Passif Démon (+10% brut)
        if (caster != null && caster.getMonsterType() == generation.grimoire.enumeration.MonsterType.DEMON) {
            int brutDmg = (int) Math.ceil(baseForDemon * 0.10);
            if (brutDmg > 0) {
                SimulatedDamageResult r = simulateTakeDamage(target, brutDmg, DamageType.BRUT, caster, false);
                extraBrutTotal += r.hpDamage() + r.shieldAbsorbed();
            }
        }

        return new SimulatedDamageResult(mainHpDmg, mainShieldAbs, extraBrutTotal);
    }

    private int computeMitigatedDamageBeforeShields(
            Personnage p, int damage, DamageType damageType, boolean isBurn) {
        if (p == null) return damage;
        DamageType dt = damageType != null ? damageType : DamageType.MAGIC;
        if (dt == DamageType.INCOMPRESSIBLE) {
            return damage;
        }
        int workingDamage = damage;
        if (p.getMonsterType() == generation.grimoire.enumeration.MonsterType.REPTILE && dt == DamageType.PHYSIC) {
            workingDamage = (int) Math.ceil(workingDamage * 0.85);
        }

        double effectiveArmor = p.getArmor() + p.getStatFlatBonus(StatType.ARMURE);
        double effectiveResistance = p.getResistance() + p.getStatFlatBonus(StatType.RESISTANCE);
        double constant = 100.0;

        double resistanceValue = switch (dt) {
            case PHYSIC -> effectiveArmor * Math.max(0, p.getStatBuffMultiplier(StatType.ARMURE));
            case MAGIC -> {
                double res = effectiveResistance * Math.max(0, p.getStatBuffMultiplier(StatType.RESISTANCE));
                yield isBurn ? res * 2 : res;
            }
            default -> 0.0;
        };

        double reductionFactor;
        if (resistanceValue >= 0) {
            reductionFactor = Math.min(resistanceValue / (resistanceValue + constant), 0.90);
        } else {
            reductionFactor = resistanceValue / (Math.abs(resistanceValue) + constant);
        }

        StatType statType = switch (dt) {
            case MAGIC -> StatType.DAMAGE_TAKEN_MAGIC;
            case PHYSIC -> StatType.DAMAGE_TAKEN_PHYSIC;
            default -> StatType.DAMAGE_TAKEN_BRUT;
        };

        double damageTakenMultiplier = Math.max(0.0, p.getStatBuffMultiplier(statType));
        int cursedVul = p.getSpecialEffectValue(EquipmentEffectType.CURSED_VULNERABILITY);
        if (cursedVul != 0) {
            damageTakenMultiplier += (Math.abs(cursedVul) / 100.0);
        }
        if (dt == DamageType.PHYSIC) {
            int shroud = p.getPassiveState("PHYSICAL_SHROUD", 0);
            if (shroud > 0) {
                damageTakenMultiplier -= (shroud / 100.0);
            }
        } else if (dt == DamageType.MAGIC) {
            int shroud = p.getPassiveState("MAGIC_SHROUD", 0);
            if (shroud > 0) {
                damageTakenMultiplier -= (shroud / 100.0);
            }
        }
        if (damageTakenMultiplier < 0) {
            damageTakenMultiplier = 0;
        }

        int flat = p.getStatFlatBonus(statType);
        double damageAfterBuff = workingDamage * damageTakenMultiplier + flat;
        double finalDamage = damageAfterBuff * (1.0 - reductionFactor);

        int effectiveDamage = (int) finalDamage;
        if (damageAfterBuff > 0 && effectiveDamage < 1) {
            effectiveDamage = 1;
        }
        return Math.max(0, effectiveDamage);
    }

    private SimulatedDamageResult simulateTakeDamage(
            Personnage p, int damage, DamageType damageType, Personnage caster, boolean isBurn) {
        if (p == null) {
            return new SimulatedDamageResult(damage, 0, 0);
        }
        DamageType dt = damageType != null ? damageType : DamageType.MAGIC;
        if (dt == DamageType.INCOMPRESSIBLE) {
            p.setHealthCurrent(Math.max(0, p.getHealthCurrent() - damage));
            return new SimulatedDamageResult(damage, 0, 0);
        }

        int effectiveDamage = computeMitigatedDamageBeforeShields(p, damage, dt, isBurn);

        // Capillarité
        if (caster != null && caster != p && (dt == DamageType.PHYSIC || dt == DamageType.MAGIC)) {
            int capillarityPct = caster.getSpecialEffectValue(EquipmentEffectType.CAPILLARITY);
            if (capillarityPct > 0 && p.getManaCurrent() > 0 && effectiveDamage > 0) {
                int desiredDrain = (int) Math.ceil(effectiveDamage * (capillarityPct / 100.0));
                int manaDrained = Math.min(effectiveDamage, Math.min(p.getManaCurrent(), desiredDrain));
                if (manaDrained > 0) {
                    p.setManaCurrent(p.getManaCurrent() - manaDrained);
                    effectiveDamage -= manaDrained;
                    caster.setManaCurrent(caster.getManaCurrent() + manaDrained);
                }
            }
        }

        // Perce-Bouclier / Bouclier Percé
        double casterPenetrationPct = 0.0;
        if (caster != null && caster.getActiveBuffs() != null) {
            boolean hasPenBuff = caster.getActiveBuffs().stream()
                    .anyMatch(b -> b.affectsStatType(StatType.SHIELD_PENETRATION) && b.getFlatValue() == 0);
            if (hasPenBuff) {
                casterPenetrationPct = caster.getStatBuffMultiplier(StatType.SHIELD_PENETRATION) - 1.0;
            }
        }

        double targetPiercedPct = 0.0;
        if (p.getActiveBuffs() != null) {
            boolean hasPiercedBuff = p.getActiveBuffs().stream()
                    .anyMatch(b -> b.affectsStatType(StatType.SHIELD_PIERCED) && b.getFlatValue() == 0);
            if (hasPiercedBuff) {
                targetPiercedPct = p.getStatBuffMultiplier(StatType.SHIELD_PIERCED) - 1.0;
            }
        }

        double targetPenetrationPctDebuff = 0.0;
        if (p.getActiveBuffs() != null) {
            boolean hasTargetPenDebuff = p.getActiveBuffs().stream()
                    .anyMatch(b -> b.affectsStatType(StatType.SHIELD_PENETRATION) && b.getFlatValue() == 0);
            if (hasTargetPenDebuff) {
                double targetPenetrationMult = p.getStatBuffMultiplier(StatType.SHIELD_PENETRATION);
                if (targetPenetrationMult < 1.0) {
                    targetPenetrationPctDebuff = 1.0 - targetPenetrationMult;
                }
            }
        }

        double totalBypassPct = casterPenetrationPct + targetPiercedPct + targetPenetrationPctDebuff;

        int casterPenetrationFlat = caster != null ? caster.getStatFlatBonus(StatType.SHIELD_PENETRATION) : 0;
        int targetPiercedFlat = p.getStatFlatBonus(StatType.SHIELD_PIERCED);
        int targetPenetrationFlatDebuff = p.getStatFlatBonus(StatType.SHIELD_PENETRATION);
        int targetPiercedFlatCombined = targetPiercedFlat + (targetPenetrationFlatDebuff < 0 ? -targetPenetrationFlatDebuff : 0);

        int totalBypassFlat = casterPenetrationFlat + targetPiercedFlatCombined;

        int bypassDamage = 0;
        if (totalBypassPct > 0 || totalBypassFlat > 0) {
            double rawBypass = effectiveDamage * Math.min(1.0, totalBypassPct) + totalBypassFlat;
            bypassDamage = (int) Math.round(Math.min(effectiveDamage, Math.max(0, rawBypass)));
        }

        int remainingDamage = effectiveDamage - bypassDamage;

        // Bouclier de Mana
        int manaShieldAbsorbed = 0;
        int manaShieldPct = p.getSpecialEffectValue(EquipmentEffectType.MANA_SHIELD);
        if (manaShieldPct > 0 && remainingDamage > 0) {
            int manaAbsorb = Math.min(p.getManaCurrent(), (int) Math.ceil(remainingDamage * (manaShieldPct / 100.0)));
            if (manaAbsorb > 0) {
                p.setManaCurrent(p.getManaCurrent() - manaAbsorb);
                remainingDamage -= manaAbsorb;
                manaShieldAbsorbed = manaAbsorb;
            }
        }

        // Boucliers actifs
        int shieldPointsBroken = 0;
        if (remainingDamage > 0 && p.getActiveShields() != null && !p.getActiveShields().isEmpty()) {
            double shieldDamageMult = 1.0;
            int shieldDamageFlat = 0;
            if (caster != null) {
                if (dt == DamageType.MAGIC) {
                    shieldDamageMult = caster.getStatBuffMultiplier(StatType.DAMAGE_GIVEN_MAGIC_TO_SHIELD);
                    shieldDamageFlat = caster.getStatFlatBonus(StatType.DAMAGE_GIVEN_MAGIC_TO_SHIELD);
                } else if (dt == DamageType.PHYSIC) {
                    shieldDamageMult = caster.getStatBuffMultiplier(StatType.DAMAGE_GIVEN_PHYSIC_TO_SHIELD);
                    shieldDamageFlat = caster.getStatFlatBonus(StatType.DAMAGE_GIVEN_PHYSIC_TO_SHIELD);
                }
            }
            double safeMult = Math.max(0.001, shieldDamageMult);

            for (generation.grimoire.entity.personnage.ActiveShield shield : p.getActiveShields()) {
                if (shield.getAmount() > 0) {
                    double damageToShield = remainingDamage * safeMult + shieldDamageFlat;
                    if (damageToShield > 0) {
                        int absorbed = Math.min(shield.getAmount(), (int) Math.ceil(damageToShield));
                        shield.setAmount(shield.getAmount() - absorbed);
                        shieldPointsBroken += absorbed;

                        double rawConsumed = (absorbed - shieldDamageFlat) / safeMult;
                        if (rawConsumed < 0) {
                            rawConsumed = 0;
                        }
                        int rawConsumedInt = (int) Math.ceil(rawConsumed);
                        remainingDamage -= rawConsumedInt;
                        shieldDamageFlat = Math.max(0, shieldDamageFlat - absorbed);

                        if (remainingDamage <= 0) {
                            remainingDamage = 0;
                            break;
                        }
                    }
                }
            }
            p.getActiveShields().removeIf(s -> s.getAmount() <= 0);
        }

        int totalDamageToHealth = bypassDamage + remainingDamage;
        p.setHealthCurrent(Math.max(0, p.getHealthCurrent() - totalDamageToHealth));

        return new SimulatedDamageResult(totalDamageToHealth, shieldPointsBroken + manaShieldAbsorbed, 0);
    }

    private int computeOutgoingDealDamage(Personnage caster, int baseDamage, DamageType type) {
        if (caster == null) return baseDamage;
        double multiplier = 1.0;
        int flatBonus = 0;
        if (type == DamageType.PHYSIC) {
            multiplier = Math.max(0.0, caster.getStatBuffMultiplier(StatType.DAMAGE_GIVEN_PHYSIC));
            flatBonus = caster.getStatFlatBonus(StatType.DAMAGE_GIVEN_PHYSIC);
        } else if (type == DamageType.MAGIC) {
            multiplier = Math.max(0.0, caster.getStatBuffMultiplier(StatType.DAMAGE_GIVEN_MAGIC));
            flatBonus = caster.getStatFlatBonus(StatType.DAMAGE_GIVEN_MAGIC);
        } else if (type == DamageType.BRUT) {
            multiplier = Math.max(0.0, caster.getStatBuffMultiplier(StatType.DAMAGE_GIVEN_BRUT));
            flatBonus = caster.getStatFlatBonus(StatType.DAMAGE_GIVEN_BRUT);
        }
        int frenzy = caster.getPassiveState("FRENZY", 0);
        if (frenzy > 0) {
            multiplier += (frenzy / 100.0);
        }
        int out = (int) (baseDamage * multiplier) + flatBonus;
        return Math.max(0, out);
    }

    private int computeReceivedHeal(Personnage target, int healAmount) {
        if (target == null) return healAmount;
        double multiplier = target.getStatBuffMultiplier(StatType.HEAL_RECEIVED);
        int cursedHeal = target.getSpecialEffectValue(EquipmentEffectType.CURSED_HEALING_REDUCTION);
        if (cursedHeal != 0) {
            multiplier -= (Math.abs(cursedHeal) / 100.0);
        }
        return (int) (healAmount * Math.max(0, multiplier));
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
