package generation.grimoire.enumeration;

public enum EquipmentSlot {
    CASQUE,
    PLASTRON,
    ARME_DEUX_MAINS,
    ARME_GAUCHE,
    ARME_DROITE,
    ANNEAU_GAUCHE,
    ANNEAU_DROIT,
    BOTTES,
    CAPE,
    @Deprecated
    ARME, // Gardé temporairement pour éviter le crash avec les anciens objets en BDD
    CONSOMMABLE
}
