package generation.grimoire.service.pve;

import generation.grimoire.entity.Equipment;
import generation.grimoire.entity.Spell;
import generation.grimoire.entity.Spiritualite;
import generation.grimoire.entity.Voie;
import generation.grimoire.entity.personnage.Personnage;
import generation.grimoire.entity.pve.Donjon;
import generation.grimoire.entity.pve.Salle;
import generation.grimoire.entity.spell.type.effect.HeatFixedEffect;
import generation.grimoire.enumeration.EquipmentSlot;
import generation.grimoire.enumeration.EquipmentEffectType;
import generation.grimoire.enumeration.SpellCastingType;
import generation.grimoire.event.CanCastCheckEvent;
import generation.grimoire.event.CastingTypeAdjustEvent;
import generation.grimoire.event.SpellCostAdjustEvent;
import generation.grimoire.model.pve.CombatSession;
import generation.grimoire.model.pve.InitiativeEntry;
import generation.grimoire.model.pve.SpellAvailability;
import generation.grimoire.repository.SpellRepository;
import generation.grimoire.service.PassiveDispatcher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SpellAvailabilityServiceTest {

    @Mock
    private SpellRepository spellRepository;

    @Mock
    private PassiveDispatcher passiveDispatcher;

    @InjectMocks
    private SpellAvailabilityService spellAvailabilityService;

    private Personnage caster;
    private CombatSession session;

    @BeforeEach
    void setUp() {
        caster = new Personnage();
        caster.setId(1L);
        caster.setName("Test Hero");
        caster.setHealthMax(100);
        caster.setHealthCurrent(100);
        caster.setManaMax(100);
        caster.setManaCurrent(100);

        Donjon donjon = new Donjon();
        donjon.setId(1L);
        Salle salle = new Salle();
        donjon.setSalles(List.of(salle));

        session = new CombatSession("test-id", donjon, new ArrayList<>(List.of(caster)));
        session.setFinished(false);
        session.getTurnOrder().clear();
        session.getTurnOrder().add(new InitiativeEntry(true, 0, 10, 10, 0));
        session.setCurrentTurnIndex(0);
    }

    private Spell createSpell(Long id, String name, int manaCost, int healCost, int heatCost, SpellCastingType castingType) {
        Spell spell = new Spell();
        spell.setId(id);
        spell.setNom(name);
        spell.setManaCost(manaCost);
        spell.setHealCost(healCost);
        spell.setHeatCost(heatCost);
        spell.setCastingType(castingType != null ? castingType : SpellCastingType.BANAL);
        return spell;
    }

    @Test
    @DisplayName("compute - Ne fait rien si la session est terminée")
    void compute_whenSessionFinished_shouldDoNothing() {
        session.setFinished(true);

        spellAvailabilityService.compute(session);

        verifyNoInteractions(spellRepository);
        verifyNoInteractions(passiveDispatcher);
        assertThat(session.getSpellAvailability()).isEmpty();
    }

    @Test
    @DisplayName("compute - Vide les sorts si aucun joueur actif")
    void compute_whenActivePlayerNull_shouldClearSpellsAndReturn() {
        session.getTurnOrder().clear();

        spellAvailabilityService.compute(session);

        verifyNoInteractions(spellRepository);
        assertThat(session.getAvailableSpells()).isEmpty();
        assertThat(session.getSpellAvailability()).isEmpty();
    }

    @Test
    @DisplayName("compute - Filtre les sorts selon canCast du personnage")
    void compute_whenSpellsFilteredByCanCast_shouldOnlyIncludeAllowedSpells() {
        Voie voieFeu = new Voie();
        voieFeu.setId(10L);
        voieFeu.setNom("Feu");
        caster.setVoie(voieFeu);
        caster.setVoieLevel(5);

        Spell allowedSpell = createSpell(1L, "Boule de Feu", 20, 0, 0, SpellCastingType.BANAL);
        allowedSpell.setVoie(voieFeu);
        allowedSpell.setNiveau(1);

        Voie voieGlace = new Voie();
        voieGlace.setId(20L);
        voieGlace.setNom("Glace");
        Spell forbiddenSpell = createSpell(2L, "Javelot de Glace", 20, 0, 0, SpellCastingType.BANAL);
        forbiddenSpell.setVoie(voieGlace);
        forbiddenSpell.setNiveau(1);

        when(spellRepository.findAll()).thenReturn(List.of(forbiddenSpell, allowedSpell));

        spellAvailabilityService.compute(session);

        assertThat(session.getAvailableSpells()).containsExactly(allowedSpell);
        assertThat(session.getSpellAvailability()).hasSize(1);
        assertThat(session.getSpellAvailability().get(0).getSpellId()).isEqualTo(1L);
        assertThat(session.getSpellAvailability().get(0).isCastable()).isTrue();
    }

    @Test
    @DisplayName("compute - Bloque les sorts banals si une canalisation est en cours")
    void compute_whenChannelingActive_nonInstantSpell_shouldBeBlocked() {
        caster.setRemainingChannelingTurns(2);
        Spell banalSpell = createSpell(1L, "Frappe Lourde", 10, 0, 0, SpellCastingType.BANAL);
        when(spellRepository.findAll()).thenReturn(List.of(banalSpell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("CHANNELING");
        assertThat(avail.getTooltip()).contains("Canalisation en cours : seuls les sorts instantanés sont autorisés");
    }

    @Test
    @DisplayName("compute - Bloque les sorts instantanés si la canalisation les interdit")
    void compute_whenChannelingActive_instantSpellForbidden_shouldBeBlocked() {
        caster.setRemainingChannelingTurns(1);
        caster.setAllowInstantDuringCurrentChanneling(false);

        Spell instantSpell = createSpell(1L, "Réflexe", 10, 0, 0, SpellCastingType.INSTANTANE);
        when(spellRepository.findAll()).thenReturn(List.of(instantSpell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("CHANNELING");
        assertThat(avail.getTooltip()).contains("Cette canalisation interdit les sorts instantanés");
    }

    @Test
    @DisplayName("compute - Autorise les sorts instantanés si la canalisation le permet")
    void compute_whenChannelingActive_instantSpellAllowed_shouldBeAvailable() {
        caster.setRemainingChannelingTurns(1);
        caster.setAllowInstantDuringCurrentChanneling(true);

        Spell instantSpell = createSpell(1L, "Éclair", 10, 0, 0, SpellCastingType.INSTANTANE);
        when(spellRepository.findAll()).thenReturn(List.of(instantSpell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isTrue();
    }

    @Test
    @DisplayName("compute - Bloque si une action majeure / sort banal a déjà été joué ce tour")
    void compute_whenBanalSpellAlreadyCastThisTurn_shouldBlockMajorAction() {
        caster.setBanalSpellCastThisTurn(true);
        caster.setRemainingChannelingTurns(0);

        Spell spell = createSpell(1L, "Coup Banal", 10, 0, 0, SpellCastingType.BANAL);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("ACTION_LIMIT");
        assertThat(avail.getTooltip()).contains("Action majeure déjà effectuée ce tour");
    }

    @Test
    @DisplayName("compute - Bloque si un sort instantané a déjà été lancé ce tour")
    void compute_whenInstantSpellAlreadyCastThisTurn_andSpellInstant_shouldBlock() {
        caster.setInstantSpellCastThisTurn(true);

        Spell instantSpell = createSpell(1L, "Riposte", 10, 0, 0, SpellCastingType.INSTANTANE);
        when(spellRepository.findAll()).thenReturn(List.of(instantSpell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("ACTION_LIMIT");
        assertThat(avail.getTooltip()).contains("Sort instantané déjà lancé ce tour");
    }

    @Test
    @DisplayName("compute - Ajuste le type de casting via CastingTypeAdjustEvent")
    void compute_whenPassiveAdjustsCastingTypeToInstant_shouldApplyInstantRules() {
        caster.setInstantSpellCastThisTurn(true);
        Spell spell = createSpell(1L, "Sort Transformé", 10, 0, 0, SpellCastingType.BANAL);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        doAnswer(invocation -> {
            CastingTypeAdjustEvent event = invocation.getArgument(2);
            event.setCurrentType(SpellCastingType.INSTANTANE);
            return null;
        }).when(passiveDispatcher).dispatch(eq(caster), eq(spell), any(CastingTypeAdjustEvent.class));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("ACTION_LIMIT");
        assertThat(avail.getTooltip()).contains("Sort instantané déjà lancé ce tour");
    }

    @Test
    @DisplayName("compute - Bloque avec tooltip Esprit si condition non remplie")
    void compute_whenPassiveBlocksCanCastCheck_withEsprit_shouldBlockWithEspritTooltip() {
        Spiritualite esprit = new Spiritualite();
        esprit.setId(10L);
        esprit.setNom("Voie de l'Esprit");
        caster.setSpiritualite(esprit);
        caster.setSpiritualiteLevel(5);

        Spell spell = createSpell(1L, "Méditation", 10, 0, 0, SpellCastingType.BANAL);
        spell.setSpiritualite(esprit);
        spell.setNiveau(1);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        doAnswer(invocation -> {
            CanCastCheckEvent event = invocation.getArgument(2);
            event.setAllowed(false);
            return null;
        }).when(passiveDispatcher).dispatch(eq(caster), eq(spell), any(CanCastCheckEvent.class));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("CONDITION");
        assertThat(avail.getTooltip()).contains("Condition Esprit non remplie");
    }

    @Test
    @DisplayName("compute - Bloque avec tooltip Ténèbres si condition non remplie")
    void compute_whenPassiveBlocksCanCastCheck_withTenebres_shouldBlockWithTenebresTooltip() {
        Spiritualite tenebres = new Spiritualite();
        tenebres.setId(11L);
        tenebres.setNom("Ténèbres Profondes");
        caster.setSpiritualite(tenebres);
        caster.setSpiritualiteLevel(5);

        Spell spell = createSpell(1L, "Ombre", 10, 0, 0, SpellCastingType.BANAL);
        spell.setSpiritualite(tenebres);
        spell.setNiveau(1);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        doAnswer(invocation -> {
            CanCastCheckEvent event = invocation.getArgument(2);
            event.setAllowed(false);
            return null;
        }).when(passiveDispatcher).dispatch(eq(caster), eq(spell), any(CanCastCheckEvent.class));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("CONDITION");
        assertThat(avail.getTooltip()).contains("Condition Ténèbres non remplie");
    }

    @Test
    @DisplayName("compute - Bloque avec tooltip Karma si karma_locked")
    void compute_whenPassiveBlocksCanCastCheck_withKarmaLocked_shouldBlockWithKarmaTooltip() {
        Spiritualite karma = new Spiritualite();
        karma.setId(12L);
        karma.setNom("Voie du Karma");
        caster.setSpiritualite(karma);
        caster.setSpiritualiteLevel(5);
        caster.setPassiveState("karma_locked", 1);

        Spell spell = createSpell(1L, "Jugement", 10, 0, 0, SpellCastingType.BANAL);
        spell.setSpiritualite(karma);
        spell.setNiveau(1);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        doAnswer(invocation -> {
            CanCastCheckEvent event = invocation.getArgument(2);
            event.setAllowed(false);
            return null;
        }).when(passiveDispatcher).dispatch(eq(caster), eq(spell), any(CanCastCheckEvent.class));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("CONDITION");
        assertThat(avail.getTooltip()).contains("Karma verrouillé");
    }

    @Test
    @DisplayName("compute - Bloque avec tooltip générique si condition non remplie sans spiritualité reconnue")
    void compute_whenPassiveBlocksCanCastCheck_defaultConditionTooltip() {
        Spell spell = createSpell(1L, "Sort Mystère", 10, 0, 0, SpellCastingType.BANAL);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        doAnswer(invocation -> {
            CanCastCheckEvent event = invocation.getArgument(2);
            event.setAllowed(false);
            return null;
        }).when(passiveDispatcher).dispatch(eq(caster), eq(spell), any(CanCastCheckEvent.class));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("CONDITION");
        assertThat(avail.getTooltip()).isEqualTo("Condition de lancement non remplie");
    }

    @Test
    @DisplayName("compute - Bloque si mana insuffisant")
    void compute_whenManaInsufficient_shouldBlockWithResource() {
        caster.setManaCurrent(30);
        Spell spell = createSpell(1L, "Mégasort", 50, 0, 0, SpellCastingType.BANAL);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("RESOURCE");
        assertThat(avail.getTooltip()).isEqualTo("Mana insuffisant (30/50)");
        assertThat(avail.getFinalManaCost()).isEqualTo(50);
    }

    @Test
    @DisplayName("compute - Calcule le coût mana avec percentManaCost et CURSED_MANA_TAX")
    void compute_whenPercentManaCostAndCursedTax_shouldCalculateAccurately() {
        caster.setManaMax(100);
        caster.setManaCurrent(25);

        Equipment cursedGear = new Equipment();
        cursedGear.setSlot(EquipmentSlot.ANNEAU);
        cursedGear.setSpecialEffect(EquipmentEffectType.CURSED_MANA_TAX);
        cursedGear.setSpecialEffectValue(50); // +50% taxe mana
        caster.getEquipments().add(cursedGear);

        Spell spell = createSpell(1L, "Sort Maudit", 10, 0, 0, SpellCastingType.BANAL);
        spell.setPercentManaCost(10); // +10% de 100 = 10 -> manaCost = 20. Taxe 50% de 20 = 10 -> 30 total
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("RESOURCE");
        assertThat(avail.getTooltip()).isEqualTo("Mana insuffisant (25/30)");
        assertThat(avail.getFinalManaCost()).isEqualTo(30);
    }

    @Test
    @DisplayName("compute - Bloque si PV insuffisants (healCost)")
    void compute_whenHealthInsufficient_shouldBlockWithResource() {
        caster.setHealthCurrent(20);
        Spell spell = createSpell(1L, "Sort Sacrificiel", 0, 40, 0, SpellCastingType.BANAL);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("RESOURCE");
        assertThat(avail.getTooltip()).isEqualTo("PV insuffisants (20/40)");
        assertThat(avail.getFinalHealCost()).isEqualTo(40);
    }

    @Test
    @DisplayName("compute - Calcule le coût PV avec percentHealCost")
    void compute_whenPercentHealCost_shouldCalculateAccurately() {
        caster.setHealthMax(200);
        caster.setHealthCurrent(30);
        Spell spell = createSpell(1L, "Transfusion", 0, 10, 0, SpellCastingType.BANAL);
        spell.setPercentHealCost(20); // 20% de 200 = 40 -> total 50
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("RESOURCE");
        assertThat(avail.getTooltip()).isEqualTo("PV insuffisants (30/50)");
        assertThat(avail.getFinalHealCost()).isEqualTo(50);
    }

    @Test
    @DisplayName("compute - Bloque si Chaleur insuffisante")
    void compute_whenHeatInsufficient_shouldBlockWithResource() {
        caster.setPassiveState("destruction_heat", 15);
        Spell spell = createSpell(1L, "Brasier", 0, 0, 30, SpellCastingType.BANAL);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("RESOURCE");
        assertThat(avail.getTooltip()).isEqualTo("Chaleur insuffisante (15/30)");
        assertThat(avail.getFinalHeatCost()).isEqualTo(30);
    }

    @Test
    @DisplayName("compute - Intègre le coût de chaleur négatif issu de HeatFixedEffect")
    void compute_whenHeatFixedEffectConsumesHeat_shouldAddToHeatCost() {
        caster.setPassiveState("destruction_heat", 20);

        Spell spell = createSpell(1L, "Explosion Thermique", 0, 0, 10, SpellCastingType.BANAL);
        HeatFixedEffect effect = new HeatFixedEffect();
        effect.setAmount(-25); // Consomme 25 de chaleur additionnelle
        spell.addEffect(effect);

        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("RESOURCE");
        assertThat(avail.getTooltip()).isEqualTo("Chaleur insuffisante (20/35)");
        assertThat(avail.getFinalHeatCost()).isEqualTo(35);
    }

    @Test
    @DisplayName("compute - Bloque si graines (bourgeons) insuffisantes avec déclenchement passif Création")
    void compute_whenSeedsInsufficient_shouldBlockWithResource() {
        caster.setPassiveState("creation_buds", 2);
        caster.setPassiveState("creation_used_this_turn", 0); // Active le bonus passif (+1 requis)

        Spell spell = createSpell(1L, "Floraison", 0, 0, 0, SpellCastingType.BANAL);
        spell.setSeedCost(2); // Requis: 2 + 1 = 3

        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("RESOURCE");
        assertThat(avail.getTooltip()).isEqualTo("Graines insuffisantes (2/3)");
    }

    @Test
    @DisplayName("compute - Prend en compte la modification de coûts par SpellCostAdjustEvent")
    void compute_whenSpellCostAdjustEventModifiesCost_shouldUseAdjustedCosts() {
        caster.setManaCurrent(10);
        Spell spell = createSpell(1L, "Sort Coûteux Réduit", 100, 0, 0, SpellCastingType.BANAL);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        doAnswer(invocation -> {
            SpellCostAdjustEvent event = invocation.getArgument(2);
            event.getCosts()[0] = 0; // Réduit le coût en mana à 0
            return null;
        }).when(passiveDispatcher).dispatch(eq(caster), eq(spell), any(SpellCostAdjustEvent.class));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isTrue();
        assertThat(avail.getFinalManaCost()).isEqualTo(0);
    }

    @Test
    @DisplayName("compute - Valide un sort disponible lorsque toutes les ressources et conditions sont réunies")
    void compute_whenAllConditionsSatisfied_shouldBeAvailable() {
        caster.setManaCurrent(80);
        caster.setHealthCurrent(90);
        caster.setPassiveState("destruction_heat", 50);

        Spell spell = createSpell(1L, "Flamme Parfaite", 25, 10, 15, SpellCastingType.BANAL);
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isTrue();
        assertThat(avail.getReason()).isNull();
        assertThat(avail.getTooltip()).isNull();
        assertThat(avail.getFinalManaCost()).isEqualTo(25);
        assertThat(avail.getFinalHealCost()).isEqualTo(10);
        assertThat(avail.getFinalHeatCost()).isEqualTo(15);
    }

    @Test
    @DisplayName("compute - Calcule le coût réel en mana et PV avec pourcentage, taxe maudite et conserve les coûts même si bloqué")
    void compute_withPercentageCostsAndCursedModifiers_shouldExposeRealCostsAndModifiers() {
        caster.setManaMax(200);
        caster.setManaCurrent(150);
        caster.setHealthMax(100);
        caster.setHealthCurrent(80);
        caster.setBanalSpellCastThisTurn(true); // Bloque par ACTION_LIMIT mais doit quand même exposer les coûts réels

        Equipment cursedWeapon = new Equipment();
        cursedWeapon.setSlot(EquipmentSlot.ANNEAU);
        cursedWeapon.setSpecialEffect(EquipmentEffectType.CURSED_MANA_TAX);
        cursedWeapon.setSpecialEffectValue(20); // +20% surcoût mana
        Equipment cursedRing = new Equipment();
        cursedRing.setSlot(EquipmentSlot.ANNEAU);
        cursedRing.setSpecialEffect(EquipmentEffectType.CURSED_HP_LOSS_ON_MANA);
        cursedRing.setSpecialEffectValue(10); // 10% du mana dépensé en PV
        caster.getEquipments().add(cursedWeapon);
        caster.getEquipments().add(cursedRing);

        Spell spell = createSpell(1L, "Rituel Maudit", 15, 5, 0, SpellCastingType.BANAL);
        spell.setPercentManaCost(20);
        spell.setPercentManaCostSource(generation.grimoire.enumeration.Source.CASTER_MANA_CURRENT); // 20% de 150 = 30
        spell.setPercentHealCost(10);
        spell.setPercentHealCostSource(generation.grimoire.enumeration.Source.CASTER_HEALTH_MAX); // 10% de 100 = 10
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.isCastable()).isFalse();
        assertThat(avail.getReason()).isEqualTo("ACTION_LIMIT");

        // Mana: base 15 + 30 (20% de 150) = 45, +20% taxe maudite (+9) = 54
        assertThat(avail.getPercentManaAmount()).isEqualTo(30);
        assertThat(avail.getRawManaCost()).isEqualTo(45);
        assertThat(avail.getFinalManaCost()).isEqualTo(54);
        assertThat(avail.getManaModifiers()).hasSize(2);
        assertThat(avail.getManaModifiers().get(0).label()).contains("Incantations Lourdes");
        assertThat(avail.getManaModifiers().get(0).valueText()).isEqualTo("+9 Mana");
        assertThat(avail.getManaModifiers().get(0).bonus()).isFalse();
        assertThat(avail.getManaModifiers().get(1).label()).contains("Brèche spirituelle");

        // PV: base 5 + 10 (10% de 100) = 15, et modificateur Brèche spirituelle (10% de 54 = 5 PV)
        assertThat(avail.getPercentHealAmount()).isEqualTo(10);
        assertThat(avail.getRawHealCost()).isEqualTo(15);
        assertThat(avail.getFinalHealCost()).isEqualTo(15);
        assertThat(avail.getHealModifiers()).hasSize(1);
        assertThat(avail.getHealModifiers().get(0).label()).contains("Brèche spirituelle");
        assertThat(avail.getHealModifiers().get(0).valueText()).isEqualTo("+5 PV");
    }

    @Test
    @DisplayName("compute - Pré-calcule les valeurs réelles des effets de sort (Dégâts %, Bouclier, Buff avec source, DoT)")
    void compute_withPercentageEffects_shouldExposeCalculatedEffectPreviews() {
        caster.setPower(40);
        caster.setHealthMax(200);
        caster.setHealthCurrent(150);

        Spell spell = createSpell(1L, "Explosion Arcanique", 20, 0, 0, SpellCastingType.BANAL);

        // Effet 0 : 150% de CASTER_POWER (40) = 60 dégâts magiques
        generation.grimoire.entity.spell.type.effect.DamagePercentageEffect dmgEff =
                new generation.grimoire.entity.spell.type.effect.DamagePercentageEffect();
        dmgEff.setId(101L);
        dmgEff.setDamageType(generation.grimoire.enumeration.DamageType.MAGIC);
        dmgEff.setPercentage(1.50);
        dmgEff.setDamageSource(generation.grimoire.enumeration.Source.CASTER_POWER);

        // Effet 1 : Bouclier 10 + 50% de CASTER_POWER (20) = 30
        generation.grimoire.entity.spell.type.effect.ShieldEffect shieldEff =
                new generation.grimoire.entity.spell.type.effect.ShieldEffect();
        shieldEff.setId(102L);
        shieldEff.setFixedValue(10);
        shieldEff.setPercentage(0.50);
        shieldEff.setShieldSource(generation.grimoire.enumeration.Source.CASTER_POWER);
        shieldEff.setDuration(2);

        // Effet 2 : Buff Armure +5 flat + 25% de CASTER_POWER (+10) = +15 flat
        generation.grimoire.entity.spell.type.effect.BuffDebuffEffect buffEff =
                new generation.grimoire.entity.spell.type.effect.BuffDebuffEffect();
        buffEff.setId(103L);
        buffEff.setStatAffected(generation.grimoire.enumeration.StatType.ARMURE);
        buffEff.setFlatValue(5);
        buffEff.setModifier(0.25);
        buffEff.setModifierSource(generation.grimoire.enumeration.Source.CASTER_POWER);
        buffEff.setDuration(3);

        // Effet 3 : DoT 5 + 20% de CASTER_POWER (8) = 13/tour
        generation.grimoire.entity.spell.type.effect.DamageOverTimeEffect dotEff =
                new generation.grimoire.entity.spell.type.effect.DamageOverTimeEffect();
        dotEff.setId(104L);
        dotEff.setDamageType(generation.grimoire.enumeration.DamageType.MAGIC);
        dotEff.setFixedDamagePerTick(5);
        dotEff.setPercentageDamagePerTick(0.20);
        dotEff.setDamageSource(generation.grimoire.enumeration.Source.CASTER_POWER);
        dotEff.setDuration(3);

        spell.setEffects(new java.util.LinkedHashSet<>(List.of(dmgEff, shieldEff, buffEff, dotEff)));
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        assertThat(avail.getEffectPreviews()).hasSize(4);

        assertThat(avail.getEffectPreviews().get(0).calculatedValue()).isEqualTo(60);
        assertThat(avail.getEffectPreviews().get(0).sourceResolvedToFlat()).isTrue();

        assertThat(avail.getEffectPreviews().get(1).calculatedValue()).isEqualTo(30);
        assertThat(avail.getEffectPreviews().get(1).sourceResolvedToFlat()).isTrue();

        assertThat(avail.getEffectPreviews().get(2).calculatedValue()).isEqualTo(15);
        assertThat(avail.getEffectPreviews().get(2).calculatedPercentModifier()).isEqualTo(0);
        assertThat(avail.getEffectPreviews().get(2).sourceResolvedToFlat()).isTrue();

        assertThat(avail.getEffectPreviews().get(3).calculatedValue()).isEqualTo(13);
        assertThat(avail.getEffectPreviews().get(3).sourceResolvedToFlat()).isTrue();
    }

    @Test
    @DisplayName("Devrait calculer des aperçus spécifiques pour chaque ennemi en fonction de ses stats")
    void shouldComputeDifferentPreviewsForEachTargetEnemy() {
        // Ennemi 1 : 100 PV manquants
        Personnage enemy1 = new Personnage();
        enemy1.setId(10L);
        enemy1.setName("Gobelin A");
        enemy1.setHealthMax(1000);
        enemy1.setHealthCurrent(900);
        generation.grimoire.model.pve.ActiveMonster m1 = new generation.grimoire.model.pve.ActiveMonster(new generation.grimoire.entity.pve.Monstre());
        m1.setAsPersonnage(enemy1);

        // Ennemi 2 : 500 PV manquants
        Personnage enemy2 = new Personnage();
        enemy2.setId(11L);
        enemy2.setName("Gobelin B");
        enemy2.setHealthMax(1000);
        enemy2.setHealthCurrent(500);
        generation.grimoire.model.pve.ActiveMonster m2 = new generation.grimoire.model.pve.ActiveMonster(new generation.grimoire.entity.pve.Monstre());
        m2.setAsPersonnage(enemy2);

        session.setEnemies(List.of(m1, m2));

        // Sort : 20% des PV manquants de la cible en dégâts bruts
        Spell spell = createSpell(200L, "Exécution", 10, 0, 0, SpellCastingType.BANAL);
        generation.grimoire.entity.spell.type.effect.DamagePercentageEffect pctEff =
                new generation.grimoire.entity.spell.type.effect.DamagePercentageEffect();
        pctEff.setId(201L);
        pctEff.setDamageType(generation.grimoire.enumeration.DamageType.BRUT);
        pctEff.setPercentage(0.20);
        pctEff.setDamageSource(generation.grimoire.enumeration.Source.TARGET_HEALTH_MISSING);
        pctEff.setEffectTarget(generation.grimoire.enumeration.EffectTarget.TARGET);

        spell.setEffects(new java.util.LinkedHashSet<>(List.of(pctEff)));
        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);

        // Aperçu par défaut (sur 1er ennemi : 20% de 100 = 20)
        assertThat(avail.getEffectPreviews()).hasSize(1);
        assertThat(avail.getEffectPreviews().get(0).calculatedValue()).isEqualTo(20);

        // Aperçus spécifiques aux cibles
        assertThat(avail.getEnemyPreviews()).hasSize(2);
        assertThat(avail.getEnemyPreviews().get(0).effectPreviews().get(0).calculatedValue()).isEqualTo(20);
        assertThat(avail.getEnemyPreviews().get(1).effectPreviews().get(0).calculatedValue()).isEqualTo(100);
    }

    @Test
    @DisplayName("Devrait calculer les dégâts réels finaux en prenant en compte armure, passifs de monstre, débuffs et boucliers")
    void shouldComputeRealFinalDamageWithArmorMonsterPassivesDebuffsAndShields() {
        // Lanceur : +20% DAMAGE_GIVEN_PHYSIC
        generation.grimoire.entity.spell.type.effect.BuffDebuffEffect casterBuff =
                new generation.grimoire.entity.spell.type.effect.BuffDebuffEffect();
        casterBuff.setStatAffected(generation.grimoire.enumeration.StatType.DAMAGE_GIVEN_PHYSIC);
        casterBuff.setModifier(0.20);
        casterBuff.setDuration(2);
        caster.getActiveBuffs().add(casterBuff);

        // Cible : Monstre REPTILE (-15% dégâts physiques), 100 Armure (50% réduction),
        // Débuff +25% DAMAGE_TAKEN_PHYSIC, et 20 points de Bouclier actif
        Personnage reptileTarget = new Personnage();
        reptileTarget.setId(20L);
        reptileTarget.setName("Lézard Cuirassé");
        reptileTarget.setHealthMax(500);
        reptileTarget.setHealthCurrent(500);
        reptileTarget.setArmor(100);
        reptileTarget.setMonsterType(generation.grimoire.enumeration.MonsterType.REPTILE);
        generation.grimoire.entity.spell.type.effect.BuffDebuffEffect targetDebuff =
                new generation.grimoire.entity.spell.type.effect.BuffDebuffEffect();
        targetDebuff.setStatAffected(generation.grimoire.enumeration.StatType.DAMAGE_TAKEN_PHYSIC);
        targetDebuff.setModifier(0.25);
        targetDebuff.setDuration(2);
        reptileTarget.getActiveBuffs().add(targetDebuff);
        reptileTarget.addShield(20, 2, "Écailles");

        generation.grimoire.model.pve.ActiveMonster m1 =
                new generation.grimoire.model.pve.ActiveMonster(new generation.grimoire.entity.pve.Monstre());
        m1.setAsPersonnage(reptileTarget);
        session.setEnemies(List.of(m1));

        // Sort : 100 dégâts physiques fixes
        Spell spell = createSpell(300L, "Frappe Lourde", 10, 0, 0, SpellCastingType.BANAL);
        generation.grimoire.entity.spell.type.effect.DamageFixedEffect dmgEff =
                new generation.grimoire.entity.spell.type.effect.DamageFixedEffect();
        dmgEff.setId(301L);
        dmgEff.setDamageType(generation.grimoire.enumeration.DamageType.PHYSIC);
        dmgEff.setDamage(100);
        dmgEff.setEffectTarget(generation.grimoire.enumeration.EffectTarget.TARGET);
        spell.setEffects(new java.util.LinkedHashSet<>(List.of(dmgEff)));

        when(spellRepository.findAll()).thenReturn(List.of(spell));

        spellAvailabilityService.compute(session);

        assertThat(session.getSpellAvailability()).hasSize(1);
        SpellAvailability avail = session.getSpellAvailability().get(0);
        var preview = avail.getEnemyPreviews().get(0).effectPreviews().get(0);

        // Calcul attendu :
        // 1. dealDamage : 100 * 1.20 = 120
        // 2. REPTILE : ceil(120 * 0.85) = 102
        // 3. DAMAGE_TAKEN_PHYSIC (+25%) : 102 * 1.25 = 127.5
        // 4. Armure 100 (réduction 50%) : (int)(127.5 * 0.5) = 63
        // 5. Bouclier 20 : absorbe 20 -> reste 43 dégâts PV
        assertThat(preview.calculatedValue()).isEqualTo(43);
        assertThat(preview.hpDamage()).isEqualTo(43);
        assertThat(preview.shieldAbsorbed()).isEqualTo(20);
    }
}
