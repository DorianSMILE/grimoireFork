package generation.grimoire.enumeration;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum AnomalieType {
    MAGIQUE("Magique", "Anomalie magique utilisée sur les autels et en alchimie", "star", "anomaly-type-magic"),
    MATERIAU("Matériau", "Matériau brut utilisé en alchimie", "category", "anomaly-type-material"),
    CATALYSEUR("Catalyseur", "Catalyseur utilisé pour l'éveil d'équipement", "bolt", "anomaly-type-catalyst"),
    EVEIL("Éveil", "Anomalie d'éveil utilisée pour les paliers supérieurs d'équipement", "auto_awesome", "anomaly-type-awakening");

    private final String label;
    private final String description;
    private final String icon;
    private final String cssClass;

    AnomalieType(String label, String description, String icon, String cssClass) {
        this.label = label;
        this.description = description;
        this.icon = icon;
        this.cssClass = cssClass;
    }

    public String getName() { return name(); }
    public String getLabel() { return label; }
    public String getDescription() { return description; }
    public String getIcon() { return icon; }
    public String getCssClass() { return cssClass; }

    @JsonCreator
    public static AnomalieType fromNode(JsonNode node) {
        if (node == null || node.isNull()) return MAGIQUE;
        String raw = (node.isObject() && node.has("name")) ? node.get("name").asText() : node.asText();
        if (raw == null || raw.isBlank() || "STANDARD".equalsIgnoreCase(raw)) {
            return MAGIQUE;
        }
        return AnomalieType.valueOf(raw);
    }
}
