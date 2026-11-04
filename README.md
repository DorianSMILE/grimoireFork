# 🏰 Grimoire — Architecture & Documentation Technique

## Vue d'ensemble

**Grimoire** est un jeu de rôle/RPG web monolithique construit sur **Spring Boot 3.4.4** / **Java 21**, avec un frontend statique (HTML/CSS/JS vanilla + Canvas) servi directement par le backend. Le backend gère l'intégralité de la logique métier (philosophie **SSOT** — *Single Source of Truth*) : authentification, gestion des personnages, système de combat PvE solo et multijoueur en temps réel, donjons procéduraux/scriptés, tutoriel guidé, tableau de chasse, hauts faits & titres, secrets musicaux, alchimie, boutique évolutive, et éditeur de sorts complet.

> [!NOTE]
> Package racine : `generation.grimoire` — groupId Maven `generation`, artifactId `grimoire`.

---

## Stack technique

| Composant | Technologie | Version |
|---|---|---|
| Runtime | Java | 21 |
| Framework | Spring Boot | 3.4.4 |
| ORM | Hibernate / JPA | (via `spring-boot-starter-data-jpa`) |
| BDD | MySQL | 8.0 |
| Sécurité | Spring Security + JWT (`jjwt`) | 0.11.5 |
| Mapping | MapStruct + Mappers Spring | 1.6.3 |
| Sérialisation | Jackson + `jackson-datatype-hibernate6` | — |
| Boilerplate | Lombok | 1.18.36 |
| Frontend | Vanilla JS (ES6+) / CSS3 / HTML5 Canvas | — |
| Build | Maven (wrapper) | — |
| Conteneurisation & Cloud | Docker, Docker Compose, AWS ECR & AWS Lambda (Web Adapter) | — |

### Choix architecturaux notables

- **Monolithe pur & SSOT** — pas de microservices, tout dans un seul JAR. Le backend détient 100 % des formules et règles métier ; le frontend est une couche de présentation pure.
- **Frontend statique** servi par Spring via `/static/` — zéro framework JS, zéro moteur de template serveur (Thymeleaf, etc.).
- **Sessions de combat in-memory** (`ConcurrentHashMap`) — pas de persistance des combats actifs en BDD, diffusion temps réel via **SSE** (*Server-Sent Events*).
- **`ddl-auto=update`** — le schéma BDD évolue avec les entités.
- **Caching & Compression** — `@EnableCaching` sur les recettes d'alchimie, cache HTTP sur les ressources statiques (`max-age=3600`), compression Gzip activée.
- **Scheduling activé** (`@EnableScheduling`) — timeout automatique des combats inactifs et rotation quotidienne/hebdomadaire des quêtes de chasse.

---

## Structure des packages Backend

```text
generation.grimoire/
├── GrimoireApplication.java          ← Point d'entrée (@EnableScheduling, @EnableCaching)
├── TestRunner.java                   ← CommandLineRunner (profil "dev" uniquement)
│
├── config/                           ← Configuration Spring
│   ├── WebMvcConfig.java             ← Enregistrement du CombatInterceptor
│   ├── CombatInterceptor.java        ← Bloque les actions hors-combat si le joueur est en combat
│   └── JacksonConfig.java            ← Module Hibernate6 pour gérer les lazy proxies
│
├── security/                         ← Authentification & autorisation
│   ├── SecurityConfig.java           ← Chaîne de filtres, RBAC (USER/ADMIN), stateless
│   ├── JwtService.java               ← Génération/validation JWT (HS256, 15min)
│   ├── JwtAuthenticationFilter.java  ← Filtre HTTP extrayant le JWT du header
│   ├── RefreshTokenService.java      ← Gestion des refresh tokens persistés en BDD
│   └── UserDetailsServiceImpl.java   ← Bridge vers Spring Security
│
├── controller/                       ← REST API (16 contrôleurs)
│   ├── auth/
│   │   └── AuthController.java       ← Login, register, refresh token
│   ├── pve/
│   │   ├── CombatController.java     ← Actions de combat (cast, flee, next-room, signaux/pings, SSE)
│   │   ├── DungeonController.java    ← Liste/détail des donjons et sources de drop
│   │   ├── DungeonStatController.java← Statistiques globales et personnelles des donjons
│   │   ├── HuntingQuestController.java ← Quêtes de chasse (quotidiennes/hebdomadaires)
│   │   ├── MultiCombatController.java← Lobbies multi-joueurs (créer, rejoindre, SSE)
│   │   ├── PvEAdminController.java   ← CRUD admin donjons/monstres/mutations
│   │   ├── SecretController.java     ← Validation et récompenses des secrets par palier
│   │   └── TestMonstreController.java← Endpoint de test pour les monstres
│   ├── AchievementController.java    ← Hauts faits, titres actifs et notifications
│   ├── PersonnageController.java     ← CRUD personnages, équipement, spiritualité
│   ├── EquipmentController.java      ← Templates, boutique, inventaire
│   ├── ShopController.java           ← Boutique évolutive (achat/vente, amélioration, config admin)
│   ├── WebSpellCreationController.java ← Éditeur de sorts (CRUD complet avec effets)
│   ├── AlchemyController.java        ← Recettes et crafting
│   ├── AnomalieController.java       ← CRUD anomalies (objets magiques)
│   ├── EnumMetaController.java       ← Exposition des métadonnées d'enums au frontend
│   └── DebugController.java          ← Endpoint de debug (dev)
│
├── service/                          ← Logique métier (19 services)
│   ├── pve/
│   │   ├── CombatService.java        ← Service de façade pour le combat
│   │   ├── CombatRoomService.java    ← Gestion des salles, portes étranges, autels, loots et progression
│   │   ├── CombatTurnService.java    ← Moteur de tours, initiative, canalisation et statuts
│   │   ├── CombatActionService.java  ← Résolution des actions de combat (fuite, objets, signaux)
│   │   ├── CombatLogCapture.java     ← Capture structurée des logs de combat par action/tour
│   │   ├── CombatEventEmitter.java   ← SSE (Server-Sent Events) pour le temps réel
│   │   ├── DungeonLootTrackerService.java ← Suivi et agrégation des loots obtenus en donjon
│   │   ├── DungeonTutorialService.java    ← Logique du donjon tutoriel guidé
│   │   ├── HuntingQuestService.java  ← Génération, progression et réclamation des quêtes de chasse
│   │   ├── MultiCombatService.java   ← Lobbies multi-joueurs + synchronisation
│   │   ├── PvEAdminService.java      ← Opérations CRUD admin PvE
│   │   └── SpellAvailabilityService.java  ← Évaluation de la disponibilité des sorts (coûts, CD, conditions)
│   ├── AchievementService.java       ← Déblocage des hauts faits (standards & boss), stats et titres
│   ├── SpellService.java             ← Résolution et lancement des sorts (577 lignes)
│   ├── PassiveDispatcher.java        ← Dispatch des événements aux passifs (mediator)
│   ├── AlchemyService.java           ← Crafting avec vérification d'ingrédients et limites
│   ├── DataInitializerService.java   ← Seed des Voies et Spiritualités au démarrage
│   ├── RenameCascadeService.java     ← Cascade de renommage (anomalies & équipements)
│   ├── PersonnageService.java        ← Accès et gestion des personnages
│   └── VoieService.java              ← Accès aux voies
│
├── entity/                           ← Entités JPA (modèle de données persisté)
│   ├── auth/
│   │   ├── AppUser.java              ← Utilisateur (rôle, or, secrets, titre actif, niveau boutique)
│   │   └── RefreshToken.java         ← Token de rafraîchissement
│   ├── achievement/
│   │   ├── UserAchievement.java      ← Haut fait débloqué par un joueur
│   │   ├── UserCustomAchievement.java← Haut fait personnalisé (lié aux salles de boss)
│   │   └── UserStatistics.java       ← Compteurs statistiques du joueur
│   ├── personnage/
│   │   ├── Personnage.java           ← Entité centrale du héros
│   │   ├── PersonnageCombatHelper.java ← Logique de combat et stats extraite
│   │   └── ActiveShield.java         ← Bouclier actif en combat
│   ├── pve/
│   │   ├── Donjon.java               ← Donjon (salles ordonnées, secret requis, tutoriel)
│   │   ├── Salle.java                ← Salle (combat, trésor, piège, événement, autel, boss...)
│   │   ├── Monstre.java              ← Template de monstre (stats, type, behavior, format boss)
│   │   ├── Mutation.java             ← Mutation applicable aux monstres
│   │   ├── LootEntry.java            ← Table de loot (probabilité + récompense)
│   │   ├── DungeonRunStat.java       ← Historique statistique d'une run de donjon
│   │   ├── HuntingQuest.java         ← Quête de chasse active (quotidienne/hebdomadaire)
│   │   └── HuntingQuestEntry.java    ← Objectif de monstre au sein d'une quête de chasse
│   ├── spell/type/effect/            ← 20 sous-types concrets de SpellEffect (SINGLE_TABLE)
│   ├── voie/passif/                  ← Passifs de Voie (8 implémentations spécifiques)
│   ├── spiritualite/passif/          ← Passifs de Spiritualité (3 implémentations)
│   ├── Spell.java                    ← Sort (coûts, type de cast, effets)
│   ├── SpellEffect.java              ← Classe abstraite racine des effets (SINGLE_TABLE)
│   ├── Equipment.java                ← Équipement / consommable (template ou instance)
│   ├── Anomalie.java                 ← Objet magique (monnaie alternative / ingrédient)
│   ├── AlchemyRecipe.java            ← Recette d'alchimie
│   ├── ShopUpgradeConfig.java        ← Configuration des paliers d'amélioration de la boutique
│   ├── ShopSlotRarityRule.java       ← Règles de probabilités de rareté par slot de boutique
│   ├── Voie.java                     ← Voie (classe de personnage)
│   └── Spiritualite.java             ← Spiritualité (sous-classe thématique)
│
├── model/pve/                        ← Objets transients (non persistés en BDD)
│   ├── CombatSession.java            ← État complet d'un combat en cours
│   ├── MultiCombatSession.java       ← État d'un lobby multi-joueurs
│   ├── ActiveMonster.java            ← Instance vivante d'un monstre en combat
│   ├── InitiativeEntry.java          ← Entrée dans l'ordre d'initiative
│   ├── SpellAvailability.java        ← Disponibilité d'un sort (grisage frontend)
│   ├── Challenge.java                ← Défi de combat optionnel en salle de donjon
│   └── RoomInteractionChoice.java    ← Choix interactif de salle (autel, porte étrange, événement)
│
├── dto/                              ← Data Transfer Objects (24 DTOs : records & classes)
│   ├── achievement/                  ← AchievementDTO, SetTitleRequestDTO, UserAchievementsResponseDTO
│   ├── alchemy/                      ← AlchemyRecipeRequestDTO, CraftRequestDTO
│   ├── equipment/                    ← EquipmentRequestDTO, EquipmentResponseDTO, EquipmentShopDTO
│   ├── personnage/                   ← PersonnageRequestDTO, PersonnageResponseDTO, PersonnageSummaryDTO
│   ├── pve/                          ← DonjonDTO, LobbyInfoDTO, CombatSignalDTO, DungeonStatsResponse...
│   ├── shop/                         ← ShopStatusDTO
│   └── spell/                        ← SpellCreationRequestDTO
│
├── mapper/                           ← Conversion Entité ↔ DTO (MapStruct & Spring)
│   ├── PersonnageMapper.java
│   ├── EquipmentMapper.java
│   ├── SpellMapper.java
│   └── AlchemyRecipeMapper.java
│
├── enumeration/                      ← 26 enums de domaine (exposés via @JsonFormat / EnumMetaController)
│   ├── StatType, DamageType, EffectTarget, Source
│   ├── SpellCategory, SpellCastingType
│   ├── EquipmentSlot, EquipmentRarity, EquipmentEffectType
│   ├── MonsterType, MonsterBehavior, RoomType, EventSubType, TrapEffectType
│   ├── AnomalieCategory, ConsumableCategory, SpiritualiteType
│   ├── VoieType, KarmaAlignment, DetachedSoulRequirement, RecipeRewardType
│   ├── AchievementCategory, AchievementType, DungeonOutcome
│   └── CombatSignalType, CombatSignalAction
│
├── event/                            ← Événements de gameplay (pattern Observer)
│   ├── GameEvent.java                ← Interface de base
│   ├── TurnStartEvent.java
│   ├── SpellCastEvent.java
│   ├── SpellChannelingTickEvent.java ← Tick de sort canalisé
│   ├── SpellCostAdjustEvent.java
│   ├── SpellCostPaidEvent.java
│   ├── CanCastCheckEvent.java
│   └── CastingTypeAdjustEvent.java
│
├── passif/
│   └── PassiveEffect.java            ← Interface unifiée pour tous les passifs
│
├── exception/
│   └── GlobalExceptionHandler.java   ← @ControllerAdvice, JSON structuré
│
├── scheduler/
│   ├── CombatTimeoutScheduler.java   ← Auto-flee des combats inactifs (10min)
│   └── HuntingQuestScheduler.java    ← Rotation automatique des quêtes de chasse
│
├── repository/                       ← 21 Spring Data JPA repositories
│   ├── auth/ (UserRepository, RefreshTokenRepository)
│   ├── pve/ (Donjon, Salle, Monstre, Mutation, LootEntry, DungeonRunStat, HuntingQuest, HuntingQuestEntry)
│   ├── Personnage, Spell, Equipment, Anomalie, Spiritualite, Voie, AlchemyRecipe, ShopUpgradeConfig
│   └── UserAchievement, UserCustomAchievement, UserStatistics
│
└── utils/
    └── StatCalculator.java           ← Résolution des sources de stats (switch exhaustif)
```

---

## Architecture Frontend (`src/main/resources/static/`)

Le frontend suit une architecture modulaire sans framework, découpée par domaine fonctionnel :

```text
static/
├── *.html                            ← 16 pages applicatives :
│   ├── index.html                    ← Grimoire & Forge de sorts
│   ├── armory.html                   ← Personnages, équipement, toile radar (Canvas), spiritualité
│   ├── combat.html                   ← Arène PvE solo/multi temps réel (SSE, sprites, signaux)
│   ├── dungeons.html                 ← Sélection de donjons, tutoriel & lobbies multijoueurs
│   ├── dungeon-stats.html            ← Statistiques globales et personnelles des runs
│   ├── hunting.html                  ← Tableau de chasse (quêtes quotidiennes et hebdomadaires)
│   ├── achievements.html             ← Hauts faits, statistiques joueur et sélection de titre
│   ├── secrets.html                  ← Secrets débloqués par paliers (audio & récompenses)
│   ├── shop.html / shop-admin.html   ← Boutique évolutive & administration des paliers/raretés
│   ├── alchemy.html / alchemy-admin.html ← Alchimie/craft & administration des recettes
│   ├── vault.html                    ← Coffre d'anomalies (objets magiques)
│   ├── pve-admin.html                ← Administration donjons, salles, monstres, mutations, hauts faits boss
│   └── login.html / register.html    ← Authentification
│
├── styles/                           ← Architecture CSS modulaire
│   ├── variables.css                 ← Tokens de design (couleurs, typographie, espacements)
│   ├── ui/                           ← Composants réutilisables (components, layout, forms, utilities, equipment...)
│   ├── pages/                        ← 16 feuilles de style spécifiques par page
│   └── sprites/ & sprite/            ← Animations CSS et spritesheets des 8 Voies + 3 Spiritualités
│       └── <voie>/                   ← Poses par Voie + sous-dossiers esprit/, karma/, tenebre/
│
├── js/
│   ├── app.js & ui.js                ← Initialisation globale et helpers d'interface
│   ├── services/                     ← api.js (client HTTP centralisé + refresh JWT), auth.js
│   ├── utils/                        ← constants.js, filters.js, state.js, utils.js
│   ├── components/                   ← animations.js (effets de forge Voie/Spiritualité), particles.js, modal.js, navbar.js...
│   ├── combat/                       ← Moteur client de combat (init, state, socket SSE, actions, spells, ui, signals, sprites)
│   ├── admin/                        ← Modules d'administration PvE (dungeons, monsters, mutations, items, state)
│   └── pages/                        ← Contrôleurs par page (armory, hero-spider Canvas, combat, hunting, achievements...)
│
└── sons/                             ← 38 pistes audio MP3 (ambiances donjon & thèmes des 11 secrets sur 3 niveaux)
```

---

## Modèle de données (relations clés)

### 1. Cartographie globale par domaines

```mermaid
flowchart TB
    subgraph Auth["🔐 Compte, Progression & Hauts Faits"]
        AppUser["AppUser"]
        RefreshToken["RefreshToken"]
        UserStats["UserStatistics"]
        UserAch["UserAchievement"]
        UserCustomAch["UserCustomAchievement"]
        AppUser -->|auth tokens| RefreshToken
        AppUser -->|1:1 stats| UserStats
        AppUser -->|débloque| UserAch
        AppUser -->|débloque boss| UserCustomAch
    end

    subgraph Hero["🧙‍♂️ Personnage & Classes"]
        Personnage["Personnage"]
        Voie["Voie"]
        VoiePassive["VoiePassiveEffect"]
        Spirit["Spiritualite"]
        SpiritPassive["SpiritualitePassiveEffect"]

        Personnage -->|suit| Voie
        Personnage -->|pratique| Spirit
        Voie -->|passifs| VoiePassive
        Spirit -->|passifs| SpiritPassive
    end

    subgraph Spells["✨ Magie & Sorts"]
        Spell["Spell"]
        SpellEffect["SpellEffect\n(SINGLE_TABLE)"]
        Spell -->|effets polymorphes| SpellEffect
        Spell -.->|lié à| Voie
        Spell -.->|lié à| Spirit
    end

    subgraph PvE["🏰 PvE, Donjons & Chasse"]
        Donjon["Donjon"]
        Salle["Salle"]
        Monstre["Monstre"]
        LootEntry["LootEntry"]
        Mutation["Mutation"]
        RunStat["DungeonRunStat"]
        HuntQuest["HuntingQuest"]
        HuntEntry["HuntingQuestEntry"]

        Donjon -->|salles ordonnées| Salle
        Donjon -->|historique| RunStat
        Salle -->|contient| Monstre
        Salle -->|table de loot| LootEntry
        Monstre -->|mutations| Mutation
        Spell -.->|mutation| Mutation
        HuntQuest -->|objectifs| HuntEntry
        HuntEntry -->|cible| Monstre
    end

    subgraph Eco["💰 Économie, Boutique & Alchimie"]
        Equipment["Equipment\n(Template / Instance)"]
        Anomalie["Anomalie\n(Objet Magique)"]
        Recipe["AlchemyRecipe"]
        ShopConfig["ShopUpgradeConfig"]
        ShopRule["ShopSlotRarityRule"]

        Recipe -->|ingrédients| Anomalie
        Equipment -.->|prix d'achat| Anomalie
        ShopConfig -->|règles de rareté| ShopRule
    end

    %% Relations inter-domaines
    AppUser -->|possède| Personnage
    AppUser -->|inventaire| Equipment
    AppUser -->|possède| Anomalie
    Personnage -->|équipé| Equipment
```

---

### 2. Schémas relationnels ciblés (par sous-système)

#### A. Joueur, Personnage, Équipement & Hauts Faits
```mermaid
erDiagram
    AppUser ||--o{ RefreshToken : "génère"
    AppUser ||--|| UserStatistics : "cumule"
    AppUser ||--o{ UserAchievement : "débloque"
    AppUser ||--o{ UserCustomAchievement : "valide (boss)"
    AppUser ||--o{ Personnage : "possède (max 2)"
    AppUser ||--o{ Equipment : "inventaire"
    AppUser ||--o{ Anomalie : "coffre"
    Personnage ||--o{ Equipment : "porte (slots)"
    Personnage }o--|| Voie : "suit"
    Personnage }o--|| Spiritualite : "pratique"
```

#### B. Sorts, Voies & Passifs
```mermaid
erDiagram
    Voie ||--o{ VoiePassiveEffect : "déclenche"
    Spiritualite ||--o{ SpiritualitePassiveEffect : "déclenche"
    Spell }o--|| Voie : "affinité"
    Spell }o--|| Spiritualite : "affinité"
    Spell }o--o| Mutation : "associé à"
    Spell ||--o{ SpellEffect : "applique (SingleTable)"
```

#### C. Donjons, Monstres, Chasse & Statistiques
```mermaid
erDiagram
    Donjon ||--o{ Salle : "composé de (ordre)"
    Donjon ||--o{ DungeonRunStat : "enregistre"
    Salle }o--o{ Monstre : "rencontre"
    Salle ||--o{ LootEntry : "récompenses"
    Monstre }o--o{ Mutation : "subit"
    LootEntry }o--o| Equipment : "drop équipement"
    HuntingQuest ||--o{ HuntingQuestEntry : "contient"
    HuntingQuestEntry }o--|| Monstre : "cible"
```

#### D. Alchimie & Boutique Évolutive
```mermaid
erDiagram
    AlchemyRecipe }o--o{ Anomalie : "consomme (ingrédients)"
    Equipment }o--o{ Anomalie : "coût boutique"
    AppUser ||--o{ Anomalie : "stocke"
    ShopUpgradeConfig ||--o{ ShopSlotRarityRule : "définit probabilités"
```

---

## Choix architecturaux détaillés

### 1. Système de sorts — Héritage SINGLE_TABLE

Le système de sorts utilise le pattern **Single Table Inheritance** de JPA :

- [`SpellEffect`](src/main/java/generation/grimoire/entity/SpellEffect.java) est la classe abstraite racine avec un `@DiscriminatorColumn("effect_type")`.
- **20 sous-types concrets** implémentent chacun leur propre méthode `apply(caster, target)` :

| Catégorie | Effets |
|---|---|
| **Dégâts** | `DamageEffect`, `DamageFixedEffect`, `DamagePercentageEffect`, `DamageOverTimeEffect` |
| **Soin** | `HealEffect`, `HealFixedEffect`, `HealPercentageEffect`, `HealOverTimeEffect` |
| **Mana** | `ManaEffect`, `ManaFixedEffect`, `ManaPercentageEffect`, `ManaOverTimeEffect` |
| **Chaleur** | `HeatFixedEffect`, `HeatPercentageEffect`, `HeatOverTimeEffect` |
| **Buff/Debuff** | `BuffDebuffEffect` |
| **Utilitaires** | `ShieldEffect`, `DispelEffect`, `PurgeEffect`, `BudEffect` |

**Pourquoi SINGLE_TABLE ?** Performance (pas de JOIN pour charger les effets d'un sort), simplicité des requêtes polymorphiques, et la table reste lisible car les sous-types partagent beaucoup de colonnes.

### 2. Système de passifs — Event-Driven avec Mediator

Architecture basée sur le pattern **Observer/Mediator** :

```text
GameEvent → PassiveDispatcher → [PassiveEffect₁, PassiveEffect₂, ...]
```

- [`PassiveEffect`](src/main/java/generation/grimoire/passif/PassiveEffect.java) — interface unifiée (toutes sources : Voie, Spiritualité...)
- [`PassiveDispatcher`](src/main/java/generation/grimoire/service/PassiveDispatcher.java) — collecte dynamiquement les passifs du personnage, les trie par priorité, et dispatch les événements.
- **7 types d'événements concrets** (implémentant [`GameEvent`](src/main/java/generation/grimoire/event/GameEvent.java)) : `TurnStartEvent`, `SpellCastEvent`, `SpellChannelingTickEvent`, `SpellCostAdjustEvent`, `SpellCostPaidEvent`, `CanCastCheckEvent`, `CastingTypeAdjustEvent`.
- **8 passifs de Voie** (Raison, Sûreté, Trahison, Consolidation, Conviction, Création, Destruction, Violence).
- **3 passifs de Spiritualité** (Esprit, Karma, Ténèbres).

**Pourquoi ?** Découplage total entre le moteur de combat et les effets passifs. Ajouter une nouvelle Voie = créer une classe, aucune modification du `CombatService`.

### 3. Combat — Sessions in-memory, SSE, Sprites dynamiques & Signaux

- Les combats sont stockés dans une `ConcurrentHashMap<String, CombatSession>` dans [`CombatService`](src/main/java/generation/grimoire/service/pve/CombatService.java), qui délègue aux sous-services spécialisés (`CombatRoomService`, `CombatTurnService`, `CombatActionService`, `SpellAvailabilityService`, `DungeonTutorialService`).
- Le temps réel utilise **Server-Sent Events (SSE)** via [`CombatEventEmitter`](src/main/java/generation/grimoire/service/pve/CombatEventEmitter.java) — chaque client reçoit les mises à jour de la session et les signaux tactiques via un `SseEmitter`.
- Un [`CombatTimeoutScheduler`](src/main/java/generation/grimoire/scheduler/CombatTimeoutScheduler.java) vérifie toutes les 60s et force la fuite des combats inactifs depuis plus de 10 minutes.
- [`CombatInterceptor`](src/main/java/generation/grimoire/config/CombatInterceptor.java) — `HandlerInterceptor` qui bloque toute action non-combat pour un joueur en plein combat (redirection vers `/combat.html` pour les pages, 403 pour les API).
- **Système de Sprites & Animations** : En combat et dans la forge, les animations et poses du héros s'adaptent dynamiquement à sa **Voie** (8 sets de poses complets) et à sa **Spiritualité** (overrides visuels pour *Esprit*, *Karma* et *Ténèbres*, gestion des sorts canalisés et animation de mort).

### 4. Multi-joueurs — Lobby, Délégation & Pings Tactiques

- [`MultiCombatService`](src/main/java/generation/grimoire/service/pve/MultiCombatService.java) gère un système de **lobbies** (code court 6 caractères).
- L'hôte crée un lobby → l'invité rejoint avec un code → une fois prêts, le lobby démarre un `CombatSession` partagé.
- En combat coopératif, les joueurs peuvent échanger des **signaux tactiques (pings & emotes)** temps réel via SSE (avec option d'ignorer les pings).

### 5. Progression Transverse — Hauts Faits, Chasse, Secrets & Statistiques

- **Hauts Faits & Titres** ([`AchievementService`](src/main/java/generation/grimoire/service/AchievementService.java)) : Suivi automatique des statistiques joueur (`UserStatistics`), déblocage de hauts faits globaux et de hauts faits personnalisés sur les salles de boss (`UserCustomAchievement`), attribution de titres affichés en jeu et notifications temps réel.
- **Tableau de Chasse** ([`HuntingQuestService`](src/main/java/generation/grimoire/service/pve/HuntingQuestService.java) & [`HuntingQuestScheduler`](src/main/java/generation/grimoire/scheduler/HuntingQuestScheduler.java)) : Quêtes quotidiennes et hebdomadaires de chasse aux monstres avec récompenses.
- **Secrets** ([`SecretController`](src/main/java/generation/grimoire/controller/pve/SecretController.java)) : Déblocage de secrets à 3 paliers liés aux monstres/donjons, avec pistes musicales dédiées et récompenses en or.
- **Statistiques de Donjons** ([`DungeonStatController`](src/main/java/generation/grimoire/controller/pve/DungeonStatController.java)) : Enregistrement de chaque fin de donjon (`DungeonRunStat`) permettant d'analyser les taux de victoire/défaite et la popularité des Voies/Spiritualités.

### 6. Sécurité — JWT Stateless + RBAC

- Authentification **JWT HS256** avec access token (15 min) + refresh token (persisté en BDD).
- **2 rôles** : `USER` et `ADMIN`.
- Les GET de consultation publique (ex. grimoire, métadonnées) sont accessibles sans authentification.
- Les mutations (POST/PUT/DELETE) d'administration nécessitent le rôle `ADMIN`.
- Les actions joueur (cast, equip, craft, chasse, boutique) nécessitent une authentification valide.
- CSRF désactivé (API stateless).

### 7. Sérialisation & Performance Hibernate

- [`JacksonConfig`](src/main/java/generation/grimoire/config/JacksonConfig.java) enregistre le `Hibernate6Module` pour que les lazy proxies non-initialisés se sérialisent en `null` au lieu de lever une `LazyInitializationException`.
- Optimisation des requêtes et écritures dans `application.properties` :
  - `default_batch_fetch_size=32` pour réduire drastiquement les requêtes N+1.
  - Batching JDBC activé (`batch_size=30`, `order_inserts=true`, `order_updates=true`).

### 8. Initialisation des données — Seed au démarrage

[`DataInitializerService`](src/main/java/generation/grimoire/service/DataInitializerService.java) utilise `@EventListener(ApplicationReadyEvent.class)` pour créer/mettre à jour les 8 Voies et 3 Spiritualités au démarrage avec leurs descriptions, rangs et passifs associés.

### 9. Pattern Template/Instance & Boutique Évolutive

Les `Equipment` et `Anomalie` utilisent un flag `isTemplate` :
- **Template** = définition de référence créée par l'admin.
- **Instance** = copie possédée par un joueur, créée via `copyStatsFrom(template)`.
- La boutique ([`ShopController`](src/main/java/generation/grimoire/controller/ShopController.java)) propose des slots configurables par palier (`ShopUpgradeConfig`, `ShopSlotRarityRule`) que le joueur peut améliorer pour débloquer davantage d'emplacements et de meilleures probabilités de rareté.

### 10. Cascade de renommage

[`RenameCascadeService`](src/main/java/generation/grimoire/service/RenameCascadeService.java) propage automatiquement les renommages d'**anomalies** et d'**équipements/consommables** à travers toutes les tables qui les référencent par nom (recettes d'alchimie, coûts d'équipements, secrets requis de donjons, secrets natifs de monstres, tables de loot et salles).

---

## Points d'attention

> [!IMPORTANT]
> ### Risques & Points de vigilance
> - **Combats in-memory** : perte des sessions de combat actives en cas de redémarrage serveur.
> - **`ddl-auto=update`** : pratique pour faire évoluer le schéma rapidement, mais les suppressions de colonnes obsolètes nécessitent un nettoyage SQL explicite (voir `scripts/clean_unused_db_columns.sql`).
> - **Suite de tests (72 classes de test)** : couvre les contrôleurs, services PvE, effets de sorts, passifs, mappers et sécurité. Le build Docker ignore les tests (`-DskipTests`) pour accélérer l'image : exécuter `mvn test` avant tout push sur `master`.
> - **Batch fetch & JDBC batching** (`default_batch_fetch_size=32`, `batch_size=30`) — optimise les performances mais requiert une surveillance des requêtes générées sur les graphes d'entités complexes.
> - **Références par nom** (anomalies/équipements dans certaines tables) — repose sur `RenameCascadeService` pour garantir l'intégrité référentielle lors d'un renommage admin.

---

## Déploiement & CI/CD

### 1. Déploiement Local / Docker Compose

```text
┌──────────────────┐      ┌──────────────────┐
│  Docker (app)    │──────│  MySQL 8.0       │
│  Java 21 JRE     │      │  (docker-compose)│
│  Spring Boot JAR │      │  Port 3306       │
│  Port 8080       │      └──────────────────┘
└──────────────────┘
```

- **Build** : `mvn clean package -DskipTests` dans un conteneur Maven multi-stage.
- **Run** : `java -jar app.jar` dans un conteneur JRE 21 (`Dockerfile`).
- **BDD** : MySQL 8.0 via `docker-compose.yml` avec volume persistant.

### 2. Déploiement Cloud Automatisé (AWS ECR + AWS Lambda)

Le workflow GitHub Actions (`.github/workflows/deploy.yml`) déploie automatiquement l'application à chaque push sur la branche `master` :
1. Build de l'image [`Dockerfile.aws`](Dockerfile.aws) intégrant l'extension **AWS Lambda Web Adapter** (`v0.8.4`) sur le port `8080`.
2. Push de l'image taguée (`$GITHUB_SHA` et `latest`) vers **AWS ECR**.
3. Mise à jour automatique du code de la fonction **AWS Lambda** (`rpg-coldrestart`).
