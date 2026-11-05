package generation.grimoire.enumeration;

import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * Étapes du tutoriel guidé (création du premier personnage puis premier donjon).
 * Exposées via EnumMetaController pour respecter la philosophie SSOT (zéro texte métier hardcodé en JS).
 */
@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum TutorialStep {

    ARMORY_NAME(
            "ARMORY",
            1,
            "1. Nommez votre Héros",
            "Bienvenue à la Taverne ! Commencez par donner un nom à votre premier aventurier.",
            "badge",
            "#charName",
            "right",
            "input",
            "#charName"
    ),
    ARMORY_VOIE(
            "ARMORY",
            2,
            "2. Choisissez une Voie",
            "La Voie définit votre style de combat, vos sorts principaux ainsi que vos bonus et malus de statistiques de base.",
            "route",
            "#charVoieWrapper",
            "right",
            "change",
            "#charVoie"
    ),
    ARMORY_SPIRIT(
            "ARMORY",
            3,
            "3. Choisissez une Spiritualité",
            "La Spiritualité complète votre Voie avec un passif mystique unique et des sorts de soutien dédiés.",
            "psychology",
            "#charSpiritWrapper",
            "right",
            "change",
            "#charSpirit"
    ),
    ARMORY_PROFILE(
            "ARMORY",
            4,
            "4. Profil & Modificateurs",
            "Consultez ici l'impact de votre Voie sur vos statistiques de départ et la toile de spécialisation de votre héros. Survolez les icônes « i » pour lire les passifs.",
            "hub",
            "#voieStatsDiff",
            "right",
            "manual",
            ""
    ),
    ARMORY_SUBMIT(
            "ARMORY",
            5,
            "5. Forger le Personnage",
            "Votre premier héros est prêt ! Cliquez sur « Forger le Personnage » pour le recruter et partir vers les Donjons.",
            "person_add",
            "#submitBtn",
            "top",
            "submit",
            "#submitBtn"
    ),
    ARMORY_GO_DUNGEON(
            "ARMORY_DONE",
            1,
            "Cap sur les Donjons !",
            "Votre héros attend sa première bataille. Cliquez sur l'onglet « Donjons » pour lancer votre première expédition.",
            "swords",
            ".nav-dungeon",
            "bottom",
            "action",
            ".nav-dungeon"
    ),
    DUNGEON_SELECT_CARD(
            "DUNGEON",
            1,
            "1. Choisissez un Donjon",
            "Chaque carte affiche le niveau conseillé, la difficulté (crânes) et le résumé des salles. Cliquez directement sur un donjon débloqué pour ouvrir la préparation.",
            "castle",
            "#dungeonsSectionsContainer .dungeon-card:not(.locked)",
            "right",
            "action",
            "#dungeonsSectionsContainer .dungeon-card:not(.locked)"
    ),
    DUNGEON_SELECT_HERO(
            "DUNGEON",
            2,
            "2. Sélectionnez votre Héros",
            "Vous voici en salle de préparation ! Cliquez sur la carte de votre personnage pour l'engager dans cette expédition.",
            "group",
            "#prepCharList",
            "right",
            "action",
            "#prepCharList"
    ),
    DUNGEON_STATS_EQUIP(
            "DUNGEON",
            3,
            "3. Statistiques & Équipement",
            "Cette colonne récapitule les statistiques totales de votre héros ainsi que l'équipement qu'il porte actuellement.",
            "analytics",
            "#prepStatsEquipSection",
            "right",
            "manual",
            ""
    ),
    DUNGEON_INVENTORY(
            "DUNGEON",
            4,
            "4. Inventaire de Consommables",
            "Cet espace permet d'emporter des potions, clés ou cordes selon votre limite de poids. Votre inventaire est vide pour l'instant : vous ne pouvez donc rien prendre pour cette première expédition, mais vous gagnerez du butin en explorant !",
            "inventory_2",
            "#prepInventorySection",
            "left",
            "manual",
            ""
    ),
    DUNGEON_ROOMS(
            "DUNGEON",
            5,
            "5. Salles & Contenu du Donjon",
            "Cet encadré détaille toutes les étapes qui composent le donjon : combats contre des monstres, salles de trésor, événements spéciaux, pièges et Boss.",
            "swords",
            "#prepRoomsSection",
            "left",
            "manual",
            ""
    ),
    DUNGEON_LOOT_SHIELD(
            "DUNGEON",
            6,
            "6. Butin du Donjon (Bouclier)",
            "En survolant cette icône de bouclier doré, vous consultez la liste complète des équipements et objets que vous pouvez obtenir dans ce donjon.",
            "shield",
            "#prepLootTooltipTrigger",
            "left",
            "manual",
            ""
    ),
    DUNGEON_ENTER(
            "DUNGEON",
            7,
            "7. Entrer dans le Donjon",
            "Tout est prêt pour l'aventure ! Cliquez sur « ENTRER DANS LE DONJON » pour lancer votre premier combat.",
            "play_arrow",
            "#btnEnterDungeon",
            "top",
            "action",
            "#btnEnterDungeon"
    ),
    EQUIP_GO_ARMORY(
            "EQUIP_NAV",
            1,
            "1. Premier Équipement Obtenu !",
            "Vous avez récupéré votre premier équipement ! Cliquez sur l'onglet « Armurerie » pour aller l'équiper sur votre héros.",
            "shield",
            ".nav-armory",
            "bottom",
            "action",
            ".nav-armory"
    ),
    EQUIP_CLICK_BTN(
            "EQUIP_ARMORY",
            1,
            "1. Ouvrir l'Équipement",
            "Cliquez sur le bouton « Équiper » de la carte de votre personnage pour ouvrir son inventaire d'équipement.",
            "shield",
            "#personnagesList .char-btn-equip",
            "left",
            "action",
            "#personnagesList .char-btn-equip"
    ),
    EQUIP_SELECT_ITEM(
            "EQUIP_ARMORY",
            2,
            "2. Équiper votre Objet",
            "Cliquez sur « Choisir un équipement... » dans l'emplacement disponible, puis sélectionnez l'objet obtenu pour l'équiper !",
            "checkroom",
            "#equipSlotsContainer .equip-slot-card:has(.custom-select-wrapper)",
            "right",
            "action",
            "#equipSlotsContainer .equip-slot-card"
    );

    private final String phase;
    private final int stepOrder;
    private final String label;
    private final String description;
    private final String icon;
    private final String targetSelector;
    private final String placement;
    private final String advanceTrigger;
    private final String actionTargetSelector;

    TutorialStep(
            String phase,
            int stepOrder,
            String label,
            String description,
            String icon,
            String targetSelector,
            String placement,
            String advanceTrigger,
            String actionTargetSelector) {
        this.phase = phase;
        this.stepOrder = stepOrder;
        this.label = label;
        this.description = description;
        this.icon = icon;
        this.targetSelector = targetSelector;
        this.placement = placement;
        this.advanceTrigger = advanceTrigger;
        this.actionTargetSelector = actionTargetSelector;
    }

    public String getName() {
        return name();
    }

    public String getPhase() {
        return phase;
    }

    public int getStepOrder() {
        return stepOrder;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }

    public String getIcon() {
        return icon;
    }

    public String getTargetSelector() {
        return targetSelector;
    }

    public String getPlacement() {
        return placement;
    }

    public String getAdvanceTrigger() {
        return advanceTrigger;
    }

    public String getActionTargetSelector() {
        return actionTargetSelector;
    }
}
