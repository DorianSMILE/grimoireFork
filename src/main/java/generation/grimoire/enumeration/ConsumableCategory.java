package generation.grimoire.enumeration;

public enum ConsumableCategory {
    POTION_ROSE("Potion Rose", "science", "cat-potion-rose"),
    POTION_BLEUE("Potion Bleue", "science", "cat-potion-bleue"),
    POTION_ROUGE("Potion Rouge", "science", "cat-potion-rouge"),
    POTION_VIOLETTE("Potion Violette", "science", "cat-potion-violette"),
    CLE("Clé", "vpn_key", "cat-cle"),
    CORDE("Corde", "gesture", "cat-corde"),
    PARCHEMIN("Parchemin", "history_edu", "cat-parchemin"),
    NOURRITURE("Nourriture", "restaurant", "cat-nourriture"),
    OUTIL("Outil", "construction", "cat-outil"),
    AUTRE("Autre", "inventory_2", "cat-autre");

    private final String label;
    private final String icon;
    private final String cssClass;

    ConsumableCategory(String label, String icon, String cssClass) {
        this.label = label;
        this.icon = icon;
        this.cssClass = cssClass;
    }

    public String getName() { return name(); }
    public String getLabel() { return label; }
    public String getIcon() { return icon; }
    public String getCssClass() { return cssClass; }
}

