package generation.grimoire.enumeration;

public enum MonsterType {
    NORMAL,       // Pas de passif
    DEMON,        // 10% des dégâts infligés sont aussi appliqués en brut
    REPTILE,      // 15% de réduction des dégâts physiques subis
    MORT_VIVANT,  // Régénère 5% de ses PV max à chaque début de tour
    HYBRIDE,      // Dégâts = (Force + Puissance) * 1.2, répartis moitié physique moitié magique
    VAMPIRE,      // 20% de vol de vie sur les dégâts infligés
    ECTOPLASME    // Ces attaques applique un débuff de résistance magique (-5 res pendant 3 tours)
}
