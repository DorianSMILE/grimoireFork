package generation.grimoire.dto.pve;

/**
 * Valeurs réelles pré-calculées pour un effet de sort en combat (SSOT).
 *
 * @param effectIndex               Index de l'effet dans la liste des effets du sort
 * @param effectId                  Identifiant de l'effet
 * @param calculatedValue           Valeur entière finale calculée (dégâts PV réels, soin, mana, bouclier, valeur flat de buff/débuff, chaleur, bourgeons)
 * @param calculatedPercentModifier Modificateur en pourcentage restant (ex: 20 pour +20%) pour un Buff/Débuff sans source dynamique
 * @param sourceResolvedToFlat      Vrai si un ratio basé sur une Source a été converti en valeur réelle entière
 * @param hpDamage                  Dégâts réels infligés aux PV après réduction d'armure/résistance/passifs et absorption des boucliers
 * @param shieldAbsorbed            Dégâts absorbés par les boucliers (et bouclier de mana) de la cible
 * @param extraBrutDamage           Dégâts bruts supplémentaires déclenchés (ex: passif Trahison ou Démon)
 */
public record SpellEffectPreviewDTO(
        int effectIndex,
        Long effectId,
        int calculatedValue,
        int calculatedPercentModifier,
        boolean sourceResolvedToFlat,
        int hpDamage,
        int shieldAbsorbed,
        int extraBrutDamage
) {
    public SpellEffectPreviewDTO(
            int effectIndex,
            Long effectId,
            int calculatedValue,
            int calculatedPercentModifier,
            boolean sourceResolvedToFlat
    ) {
        this(effectIndex, effectId, calculatedValue, calculatedPercentModifier, sourceResolvedToFlat, calculatedValue, 0, 0);
    }
}
