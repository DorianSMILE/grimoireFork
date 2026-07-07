package generation.grimoire.enumeration;

public enum ConsumableCategory {
    POTION_ROSE("Potion Rose", "science", "#ec4899"),
    POTION_BLEUE("Potion Bleue", "science", "#0ea5e9"),
    POTION_ROUGE("Potion Rouge", "science", "#ef4444"),
    POTION_VIOLETTE("Potion Violette", "science", "#a855f7"),
    CLE("Clé", "vpn_key", "#eab308"),
    CORDE("Corde", "gesture", "#8b4513"),
    PARCHEMIN("Parchemin", "history_edu", "#f59e0b"),
    NOURRITURE("Nourriture", "restaurant", "#f43f5e"),
    OUTIL("Outil", "construction", "#64748b"),
    AUTRE("Autre", "inventory_2", "#94a3b8");

    private final String label;
    private final String icon;
    private final String colorHex;

    ConsumableCategory(String label, String icon, String colorHex) {
        this.label = label;
        this.icon = icon;
        this.colorHex = colorHex;
    }

    public String getName() { return name(); }
    public String getLabel() { return label; }
    public String getIcon() { return icon; }
    public String getColorHex() { return colorHex; }
}

