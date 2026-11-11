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
 * @param minCalculatedValue        Valeur calculée minimum observée (utile pour les effets de zone multi-cibles)
 * @param maxCalculatedValue        Valeur calculée maximum observée
 * @param minHpDamage               Dégâts PV minimums observés
 * @param maxHpDamage               Dégâts PV maximums observés
 * @param minShieldAbsorbed         Absorption bouclier minimum observée
 * @param maxShieldAbsorbed         Absorption bouclier maximum observée
 * @param minExtraBrutDamage        Dégâts bruts supplémentaires minimums observés
 * @param maxExtraBrutDamage        Dégâts bruts supplémentaires maximums observés
 * @param isAreaOfEffect            Vrai si l'effet touche une zone (plusieurs cibles potentielles)
 */
public record SpellEffectPreviewDTO(
        int effectIndex,
        Long effectId,
        int calculatedValue,
        int calculatedPercentModifier,
        boolean sourceResolvedToFlat,
        int hpDamage,
        int shieldAbsorbed,
        int extraBrutDamage,
        int minCalculatedValue,
        int maxCalculatedValue,
        int minHpDamage,
        int maxHpDamage,
        int minShieldAbsorbed,
        int maxShieldAbsorbed,
        int minExtraBrutDamage,
        int maxExtraBrutDamage,
        boolean isAreaOfEffect
) {
    public SpellEffectPreviewDTO(
            int effectIndex,
            Long effectId,
            int calculatedValue,
            int calculatedPercentModifier,
            boolean sourceResolvedToFlat,
            int hpDamage,
            int shieldAbsorbed,
            int extraBrutDamage
    ) {
        this(
                effectIndex,
                effectId,
                calculatedValue,
                calculatedPercentModifier,
                sourceResolvedToFlat,
                hpDamage,
                shieldAbsorbed,
                extraBrutDamage,
                calculatedValue,
                calculatedValue,
                hpDamage,
                hpDamage,
                shieldAbsorbed,
                shieldAbsorbed,
                extraBrutDamage,
                extraBrutDamage,
                false
        );
    }

    public SpellEffectPreviewDTO(
            int effectIndex,
            Long effectId,
            int calculatedValue,
            int calculatedPercentModifier,
            boolean sourceResolvedToFlat
    ) {
        this(effectIndex, effectId, calculatedValue, calculatedPercentModifier, sourceResolvedToFlat, calculatedValue, 0, 0);
    }

    public static SpellEffectPreviewDTO forAreaOfEffect(
            int effectIndex,
            Long effectId,
            int minCalculatedValue,
            int maxCalculatedValue,
            int calculatedPercentModifier,
            boolean sourceResolvedToFlat,
            int minHpDamage,
            int maxHpDamage,
            int minShieldAbsorbed,
            int maxShieldAbsorbed,
            int minExtraBrutDamage,
            int maxExtraBrutDamage
    ) {
        return new SpellEffectPreviewDTO(
                effectIndex,
                effectId,
                maxCalculatedValue,
                calculatedPercentModifier,
                sourceResolvedToFlat,
                maxHpDamage,
                maxShieldAbsorbed,
                maxExtraBrutDamage,
                minCalculatedValue,
                maxCalculatedValue,
                minHpDamage,
                maxHpDamage,
                minShieldAbsorbed,
                maxShieldAbsorbed,
                minExtraBrutDamage,
                maxExtraBrutDamage,
                true
        );
    }
}
