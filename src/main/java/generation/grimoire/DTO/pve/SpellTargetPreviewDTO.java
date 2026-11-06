package generation.grimoire.dto.pve;

import java.util.List;

/**
 * Aperçu des coûts et effets calculés pour une cible spécifique (ennemi ou allié).
 */
public record SpellTargetPreviewDTO(
        int finalManaCost,
        int finalHealCost,
        int finalHeatCost,
        int rawManaCost,
        int percentManaAmount,
        int rawHealCost,
        int percentHealAmount,
        int rawHeatCost,
        int percentHeatAmount,
        List<SpellCostModifierDTO> manaModifiers,
        List<SpellCostModifierDTO> healModifiers,
        List<SpellCostModifierDTO> heatModifiers,
        List<SpellEffectPreviewDTO> effectPreviews
) {
}
