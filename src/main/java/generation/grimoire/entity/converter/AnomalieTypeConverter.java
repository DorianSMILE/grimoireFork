package generation.grimoire.entity.converter;

import generation.grimoire.enumeration.AnomalieType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Convertisseur JPA tolérant pour {@link AnomalieType} :
 * convertit notamment la valeur héritée {@code STANDARD} vers {@link AnomalieType#MAGIQUE}
 * avant que la migration SQL de démarrage ne mette à jour la base.
 */
@Converter
public class AnomalieTypeConverter implements AttributeConverter<AnomalieType, String> {

    @Override
    public String convertToDatabaseColumn(AnomalieType attribute) {
        return (attribute != null ? attribute : AnomalieType.MAGIQUE).name();
    }

    @Override
    public AnomalieType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank() || "STANDARD".equalsIgnoreCase(dbData.trim())) {
            return AnomalieType.MAGIQUE;
        }
        try {
            return AnomalieType.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return AnomalieType.MAGIQUE;
        }
    }
}
