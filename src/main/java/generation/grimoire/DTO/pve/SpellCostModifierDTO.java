package generation.grimoire.dto.pve;

/**
 * Représente un modificateur dynamique (surcoût ou réduction) appliqué au coût d'un sort
 * (ex: Incantations Lourdes, Passif Karma, Voie de la Destruction, Voie de la Création).
 */
public record SpellCostModifierDTO(
        String label,
        String valueText,
        boolean bonus
) {
}
