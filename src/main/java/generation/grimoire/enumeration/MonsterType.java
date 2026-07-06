package generation.grimoire.enumeration;

public enum MonsterType {
    NORMAL("Normal", "Pas de passif", "pets"),
    DEMON("Démon", "10% des dégâts infligés sont aussi appliqués en brut", "whatshot"),
    REPTILE("Reptile", "15% de réduction des dégâts physiques subis", "bug_report"),
    MORT_VIVANT("Mort-vivant", "Régénère 5% de ses PV max à chaque début de tour", "skull"),
    HYBRIDE("Hybride", "Dégâts = (Force + Puissance) × 1.2, répartis moitié physique moitié magique", "merge_type"),
    VAMPIRE("Vampire", "20% de vol de vie sur les dégâts infligés", "water_drop"),
    ECTOPLASME("Ectoplasme", "Ses attaques appliquent un débuff de résistance magique (-5 rés pendant 3 tours)", "blur_on");

    private final String label;
    private final String description;
    private final String icon;

    MonsterType(String label, String description, String icon) {
        this.label = label;
        this.description = description;
        this.icon = icon;
    }

    public String getName() { return name(); }
    public String getLabel() { return label; }
    public String getDescription() { return description; }
    public String getIcon() { return icon; }
}

