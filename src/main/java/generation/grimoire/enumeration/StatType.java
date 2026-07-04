package generation.grimoire.enumeration;

public enum StatType {
    SPEED("Vitesse"),
    MANA("Mana"),
    HEALTH("Points de Vie"),
    CRIT("Critique"),
    ARMURE("Armure"),
    RESISTANCE("Résistance"),
    POWER("Puissance"),
    STRENGTH("Force"),
    BURN("Brûlure"),
    POISON("Poison"),
    DAMAGE_TAKEN_MAGIC("Dégâts subis (Magique)"),
    DAMAGE_TAKEN_PHYSIC("Dégâts subis (Physique)"),
    DAMAGE_TAKEN_BRUT("Dégâts subis (Brut)"),
    DAMAGE_GIVEN_MAGIC("Dégâts infligés (Magique)"),
    DAMAGE_GIVEN_PHYSIC("Dégâts infligés (Physique)"),
    DAMAGE_GIVEN_BRUT("Dégâts infligés (Brut)"),
    HEAL_RECEIVED("Soins reçus"),
    SHIELD_RECEIVED("Bouclier reçu"),
    HEAL_GIVEN("Soins prodigués"),
    SHIELD_GIVEN("Bouclier prodigué"),
    DAMAGE_GIVEN_MAGIC_TO_SHIELD("Dégâts sur bouclier (Magique)"),
    DAMAGE_GIVEN_PHYSIC_TO_SHIELD("Dégâts sur bouclier (Physique)"),
    SHIELD_PENETRATION("Pénétration de bouclier"),
    SHIELD_PIERCED("Bouclier percé"),
    AME_DETACHEE("Âme détachée");

    private final String label;

    StatType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    @Override
    public String toString() {
        return label;
    }
}
