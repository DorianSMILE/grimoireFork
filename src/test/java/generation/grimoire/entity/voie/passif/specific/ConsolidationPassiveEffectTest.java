package generation.grimoire.entity.voie.passif.specific;

import generation.grimoire.entity.personnage.Personnage;
import generation.grimoire.enumeration.StatType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ConsolidationPassiveEffectTest {

    private ConsolidationPassiveEffect passive;
    private Personnage hero;

    @BeforeEach
    void setUp() {
        passive = new ConsolidationPassiveEffect();
        hero = new Personnage();
        hero.setName("Hero");
    }

    @Test
    void shouldApplyShieldAndHpLossWhenHpAbove20Percent() {
        hero.setHealthMax(100);
        hero.setHealthCurrent(50); // > 20%
        
        passive.onTurnStart(hero);
        
        assertThat(hero.getHealthCurrent()).isEqualTo(45); // 50 - 5
        assertThat(hero.getTotalShield()).isEqualTo(5); // 10% de 50
        assertThat(hero.getActiveShields()).hasSize(1);
        assertThat(hero.getActiveShields().get(0).getDuration()).isEqualTo(2);
    }

    @Test
    void shieldShouldLastTwoTurns() {
        hero.setHealthMax(100);
        hero.setHealthCurrent(50);
        
        passive.onTurnStart(hero);
        assertThat(hero.getTotalShield()).isEqualTo(5);
        
        // Fin tour 1
        hero.updateShields();
        assertThat(hero.getTotalShield()).isEqualTo(5);
        assertThat(hero.getActiveShields().get(0).getDuration()).isEqualTo(1);
        
        // Fin tour 2
        hero.updateShields();
        assertThat(hero.getTotalShield()).isEqualTo(0);
        assertThat(hero.getActiveShields()).isEmpty();
    }

    @Test
    void shouldApplyArmorAndResistanceWhenHpBelowOrEqual20Percent() {
        hero.setHealthMax(100);
        hero.setHealthCurrent(20); // <= 20%
        
        passive.onTurnStart(hero);
        
        assertThat(hero.getActiveBuffs()).hasSize(2);
        assertThat(hero.getActiveBuffs().stream().anyMatch(b -> b.getStatAffected() == StatType.ARMURE && b.getModifier() == 0.25 && b.getDuration() == 2)).isTrue();
        assertThat(hero.getActiveBuffs().stream().anyMatch(b -> b.getStatAffected() == StatType.RESISTANCE && b.getModifier() == 0.25 && b.getDuration() == 2)).isTrue();
        assertThat(hero.getTotalShield()).isEqualTo(0);
    }

    @Test
    void armorAndResistanceShouldLastTwoTurns() {
        hero.setHealthMax(100);
        hero.setHealthCurrent(20);

        passive.onTurnStart(hero);
        assertThat(hero.getActiveBuffs()).hasSize(2);

        // Fin tour 1
        hero.updateBuffs();
        assertThat(hero.getActiveBuffs()).hasSize(2);
        assertThat(hero.getActiveBuffs()).allMatch(b -> b.getDuration() == 1);

        // Fin tour 2
        hero.updateBuffs();
        assertThat(hero.getActiveBuffs()).isEmpty();
    }

    @Test
    void buildActiveBonusSummary_shouldReturnNullForNonConsolidation() {
        assertThat(ConsolidationPassiveEffect.buildActiveBonusSummary(null)).isNull();
        assertThat(ConsolidationPassiveEffect.buildActiveBonusSummary(hero)).isNull();

        generation.grimoire.entity.Voie otherVoie = new generation.grimoire.entity.Voie();
        otherVoie.setNom("Destruction");
        hero.setVoie(otherVoie);
        assertThat(hero.getConsolidationBonusSummary()).isNull();
    }

    @Test
    void buildActiveBonusSummary_shouldShowHpLossAndShieldAbove20Percent() {
        generation.grimoire.entity.Voie consolidationVoie = new generation.grimoire.entity.Voie();
        consolidationVoie.setNom("Voie de la Consolidation");
        hero.setVoie(consolidationVoie);
        hero.setHealthMax(200);
        hero.setHealthCurrent(150);

        assertThat(hero.getConsolidationBonusSummary())
                .isEqualTo("Prochain tour : -10 PV prélevés · +15 Bouclier (2 tours)");
    }

    @Test
    void buildActiveBonusSummary_shouldShowArmorAndResistanceGainsAtOrBelow20Percent() {
        generation.grimoire.entity.Voie consolidationVoie = new generation.grimoire.entity.Voie();
        consolidationVoie.setNom("Voie de la Consolidation");
        hero.setVoie(consolidationVoie);
        hero.setHealthMax(100);
        hero.setHealthCurrent(20);
        hero.setArmor(40);
        hero.setResistance(20);

        assertThat(hero.getConsolidationBonusSummary())
                .isEqualTo("Prochain tour (≤ 20% PV) : +10 Armure · +5 Résistance (+25%, 2 tours)");
    }
}
