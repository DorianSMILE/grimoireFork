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
            "bottom",
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
    ),
    SHOP_GO_NAV(
            "SHOP_NAV",
            1,
            "1. Boutique Débloquée !",
            "Félicitations ! Vous avez terminé les donjons libres de niveau 1 et débloqué la Boutique. Cliquez sur l'onglet « Boutique » pour découvrir les offres du marchand.",
            "storefront",
            ".nav-shop",
            "bottom",
            "action",
            ".nav-shop"
    ),
    SHOP_DAILY(
            "SHOP_TOUR",
            1,
            "1. Boutique du Jour",
            "Voici l'étal principal du marchand ! Ces équipements se renouvellent automatiquement chaque jour à minuit. Débloquez les emplacements verrouillés en améliorant la boutique.",
            "storefront",
            "#shopGrid",
            "bottom",
            "manual",
            ""
    ),
    SHOP_SPECIALS(
            "SHOP_TOUR",
            2,
            "2. Offres Spéciales & Consommables",
            "Retrouvez ici les promotions temporaires à prix réduit ainsi que des consommables précieux (potions, clés, cordes) pour préparer vos prochaines expéditions.",
            "local_offer",
            "#specialsGrid",
            "top",
            "manual",
            ""
    ),
    SHOP_UPGRADE(
            "SHOP_TOUR",
            3,
            "3. Améliorer la Boutique",
            "Investissez votre Or et vos Anomalies ici pour faire monter la boutique de niveau : vous débloquerez davantage d'articles quotidiens, des raretés supérieures et les promotions !",
            "upgrade",
            "#shopUpgradePanel",
            "left",
            "manual",
            ""
    ),
    COMBAT_SPELLS(
            "COMBAT_TOUR",
            1,
            "1. Vos Sorts de Combat",
            "Voici la liste des sorts disponibles pour le héros actif lors de son tour. Chaque sort indique son coût en Mana, son temps de recharge et ses effets. Cliquez sur un sort puis sur sa cible pour le lancer.",
            "auto_awesome",
            "#spellsContainer",
            "top",
            "manual",
            ""
    ),
    COMBAT_SPELL_FILTER(
            "COMBAT_TOUR",
            2,
            "2. Tri et Filtres de Sorts",
            "Basculez ici entre vos sorts de Voie et de Spiritualité, ou utilisez le filtre par Type pour afficher uniquement vos sorts d'attaque, de soutien ou de contrôle.",
            "filter_list",
            ".csp-sidebar:not(.csp-sidebar-right)",
            "top",
            "manual",
            ""
    ),
    COMBAT_TYPE_INSTANT(
            "COMBAT_TOUR",
            3,
            "3. Sort Instantané",
            "Les sorts Instantanés (icône éclair jaune) ne consomment pas votre action principale du tour ! Vous pouvez en lancer plusieurs dans le même tour tant que vos ressources le permettent.",
            "bolt",
            "#combatSpellTypeFilterBtn",
            "top",
            "manual",
            ""
    ),
    COMBAT_TYPE_BANAL(
            "COMBAT_TOUR",
            4,
            "4. Sort Banal",
            "Les sorts Banals (icône sablier bleu) constituent l'action principale classique : vous ne pouvez lancer qu'un seul sort Banal (ou une Attaque de base) par tour.",
            "hourglass_empty",
            "#combatSpellTypeFilterBtn",
            "top",
            "manual",
            ""
    ),
    COMBAT_TYPE_CHANNELED(
            "COMBAT_TOUR",
            5,
            "5. Sort Canalisé",
            "Les sorts Canalisés (icône tourbillon violet) sont de puissantes actions qui s'exécutent sur plusieurs tours. Ils bloquent les actions banales durant leur canalisation (certains autorisent toutefois les sorts Instantanés).",
            "cyclone",
            "#combatSpellTypeFilterBtn",
            "top",
            "manual",
            ""
    ),
    COMBAT_BASIC_ATTACK(
            "COMBAT_TOUR",
            6,
            "6. L'Attaque de Base",
            "Vous manquez de Mana ou vos sorts sont en recharge ? L'Attaque de base ne coûte aucun Mana et inflige des dégâts physiques directs à un ennemi.",
            "swords",
            "#btnAttack",
            "top",
            "manual",
            ""
    ),
    COMBAT_END_TURN(
            "COMBAT_TOUR",
            7,
            "7. Fin de Tour",
            "Si vous ne souhaitez pas ou ne pouvez plus effectuer d'action, cliquez sur « Fin de Tour » pour passer immédiatement au combattant suivant.",
            "hourglass_top",
            "#btnEndTurn",
            "top",
            "manual",
            ""
    ),
    COMBAT_FLEE(
            "COMBAT_TOUR",
            8,
            "8. Fuir le Combat",
            "En cas de grand danger, vous pouvez fuir le donjon à tout moment avec « Fuir », mais attention : l'abandon entraîne une pénalité d'Or et d'XP !",
            "directions_run",
            "#btnFlee",
            "top",
            "manual",
            ""
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
