package generation.grimoire.enumeration;

public enum EquipmentSlot {
    CASQUE("Casque", "masks", "slot-casque"),
    PLASTRON("Plastron", "shield", "slot-plastron"),
    ARME_DEUX_MAINS("Arme 2M", "swords", "slot-arme"),
    ARME_GAUCHE("Arme 1M", "colorize", "slot-arme"),
    ARME_DROITE("Arme Sec.", "security", "slot-arme"),
    ANNEAU_GAUCHE("Anneau G.", "diamond", "slot-anneau"),
    ANNEAU_DROIT("Anneau D.", "diamond", "slot-anneau"),
    BOTTES("Bottes", "footprint", "slot-bottes"),
    CAPE("Cape", "carpenter", "slot-cape"),
    @Deprecated
    ARME("Arme", "swords", "slot-arme"), // Gardé temporairement pour éviter le crash avec les anciens objets en BDD
    CONSOMMABLE("Consommable", "inventory_2", "slot-consommable");

    private final String label;
    private final String icon;
    private final String cssClass;

    EquipmentSlot(String label, String icon, String cssClass) {
        this.label = label;
        this.icon = icon;
        this.cssClass = cssClass;
    }

    public String getName() { return name(); }
    public String getLabel() { return label; }
    public String getIcon() { return icon; }
    public String getCssClass() { return cssClass; }
}

