# Audit Architectural — GRIMOIRE_ARCHITECTURE.md

## Résumé

Le document `GRIMOIRE_ARCHITECTURE.md` a été **considérablement renforcé** depuis l'audit initial. Les 3 piliers fondamentaux sont solides, les sections Sécurité (§4) et Front-End Avancées (§5) ont été ajoutées, et le Master Prompt reflète toutes les règles. L'audit terrain révèle toutefois des **violations résiduelles** qui doivent être corrigées dans le code.

---

## 1. Validation : Les 3 dettes ciblées

### ✅ Duplication logique de calcul (poids)

La règle **B3 (DTOs Actifs)** + **B4 (Simulate)** couvrent ce cas. Constat terrain :

- ~~[armory.js] contenait `calculateEquipmentWeight()` avec tous les multiplicateurs hardcodés.~~ **(CORRIGÉ)**
- ~~[shop-admin.js] contenait `calculateEquipmentWeight()`, `calculateShopPrice()` et `WEIGHT_LIMITS` en dur.~~ **(CORRIGÉ)**

**Verdict** : B3+B4 ont été appliquées avec succès. L'intégralité du calcul (poids, limites, prix) est centralisée dans le back-end (`Equipment.java`) et interrogée via l'endpoint de simulation (`/api/equipments/simulate-weight`).

> [!WARNING]
> **Violation résiduelle :** `WEIGHT_LIMITS` est encore hardcodé dans [constants.js](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/js/constants.js#L24-L35) et consommé par [vault.js](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/js/vault.js#L536) pour la validation côté client. Ce dictionnaire duplique les valeurs du `EquipmentController.getMaxWeight()`. Il devrait être fourni par le back-end via `/api/meta` ou l'endpoint `simulate-weight`.

### ✅ HTML/CSS dans le code Java/BDD

La règle **B1** couvre exactement ce cas. Constat terrain :

- ~~[WebSpellCreationController.java] contenait de nombreuses balises HTML (strong, ul, style inline).~~ **(CORRIGÉ)**

**Verdict** : B1 a été appliquée avec succès, le code Java a été purgé de ses balises HTML.

### ✅ Hardcodage de dictionnaires de traduction en JS

La règle **F1** couvre ce cas. Constat terrain :

- ~~`GLOBAL_STAT_LABELS` est maintenant hydraté par le back-end.~~ **(CORRIGÉ)**
- ~~`SLOT_LABELS` et d'autres constantes sont dupliquées et hardcodées.~~ **(CORRIGÉ)** — Maintenant hydraté via `window.SLOT_LABELS` depuis `/api/meta`.

> [!WARNING]
> **Violation résiduelle :** [combat.js:2663-2673](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/js/combat.js#L2663-L2673) contient un dictionnaire `behaviorTitles` et `bIcon`/`bLabel` hardcodés pour les comportements de monstres (`PREDATEUR`, `CORRUPTEUR`, etc.). Ceci viole **F1** et **B2** : ces métadonnées devraient être portées par l'enum `MonsterBehavior` côté Java et sérialisées via `/api/meta`.

**Verdict** : F1 majoritairement appliquée. Reste la dette `behaviorTitles` dans `combat.js`.

---

## 2. Angles morts identifiés

### ✅ AM-1 : Sécurité des appels API — CORRIGÉ

~~[SecurityConfig.java:24] : `.anyRequest().permitAll()` — toutes les routes API étaient ouvertes à tous.~~ **(CORRIGÉ)**

Le fichier `SecurityConfig.java` a été mis à jour pour exiger le rôle `ADMIN` sur toutes les routes d'administration (`/api/admin/**`, `/api/equipments/**`, `/api/spells-editor/**`, etc.). La faille critique est fermée.

### ✅ AM-2 : Inline CSS dans les templates JS — CORRIGÉ

Plus de 1090 occurrences de `style="..."` ont été converties en classes utilitaires (ex: `flex-between`, `text-muted`) via un script de migration massif. La dette a été purgée.

> [!NOTE]
> Des régressions ponctuelles peuvent apparaître lors de l'ajout de nouvelles fonctionnalités. Vigilance continue requise.

### ✅ AM-3 : Gestion d'erreurs API — CORRIGÉ

- `alert()` purgé de l'intégralité du codebase JS (0 occurrence).
- `GlobalExceptionHandler.java` implémenté avec `@ControllerAdvice` — retourne `{ "error": "..." }` structuré, jamais de stacktrace.

### ✅ AM-4 : Architecture CSS réelle ≠ F3 prescrite — CORRIGÉ

La structure CSS a été migrée et F3 dans `GRIMOIRE_ARCHITECTURE.md` reflète la réalité :
- `/styles/variables.css` ✅
- `/styles/ui/` ✅ (components.css, forms.css, layout.css, utilities.css)
- `/styles/pages/` ✅ (vault.css, armory.css, etc.)
- `/styles/sprites/` ✅

### ✅ AM-5 : State management non documenté — CORRIGÉ

Règle F6 établie. `pageState` adopté dans : `armory.js`, `vault.js`, `shop.js`, `shop-admin.js`.

> [!NOTE]
> `combat.js`, `dungeons.js` et `pve-admin.js` n'ont pas encore adopté le pattern `pageState` — ils utilisent toujours des variables `let` globales. Conversion à planifier.

### ✅ AM-6 : Gestion des appels fetch() — CORRIGÉ (PARTIEL)

`globalFetch()` est utilisé dans tous les fichiers `.js` principaux.

> [!WARNING]
> **Violation résiduelle :** `auth.js` utilise `fetch()` brut (6 occurrences) — légitime car c'est le module d'authentification lui-même (bootstrap). Plus critique : [alchemy.html](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/alchemy.html) et [alchemy-admin.html](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/alchemy-admin.html) contiennent leur JS inline avec des appels `fetch()` directs (14 occurrences au total). Ces pages devraient avoir un fichier JS dédié utilisant `globalFetch()`.

### ✅ AM-7 : L'exception légitime pour `element.style` dans les animations — CORRIGÉ

La règle F2 dans l'architecture exempte explicitement les animations procédurales.

### ✅ AM-8 : Absence de convention de nommage API — CORRIGÉ

La **Règle B5** a été ajoutée dans `GRIMOIRE_ARCHITECTURE.md`. `EquipmentController` migré vers `/api/equipments`.

### ✅ AM-9 : Conflits de Stacking Context (z-index) sur les Custom Selects — CORRIGÉ

L'utilisation de `position: relative` et d'une décrémentation manuelle du `z-index` sur des éléments de liste (`.req-item`) créait des contextes d'empilement isolés. La contrainte a été retirée, le `z-index: 99999` du wrapper `.open` gère correctement la superposition.

### ✅ AM-10 : Faille de Sécurité suite à la migration d'URL — CORRIGÉ

Suite à la correction de l'AM-8 (`/api/equipment` → `/api/equipments`), `SecurityConfig.java` n'avait pas été mis à jour. Les routes POST/DELETE sur `/api/equipments` étaient déprotégées. Corrigé.

---

## 3. Violations résiduelles (non corrigées)

> [!IMPORTANT]
> Les items ci-dessous sont des violations actives des règles du document `GRIMOIRE_ARCHITECTURE.md`. Ils nécessitent des corrections dans le code.

### ⚠️ VR-1 : `WEIGHT_LIMITS` hardcodé en JS (viole F1 + B3)

**Fichier** : [constants.js:24-35](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/js/constants.js#L24-L35)
**Consommé par** : [vault.js:536](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/js/vault.js#L536), [vault.js:968](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/js/vault.js#L968)

Le dictionnaire `WEIGHT_LIMITS` duplique les valeurs de `EquipmentController.getMaxWeight()` côté Java. La validation devrait passer par l'endpoint `/api/equipments/simulate-weight` qui existe déjà.

### ⚠️ VR-2 : `behaviorTitles` hardcodé dans `combat.js` (viole F1 + B2)

**Fichier** : [combat.js:2663-2673](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/js/combat.js#L2663-L2673)

Dictionnaires `behaviorTitles`, `bIcon`, `bLabel` codés en dur pour les 6 comportements de monstres. Ces métadonnées devraient être portées par l'enum `MonsterBehavior` côté Java et exposées via `/api/meta`.

### ⚠️ VR-3 : Pages Alchimie sans `globalFetch()` (viole F4)

**Fichiers** :
- [alchemy.html](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/alchemy.html) : 7 appels `fetch()` directs
- [alchemy-admin.html](file:///c:/Users/doria/Desktop/Project/grimoire/src/main/resources/static/alchemy-admin.html) : 7 appels `fetch()` directs

Ces pages ont leur JS inliné dans le HTML et n'utilisent pas le wrapper `globalFetch()`. À migrer vers un fichier JS dédié.

### ⚠️ VR-4 : `pageState` non adopté par toutes les pages (viole F6)

**Fichiers manquants** : `combat.js`, `dungeons.js`, `pve-admin.js`, `grimoire.js`

Ces fichiers utilisent encore des variables `let` globales au lieu d'un objet `pageState` encapsulé.

### ⚠️ VR-5 : Enums Java non enrichies (viole B2)

**`@JsonFormat(shape = Shape.OBJECT)`** n'est utilisé sur aucune enum. Les métadonnées (label, icon, color) sont servies par `EnumMetaController` dans un format ad-hoc, mais les enums elles-mêmes ne portent pas leurs propriétés en Java. Enums concernées :
- `EquipmentRarity` — pas de propriétés label/icon/color intégrées
- `MonsterBehavior` — pas de description/icon
- `MonsterType` — pas de description/icon
- `ConsumableCategory` — pas de label/icon/color

---

## 4. Conformité GRIMOIRE_ARCHITECTURE.md ↔ Code

| Règle | Statut | Note |
|---|---|---|
| B1 (No HTML in DB) | ✅ Conforme | — |
| B2 (Rich Enums) | ⚠️ Partiel | Enums servies via EnumMetaController mais pas enrichies en Java (VR-5) |
| B3 (DTOs Actifs) | ⚠️ Partiel | `WEIGHT_LIMITS` encore dupliqué côté JS (VR-1) |
| B4 (Simulate) | ✅ Conforme | Endpoint `/api/equipments/simulate-weight` opérationnel |
| B5 (Conventions REST) | ✅ Conforme | `/api/equipments`, `/api/admin/pve` etc. |
| F1 (Zéro logique JS) | ⚠️ Partiel | `behaviorTitles` hardcodé dans combat.js (VR-2) |
| F2 (Zéro CSS inline) | ✅ Conforme | Migration massif effectuée, exception animations documentée |
| F3 (Arborescence CSS) | ✅ Conforme | `/styles/variables.css`, `/styles/ui/`, `/styles/pages/`, `/styles/sprites/` |
| F4 (Fetch centralisé) | ⚠️ Partiel | alchemy.html et alchemy-admin.html utilisent fetch() brut (VR-3) |
| F5 (Erreurs unifiées) | ✅ Conforme | 0 alert(), GlobalExceptionHandler en place |
| F6 (State par page) | ⚠️ Partiel | combat.js, dungeons.js, pve-admin.js pas migrés (VR-4) |
| F7 (Zéro HTML inline) | ✅ Conforme | — |
| S1 (Protection routes) | ✅ Conforme | SecurityConfig à jour, routes `/api/equipments` protégées |
| S2 (CSRF) | ✅ Documenté | Commenté dans SecurityConfig |
| S3 (Pas de stacktrace) | ✅ Conforme | GlobalExceptionHandler opérationnel |

---

## 5. Angle morts historiques corrigés

| Angle mort | Statut | Résolution |
|---|---|---|
| Sécurité API (permitAll) | ✅ CORRIGÉ | SecurityConfig + rôle ADMIN |
| Template literals inline | ✅ CORRIGÉ | Migration massif + F2 renforcée |
| Gestion d'erreurs | ✅ CORRIGÉ | F5 + GlobalExceptionHandler |
| Couche API centralisée | ✅ CORRIGÉ | globalFetch() + F4 |
| State management | ✅ CORRIGÉ | F6 + pageState dans 4 fichiers |
| Convention API REST | ✅ CORRIGÉ | B5 + migration `/api/equipments` |
| Stacking Context (z-index) | ✅ CORRIGÉ | Retrait position/z-index dans .req-item |
| Sécurité Migration URL | ✅ CORRIGÉ | SecurityConfig `/api/equipments` |
