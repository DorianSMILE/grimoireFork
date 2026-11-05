package generation.grimoire.dto.pve;

/**
 * Valeurs réelles pré-calculées pour un effet de sort en combat (SSOT).
 *
 * @param effectIndex               Index de l'effet dans la liste des effets du sort
 * @param effectId                  Identifiant de l'effet
 * @param calculatedValue           Valeur entière finale calculée (dégâts, soin, mana, bouclier, valeur flat de buff/débuff, chaleur, bourgeons)
 * @param calculatedPercentModifier Modificateur en pourcentage restant (ex: 20 pour +20%) pour un Buff/Débuff sans source dynamique
 * @param sourceResolvedToFlat      Vrai si un ratio basé sur une Source a été converti en valeur réelle entière
 */
public record SpellEffectPreviewDTO(
        int effectIndex,
        Long effectId,
        int calculatedValue,
        int calculatedPercentModifier,
        boolean sourceResolvedToFlat
) {
}
