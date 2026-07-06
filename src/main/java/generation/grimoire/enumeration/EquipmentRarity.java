package generation.grimoire.enumeration;

public enum EquipmentRarity {
    COMMUN("Commun", "rarity-commun"),
    INHABITUEL("Inhabituel", "rarity-inhabituel"),
    RARE("Rare", "rarity-rare"),
    MYTHIQUE("Mythique", "rarity-mythique"),
    LEGENDAIRE("Légendaire", "rarity-legendaire"),
    EPIQUE("Épique", "rarity-epique"),
    RELIQUE("Relique", "rarity-relique"),
    MAUDIT("Maudit", "rarity-maudit");

    private final String label;
    private final String cssClass;

    EquipmentRarity(String label, String cssClass) {
        this.label = label;
        this.cssClass = cssClass;
    }

    public String getName() { return name(); }
    public String getLabel() { return label; }
    public String getCssClass() { return cssClass; }
}

