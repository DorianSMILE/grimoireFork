# Implémentation du système de Modèles (Templates) pour les Objets

Ce document détaille la stratégie pour séparer strictement les **Modèles (Templates)** (les définitions de base créées par l'admin) des **Instances** (les objets réellement possédés par les joueurs).

## Analyse de la solution proposée

La solution proposée est excellente et résout un problème architectural critique : la confusion entre une *définition* d'objet (le modèle) et un *objet possédé*. Actuellement, des méthodes comme `findFirstByNameOrderByIdAsc()` risquent de piocher dans l'inventaire d'un joueur pour s'en servir de modèle de duplication. Si le joueur supprime ou modifie son objet, tout le système (recettes, butin) se casse.

### Ajustements recommandés :
1. **Unification du nommage** : `Equipment` utilise actuellement `isShopTemplate`. Il faut généraliser ce concept en `isTemplate` pour toutes les entités (`Equipment` et `Anomalie`).
2. **Propriétaire par défaut** : Pour s'assurer qu'un modèle n'apparaît jamais dans l'inventaire de quelqu'un, son `ownerUsername` sera systématiquement forcé à `"MODELE"` (et `user_id` à `null`).
3. **Sécurisation des requêtes (Repository)** : Créer des méthodes dédiées (ex: `findByIsTemplateTrue()`) pour garantir que les listes déroulantes admin ne chargent que les modèles.

---

## 1. Modifications des Entités et Repositories

### `Anomalie.java` et `Equipment.java`
- **Anomalie** : Ajouter le champ `private boolean isTemplate = false;`.
- **Equipment** : 
  - Renommer `isShopTemplate` en `isTemplate` (avec un alias `@Column(name = "is_template")` pour clarifier la BDD).
  - Ajouter un champ `private boolean availableInShop = false;` pour distinguer les modèles classiques des modèles vendables en boutique.

### `AnomalieRepository` & `EquipmentRepository`
- Créer `findFirstByNameAndIsTemplateTrueOrderByIdAsc(String name)` pour récupérer le modèle officiel lors d'une duplication.
- Créer `findByIsTemplateTrue()` pour l'affichage dans les selects d'administration (PvE Admin, Vault Admin).
- Créer `findByIsTemplateTrueAndAvailableInShopTrue()` (uniquement pour `EquipmentRepository`) pour la rotation du Daily Shop.
- Mettre à jour les méthodes existantes pour garantir que l'inventaire d'un joueur ne charge jamais les modèles (ex: `isTemplate = false`).

## 2. Logique de Création (Admin)

### `EquipmentController` & `AnomalieController`
- Lors de la création d'un nouvel objet par un administrateur via les interfaces (Forge Admin, Création d'Anomalie), forcer :
  - `isTemplate = true`
  - `ownerUsername = "MODELE"`
  - `user = null`

## 3. Logique de Duplication (Gain pour le joueur)

### `ShopController`, `AlchemyService`, `CombatService`
- **Récompenses et Achats** : Lors de l'achat d'un item, de la génération d'un butin (Loot/Boss), ou d'une récompense de transmutation, le système doit chercher le modèle via `findFirstByNameAndIsTemplateTrue...()`.
- L'instance générée pour le joueur aura `isTemplate = false`, l'`ownerUsername` du joueur, et sera sauvegardée comme une copie indépendante.

## 4. Consommation et Transmutation

### `AlchemyService` (Crafting)
- Lors de la recherche des ingrédients dans l'inventaire du joueur, s'assurer que la requête filtre bien avec `isTemplate = false`. Ainsi, un modèle ne sera jamais comptabilisé ou consommé accidentellement.

## 5. Interface Utilisateur (Front-end)

### Vault & Armory
- **Vault (Coffre global)** : Pour les administrateurs, modifier l'affichage pour que si `isTemplate === true` (ou `ownerUsername === 'MODELE'`), un badge visuel distinctif **[MODÈLE]** remplace le nom du propriétaire.
- **Armurerie (Inventaire joueur)** : Les requêtes API de l'armurerie ne remonteront que les `isTemplate = false`. Les modèles n'y apparaîtront jamais.

### PvE Admin (Éditeur de Donjons)
- **Selects (Autels, Récompenses, Marchands)** : Mettre à jour l'API pour que les listes d'équipements et d'anomalies proposées dans l'éditeur de donjon proviennent exclusivement de la route qui renvoie `isTemplate = true`.

## Vérification requise

> [!WARNING]
> La modification de `isShopTemplate` en `isTemplate` nécessitera une mise à jour des objets existants en base de données pour s'assurer que les modèles actuels sont bien flaggés. 

## Questions Ouvertes

- Pour la base de données, préférez-vous qu'on renomme la colonne `is_shop_template` en `is_template` (nécessite de mettre à jour le schéma SQL), ou qu'on garde le nom de colonne SQL actuel en renommant juste la variable Java `isTemplate` pour simplifier ?
- Souhaitez-vous un script automatique/route API jetable qui passe tous les objets "modèles" actuels en `ownerUsername = "MODELE"` pour nettoyer la base de données existante sans devoir le faire à la main ?
