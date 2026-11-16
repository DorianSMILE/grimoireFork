package generation.grimoire.enumeration;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum AnomalieType {
    STANDARD("Anomalie", "Matériau ou relique alchimique classique (Niv. 1–3)", "star", "anomaly-type-standard"),
    CATALYSEUR("Catalyseur", "Anomalie de niveau 4 utilisée pour l'éveil d'équipement", "bolt", "anomaly-type-catalyst"),
    EVEIL("Anomalie d'Éveil", "Anomalie de niveau 5 utilisée pour les éveils majeurs", "auto_awesome", "anomaly-type-awakening");

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

    public static AnomalieType fromLevel(Integer level) {
        if (level == null) return STANDARD;
        return switch (level) {
            case 4 -> CATALYSEUR;
            case 5 -> EVEIL;
            default -> STANDARD;
        };
    }

    @JsonCreator
    public static AnomalieType fromNode(JsonNode node) {
        if (node == null || node.isNull()) return STANDARD;
        if (node.isObject() && node.has("name")) {
            return AnomalieType.valueOf(node.get("name").asText());
        }
        return AnomalieType.valueOf(node.asText());
    }
}
