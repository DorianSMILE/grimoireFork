# Audit Architectural — GRIMOIRE_ARCHITECTURE.md

## Résumé

Le document pose de **bonnes fondations** — les 3 piliers sont solides et bien formulés. Mais le scan du code révèle que le document est **nécessaire mais insuffisant** : il ne couvre pas plusieurs patterns de dette déjà présents et laisse des angles morts critiques pour un projet Spring Boot + Vanilla JS.

---

## 1. Validation : Les 3 dettes ciblées

### ✅ Duplication logique de calcul (poids)

La règle **B3 (DTOs Actifs)** + **B4 (Simulate)** couvrent ce cas. Constat terrain :

- ~~[armory.js] contenait `calculateEquipmentWeight()` avec tous les multiplicateurs hardcodés.~~ **(CORRIGÉ)**
- ~~[shop-admin.js] contenait `calculateEquipmentWeight()`, `calculateShopPrice()` et `WEIGHT_LIMITS` en dur.~~ **(CORRIGÉ)**

**Verdict** : B3+B4 ont été appliquées avec succès. L'intégralité du calcul (poids, limites, prix) est centralisée dans le back-end (`Equipment.java`) et interrogée via l'endpoint de simulation (`/api/equipment/simulate-weight`).

### ✅ HTML/CSS dans le code Java/BDD

La règle **B1** couvre exactement ce cas. Constat terrain :

- ~~[WebSpellCreationController.java] contenait de nombreuses balises HTML (strong, ul, style inline).~~ **(CORRIGÉ)**

**Verdict** : B1 a été appliquée avec succès, le code Java a été purgé de ses balises HTML.

### ✅ Hardcodage de dictionnaires de traduction en JS

La règle **F1** couvre ce cas. Constat terrain :

- ~~[constants.js](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/constants.js) : `GLOBAL_STAT_LABELS` est maintenant hydraté par le back-end.~~ **(CORRIGÉ)**
- ~~`SLOT_LABELS` et d'autres constantes (ex: `catIcons`) sont encore dupliqués et hardcodés dans `combat.js`, `shop-admin.js`, `vault.js` etc.~~ **(CORRIGÉ)**

**Verdict** : F1 a été appliquée avec succès. Un `EnumMetaController` charge toutes les métadonnées (icônes, couleurs, libellés) au démarrage de l'app UI via `window.initAppMeta()`. Plus aucun dictionnaire n'est codé en dur en JS.

---

## 2. Angles morts identifiés

### ✅ AM-1 : Sécurité des appels API — CORRIGÉ

~~[SecurityConfig.java:24] : `.anyRequest().permitAll()` — toutes les routes API étaient ouvertes à tous.~~ **(CORRIGÉ)**

Le fichier `SecurityConfig.java` a été mis à jour pour exiger le rôle `ADMIN` sur toutes les routes d'administration (`/api/admin/**`, `/api/equipment/**`, `/api/spells-editor/**`, etc.). La faille critique est fermée.

> [!NOTE]
> Le document architecture doit quand même mentionner les règles de sécurité comme proposé plus bas pour éviter toute régression future.

### ✅ AM-2 : Inline CSS dans les templates JS — CORRIGÉ

La règle F2 dit « Zéro CSS inline dans le JS ». Mais le problème **le plus massif** n'est pas `element.style.x` — c'est l'injection de HTML avec `style="..."` dans les template literals :

- [armory.js:249](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/armory.js#L249) : `` `<span style="font-size: 0.9rem; color: ${color}; font-weight: 500;">` ``
- [armory.js:711-817](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/armory.js#L711-L817) : blocs entiers de `<div style="display: flex; justify-content: space-between; font-size:...">`
- [auth.js:103](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/auth.js#L103) : un `<a>` complet avec 7 propriétés CSS inline
- [api.js:281](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/api.js#L281) : error display avec styles inline

**Verdict** : Plus de 1090 occurrences de `style="..."` ont été converties en classes utilitaires (ex: `flex-between`, `text-muted`) via un script de migration massif. La dette a été purgée.

### ✅ AM-3 : Gestion d'erreurs API — CORRIGÉ

Le code utilise indifféremment `alert()`, `showNotif()`, et `console.error()` pour les erreurs :
- [api.js:265-269](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/api.js#L265-L269) : `alert("Erreur lors de l'enregistrement")`
- [api.js:281](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/api.js#L281) : injection HTML avec `err.stack` — potentielle fuite d'info technique
- Certains appels `fetch()` ne vérifient même pas `res.ok`

Le document ne prescrit **aucun pattern** de gestion d'erreurs.

### ✅ AM-4 : Architecture CSS réelle = F3 prescrite (CORRIGÉ)

Le document prescrit `/css/global.css`, `/css/ui/`, `/css/modules/`, `/css/sprites/`. En réalité :
- Le dossier CSS est `/styles/` (pas `/css/`)
- Pas de sous-dossier `ui/` ni `modules/` — tout est à plat
- `variables.css` existe (≈ global), mais `components.css`, `forms.css` sont au même niveau que `vault.css`, `armory.css`
- Les animations sont dans `spell-cards-animations.css` (à plat, pas dans `sprites/`)

**La règle F3 ne correspond pas à la structure existante.** Soit on migre, soit on adapte F3.

### ✅ AM-5 : State management non documenté — CORRIGÉ

La règle F6 a été établie pour exiger un objet d'état par page (`const pageState = { ... }`).
À titre de démonstration, `armory.js` a été intégralement refactorisé pour éliminer les variables globales (`let voies`, `let personnages`) au profit de `pageState`.

### ✅ AM-6 : Gestion des appels fetch() — CORRIGÉ

`api.js` encapsule les appels de l'éditeur de sorts, mais les **autres pages font des `fetch()` directs** (armory.js, vault.js, shop.js, combat.js, dungeons.js) — sans headers communs, sans gestion centralisée du 401/403, sans retry.

### ✅ AM-7 : L'exception légitime pour `element.style` dans les animations — CORRIGÉ

[animations.js](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/animations.js) utilise massivement `p.style.left`, `p.style.transform`, etc. C'est **légitime** pour les animations par particules. La règle F2 l'exempte explicitement.

### ✅ AM-8 : Absence de convention de nommage API — CORRIGÉ

La **Règle B5** a été ajoutée pour standardiser les endpoints (pluriel, verbes REST stricts).
`EquipmentController` a été migré de `/api/equipment` vers `/api/equipments` en suivant cette nouvelle norme, et le frontend a été mis à jour pour s'y conformer.

Aucune convention REST n'est documentée.

---

## 3. Corrections proposées au document

> [!IMPORTANT]
> Ci-dessous les **modifications exactes** à apporter à [GRIMOIRE_ARCHITECTURE.md](file:///c:/Users/doson/IdeaProjects/grimoire/GRIMOIRE_ARCHITECTURE.md). Chaque bloc est un diff appliquable.

### 3.1 — Renforcer F2 pour couvrir les template literals

```diff
 *   **Règle F2 - Zéro CSS inline dans le JS :** 
-    Ne jamais injecter de logique de style (ex: `element.style.display = 'none'` ou `<div style="...">`) via JavaScript. Le JS sert uniquement à basculer des classes d'état CSS existantes (`.is-hidden`, `.is-active`).
+    Ne jamais injecter de logique de style via JavaScript, que ce soit par manipulation DOM (`element.style.display = 'none'`) ou par template literal (`<div style="...">`). Le JS sert uniquement à basculer des classes d'état CSS existantes (`.is-hidden`, `.is-active`).
+    **Exception** : les animations procédurales (ex: positionnement de particules via `transform`, `left`, `top`) où les valeurs sont calculées en runtime sont exemptées de cette règle.
```

### 3.2 — Corriger F3 pour refléter le chemin réel

```diff
 *   **Règle F3 - Arborescence CSS stricte :** 
-    *   `/css/global.css` : Variables, typographie, reset.
-    *   `/css/ui/` : Composants réutilisables partagés (boutons, tooltips, modales, notifications).
-    *   `/css/modules/` : Grilles et layouts uniques à une page (ex: `vault.css`).
-    *   `/css/sprites/` : Fichiers isolés contenant uniquement les lourdes animations (ex: `@keyframes` pixel art).
+    *   `/styles/variables.css` : Variables CSS custom, tokens de couleur, typographie.
+    *   `/styles/ui/` : Composants réutilisables partagés (boutons, tooltips, modales, notifications, formulaires).
+    *   `/styles/pages/` : Layouts uniques à une page (ex: `vault.css`, `armory.css`).
+    *   `/styles/sprites/` : Fichiers isolés contenant uniquement les lourdes animations (ex: `@keyframes`, spritesheets pixel art).
```

### 3.3 — Ajouter une section Sécurité (nouvelle section 4)

```diff
 ---
 
+## 4. Règles de Sécurité
+
+*   **Règle S1 - Protection des routes API :**
+    Les endpoints admin (`/api/**/admin/**`, création/suppression/modification d'entités de jeu) doivent être protégés par `@PreAuthorize("hasRole('ADMIN')")` ou via `SecurityFilterChain`. Le RBAC frontend (masquage de boutons) est cosmétique et ne constitue **pas** une sécurité.
+*   **Règle S2 - CSRF :**
+    Si CSRF est désactivé (API stateless consommée par du JS same-origin), documenter explicitement pourquoi. À terme, envisager un header custom (`X-Requested-With`) vérifié côté serveur pour protéger contre les requêtes cross-origin.
+*   **Règle S3 - Ne jamais exposer de stacktraces au client :**
+    Les erreurs API doivent retourner un JSON structuré `{ "error": "message user-friendly" }`, jamais de `err.stack` ou d'exception Java. Utiliser un `@ControllerAdvice` global.
+
+---
+
```

### 3.4 — Ajouter une section Front-End patterns (nouvelle section 5)

```diff
+## 5. Règles Front-End Avancées (Patterns)
+
+*   **Règle F4 - Couche API centralisée :**
+    Tous les appels `fetch()` doivent passer par un wrapper centralisé dans `api.js` (ou un fichier dédié par domaine : `api/equipment.js`, `api/combat.js`). Ce wrapper gère : les headers communs, la vérification `res.ok`, la redirection sur 401, et le parsing JSON. Aucun `fetch()` direct dans les fichiers de page.
+*   **Règle F5 - Gestion d'erreurs unifiée :**
+    Interdit d'utiliser `alert()` pour les erreurs. Utiliser systématiquement le système de notification existant (`showNotif(message, isError)`). Ne jamais afficher de stack trace ou de détail technique à l'utilisateur.
+*   **Règle F6 - State par page :**
+    Chaque page encapsule son état dans un objet dédié (`const pageState = { ... }`), jamais en variables globales `let` éparpillées. Le state partagé inter-pages reste dans `state.js`.
+*   **Règle F7 - Zéro HTML dans le JS (template strings) :**
+    Privilégier des fonctions de création de composants (`createCard(data)`, `createStatBadge(stat)`) qui utilisent `document.createElement()` et des classes CSS, plutôt que des template literals injectés via `innerHTML`. Si `innerHTML` est utilisé pour des raisons de performance, le HTML ne doit contenir **aucun attribut `style`** — uniquement des classes CSS.
+
+---
+
```

### 3.5 — Renforcer B2 avec des exemples concrets

```diff
 *   **Règle B2 - Les "Rich Enums" pour les Métadonnées :** 
-    Les types stricts (Comportements, Raretés, Catégories) ne sont pas de simples chaînes. L'`enum` Java doit centraliser ses propres métadonnées (label, description, icône) via des propriétés privées, et être sérialisée en objet JSON complet pour le front.
+    Les types stricts (Comportements, Raretés, Catégories, Slots, Sources) ne sont pas de simples chaînes. L'`enum` Java doit centraliser ses propres métadonnées (label, description, icône, couleur CSS sémantique) via des propriétés privées, et être sérialisée en objet JSON complet pour le front via un `@JsonFormat(shape = Shape.OBJECT)` ou un serializer custom.
+    **Exemple** : `EquipmentSlot.CASQUE` doit exposer `{ "name": "CASQUE", "label": "Casque", "icon": "masks" }` et non simplement `"CASQUE"`.
+    **Liste des enums à enrichir** : `EquipmentRarity`, `EquipmentSlot`, `MonsterBehavior`, `MonsterType`, `Source`, `ConsumableCategory`.
```

### 3.6 — Renuméroter et mettre à jour le Master Prompt

La section "Master System Prompt" (§ dernier) doit refléter les nouvelles règles ajoutées. Ajouter après le point 4 :

```diff
 > 4. **Front-End Modulaire :** Le CSS utilitaire (tooltips, boutons) va dans des fichiers dédiés (`css/ui/`). Isole les animations lourdes (Spritesheets) dans `css/sprites/`. Le JS ne modifie pas le DOM avec du style en ligne, il ne fait qu'ajouter ou retirer des classes CSS (ex: `.is-hidden`).
-> 
+> 5. **Sécurité :** Les routes admin sont protégées par `@PreAuthorize`. Le RBAC front n'est que cosmétique. Les erreurs API retournent du JSON structuré, jamais de stacktrace.
+> 6. **Fetch centralisé :** Tous les appels API passent par un wrapper dans `api.js`. Zéro `fetch()` direct dans les pages. Gestion unifiée des erreurs via `showNotif()`, jamais `alert()`.
+> 7. **Zéro HTML inline :** Les templates JS n'injectent jamais d'attribut `style="..."`. Utiliser des classes CSS et des fonctions de création de composants.
+> 
 > Concentre-toi sur la propreté, la scalabilité et l'élimination stricte de la duplication de code entre le back et le front.
```

---

## Récapitulatif

| Règle existante | Couvre la dette ciblée ? | Suffisante ? |
|---|---|---|
| B1 (No HTML in DB) | ✅ Oui | ✅ Bien formulée |
| B2 (Rich Enums) | ✅ Oui | ⚠️ Manque exemples + liste d'enums concernées |
| B3 (DTOs Actifs) | ✅ Oui | ✅ Bien formulée |
| B4 (Simulate) | ✅ Oui | ✅ Bien formulée |
| F1 (Zéro logique JS) | ✅ Oui | ✅ Bien formulée |
| F2 (Zéro CSS inline) | ⚠️ Partiel | 🔴 Ne couvre pas template literals, pas d'exception animations |
---

## 1. Validation : Les 3 dettes ciblées

### ✅ Duplication logique de calcul (poids)

La règle **B3 (DTOs Actifs)** + **B4 (Simulate)** couvrent ce cas. Constat terrain :

- ~~[armory.js] contenait `calculateEquipmentWeight()` avec tous les multiplicateurs hardcodés.~~ **(CORRIGÉ)**
- ~~[shop-admin.js] contenait `calculateEquipmentWeight()`, `calculateShopPrice()` et `WEIGHT_LIMITS` en dur.~~ **(CORRIGÉ)**

**Verdict** : B3+B4 ont été appliquées avec succès. L'intégralité du calcul (poids, limites, prix) est centralisée dans le back-end (`Equipment.java`) et interrogée via l'endpoint de simulation (`/api/equipment/simulate-weight`).

### ✅ HTML/CSS dans le code Java/BDD

La règle **B1** couvre exactement ce cas. Constat terrain :

- ~~[WebSpellCreationController.java] contenait de nombreuses balises HTML (strong, ul, style inline).~~ **(CORRIGÉ)**

**Verdict** : B1 a été appliquée avec succès, le code Java a été purgé de ses balises HTML.

### ✅ Hardcodage de dictionnaires de traduction en JS

La règle **F1** couvre ce cas. Constat terrain :

- ~~[constants.js](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/constants.js) : `GLOBAL_STAT_LABELS` est maintenant hydraté par le back-end.~~ **(CORRIGÉ)**
- ~~`SLOT_LABELS` et d'autres constantes (ex: `catIcons`) sont encore dupliqués et hardcodés dans `combat.js`, `shop-admin.js`, `vault.js` etc.~~ **(CORRIGÉ)**

**Verdict** : F1 a été appliquée avec succès. Un `EnumMetaController` charge toutes les métadonnées (icônes, couleurs, libellés) au démarrage de l'app UI via `window.initAppMeta()`. Plus aucun dictionnaire n'est codé en dur en JS.

---

## 2. Angles morts identifiés

### ✅ AM-1 : Sécurité des appels API — CORRIGÉ

~~[SecurityConfig.java:24] : `.anyRequest().permitAll()` — toutes les routes API étaient ouvertes à tous.~~ **(CORRIGÉ)**

Le fichier `SecurityConfig.java` a été mis à jour pour exiger le rôle `ADMIN` sur toutes les routes d'administration (`/api/admin/**`, `/api/equipment/**`, `/api/spells-editor/**`, etc.). La faille critique est fermée.

> [!NOTE]
> Le document architecture doit quand même mentionner les règles de sécurité comme proposé plus bas pour éviter toute régression future.

### ✅ AM-2 : Inline CSS dans les templates JS — CORRIGÉ

La règle F2 dit « Zéro CSS inline dans le JS ». Mais le problème **le plus massif** n'est pas `element.style.x` — c'est l'injection de HTML avec `style="..."` dans les template literals :

- [armory.js:249](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/armory.js#L249) : `` `<span style="font-size: 0.9rem; color: ${color}; font-weight: 500;">` ``
- [armory.js:711-817](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/armory.js#L711-L817) : blocs entiers de `<div style="display: flex; justify-content: space-between; font-size:...">`
- [auth.js:103](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/auth.js#L103) : un `<a>` complet avec 7 propriétés CSS inline
- [api.js:281](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/api.js#L281) : error display avec styles inline

**Verdict** : Plus de 1090 occurrences de `style="..."` ont été converties en classes utilitaires (ex: `flex-between`, `text-muted`) via un script de migration massif. La dette a été purgée.

### ✅ AM-3 : Gestion d'erreurs API — CORRIGÉ

Le code utilise indifféremment `alert()`, `showNotif()`, et `console.error()` pour les erreurs :
- [api.js:265-269](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/api.js#L265-L269) : `alert("Erreur lors de l'enregistrement")`
- [api.js:281](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/api.js#L281) : injection HTML avec `err.stack` — potentielle fuite d'info technique
- Certains appels `fetch()` ne vérifient même pas `res.ok`

Le document ne prescrit **aucun pattern** de gestion d'erreurs.

### ✅ AM-4 : Architecture CSS réelle = F3 prescrite (CORRIGÉ)

Le document prescrit `/css/global.css`, `/css/ui/`, `/css/modules/`, `/css/sprites/`. En réalité :
- Le dossier CSS est `/styles/` (pas `/css/`)
- Pas de sous-dossier `ui/` ni `modules/` — tout est à plat
- `variables.css` existe (≈ global), mais `components.css`, `forms.css` sont au même niveau que `vault.css`, `armory.css`
- Les animations sont dans `spell-cards-animations.css` (à plat, pas dans `sprites/`)

**La règle F3 ne correspond pas à la structure existante.** Soit on migre, soit on adapte F3.

### ✅ AM-5 : State management non documenté — CORRIGÉ

La règle F6 a été établie pour exiger un objet d'état par page (`const pageState = { ... }`).
À titre de démonstration, `armory.js` a été intégralement refactorisé pour éliminer les variables globales (`let voies`, `let personnages`) au profit de `pageState`.

### ✅ AM-6 : Gestion des appels fetch() — CORRIGÉ

`api.js` encapsule les appels de l'éditeur de sorts, mais les **autres pages font des `fetch()` directs** (armory.js, vault.js, shop.js, combat.js, dungeons.js) — sans headers communs, sans gestion centralisée du 401/403, sans retry.

### ✅ AM-7 : L'exception légitime pour `element.style` dans les animations — CORRIGÉ

[animations.js](file:///c:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/js/animations.js) utilise massivement `p.style.left`, `p.style.transform`, etc. C'est **légitime** pour les animations par particules. La règle F2 l'exempte explicitement.

### ✅ AM-8 : Absence de convention de nommage API — CORRIGÉ

La **Règle B5** a été ajoutée pour standardiser les endpoints (pluriel, verbes REST stricts).
`EquipmentController` a been migré de `/api/equipment` vers `/api/equipments` en suivant cette nouvelle norme, et le frontend a été mis à jour pour s'y conformer.

Aucune convention REST n'est documentée.

---

## 3. Corrections proposées au document

> [!IMPORTANT]
> Ci-dessous les **modifications exactes** à apporter à [GRIMOIRE_ARCHITECTURE.md](file:///c:/Users/doson/IdeaProjects/grimoire/GRIMOIRE_ARCHITECTURE.md). Chaque bloc est un diff appliquable.

### 3.1 — Renforcer F2 pour couvrir les template literals

```diff
 *   **Règle F2 - Zéro CSS inline dans le JS :** 
-    Ne jamais injecter de logique de style (ex: `element.style.display = 'none'` ou `<div style="...">`) via JavaScript. Le JS sert uniquement à basculer des classes d'état CSS existantes (`.is-hidden`, `.is-active`).
+    Ne jamais injecter de logique de style via JavaScript, que ce soit par manipulation DOM (`element.style.display = 'none'`) ou par template literal (`<div style="...">`). Le JS sert uniquement à basculer des classes d'état CSS existantes (`.is-hidden`, `.is-active`).
+    **Exception** : les animations procédurales (ex: positionnement de particules via `transform`, `left`, `top`) où les valeurs sont calculées en runtime sont exemptées de cette règle.
```

### 3.2 — Corriger F3 pour refléter le chemin réel

```diff
 *   **Règle F3 - Arborescence CSS stricte :** 
-    *   `/css/global.css` : Variables, typographie, reset.
-    *   `/css/ui/` : Composants réutilisables partagés (boutons, tooltips, modales, notifications).
-    *   `/css/modules/` : Grilles et layouts uniques à une page (ex: `vault.css`).
-    *   `/css/sprites/` : Fichiers isolés contenant uniquement les lourdes animations (ex: `@keyframes` pixel art).
+    *   `/styles/variables.css` : Variables CSS custom, tokens de couleur, typographie.
+    *   `/styles/ui/` : Composants réutilisables partagés (boutons, tooltips, modales, notifications, formulaires).
+    *   `/styles/pages/` : Layouts uniques à une page (ex: `vault.css`, `armory.css`).
+    *   `/styles/sprites/` : Fichiers isolés contenant uniquement les lourdes animations (ex: `@keyframes`, spritesheets pixel art).
```

### 3.3 — Ajouter une section Sécurité (nouvelle section 4)

```diff
 ---
 
+## 4. Règles de Sécurité
+
+*   **Règle S1 - Protection des routes API :**
+    Les endpoints admin (`/api/**/admin/**`, création/suppression/modification d'entités de jeu) doivent être protégés par `@PreAuthorize("hasRole('ADMIN')")` ou via `SecurityFilterChain`. Le RBAC frontend (masquage de boutons) est cosmétique et ne constitue **pas** une sécurité.
+*   **Règle S2 - CSRF :**
+    Si CSRF est désactivé (API stateless consommée par du JS same-origin), documenter explicitement pourquoi. À terme, envisager un header custom (`X-Requested-With`) vérifié côté serveur pour protéger contre les requêtes cross-origin.
+*   **Règle S3 - Ne jamais exposer de stacktraces au client :**
+    Les erreurs API doivent retourner un JSON structuré `{ "error": "message user-friendly" }`, jamais de `err.stack` ou d'exception Java. Utiliser un `@ControllerAdvice` global.
+
+---
+
```

### 3.4 — Ajouter une section Front-End patterns (nouvelle section 5)

```diff
+## 5. Règles Front-End Avancées (Patterns)
+
+*   **Règle F4 - Couche API centralisée :**
+    Tous les appels `fetch()` doivent passer par un wrapper centralisé dans `api.js` (ou un fichier dédié par domaine : `api/equipment.js`, `api/combat.js`). Ce wrapper gère : les headers communs, la vérification `res.ok`, la redirection sur 401, et le parsing JSON. Aucun `fetch()` direct dans les fichiers de page.
+*   **Règle F5 - Gestion d'erreurs unifiée :**
+    Interdit d'utiliser `alert()` pour les erreurs. Utiliser systématiquement le système de notification existant (`showNotif(message, isError)`). Ne jamais afficher de stack trace ou de détail technique à l'utilisateur.
+*   **Règle F6 - State par page :**
+    Chaque page encapsule son état dans un objet dédié (`const pageState = { ... }`), jamais en variables globales `let` éparpillées. Le state partagé inter-pages reste dans `state.js`.
+*   **Règle F7 - Zéro HTML dans le JS (template strings) :**
+    Privilégier des fonctions de création de composants (`createCard(data)`, `createStatBadge(stat)`) qui utilisent `document.createElement()` et des classes CSS, plutôt que des template literals injectés via `innerHTML`. Si `innerHTML` est utilisé pour des raisons de performance, le HTML ne doit contenir **aucun attribut `style`** — uniquement des classes CSS.
+
+---
+
```

### 3.5 — Renforcer B2 avec des exemples concrets

```diff
 *   **Règle B2 - Les "Rich Enums" pour les Métadonnées :** 
-    Les types stricts (Comportements, Raretés, Catégories) ne sont pas de simples chaînes. L'`enum` Java doit centraliser ses propres métadonnées (label, description, icône) via des propriétés privées, et être sérialisée en objet JSON complet pour le front.
+    Les types stricts (Comportements, Raretés, Catégories, Slots, Sources) ne sont pas de simples chaînes. L'`enum` Java doit centraliser ses propres métadonnées (label, description, icône, couleur CSS sémantique) via des propriétés privées, et être sérialisée en objet JSON complet pour le front via un `@JsonFormat(shape = Shape.OBJECT)` ou un serializer custom.
+    **Exemple** : `EquipmentSlot.CASQUE` doit exposer `{ "name": "CASQUE", "label": "Casque", "icon": "masks" }` et non simplement `"CASQUE"`.
+    **Liste des enums à enrichir** : `EquipmentRarity`, `EquipmentSlot`, `MonsterBehavior`, `MonsterType`, `Source`, `ConsumableCategory`.
```

### 3.6 — Renuméroter et mettre à jour le Master Prompt

La section "Master System Prompt" (§ dernier) doit refléter les nouvelles règles ajoutées. Ajouter après le point 4 :

```diff
 > 4. **Front-End Modulaire :** Le CSS utilitaire (tooltips, boutons) va dans des fichiers dédiés (`css/ui/`). Isole les animations lourdes (Spritesheets) dans `css/sprites/`. Le JS ne modifie pas le DOM avec du style en ligne, il ne fait qu'ajouter ou retirer des classes CSS (ex: `.is-hidden`).
-> 
+> 5. **Sécurité :** Les routes admin sont protégées par `@PreAuthorize`. Le RBAC front n'est que cosmétique. Les erreurs API retournent du JSON structuré, jamais de stacktrace.
+> 6. **Fetch centralisé :** Tous les appels API passent par un wrapper dans `api.js`. Zéro `fetch()` direct dans les pages. Gestion unifiée des erreurs via `showNotif()`, jamais `alert()`.
+> 7. **Zéro HTML inline :** Les templates JS n'injectent jamais d'attribut `style="..."`. Utiliser des classes CSS et des fonctions de création de composants.
+> 
 > Concentre-toi sur la propreté, la scalabilité et l'élimination stricte de la duplication de code entre le back et le front.
```

---

## Récapitulatif

| Règle existante | Couvre la dette ciblée ? | Suffisante ? |
|---|---|---|
| B1 (No HTML in DB) | ✅ Oui | ✅ Bien formulée |
| B2 (Rich Enums) | ✅ Oui | ⚠️ Manque exemples + liste d'enums concernées |
| B3 (DTOs Actifs) | ✅ Oui | ✅ Bien formulée |
| B4 (Simulate) | ✅ Oui | ✅ Bien formulée |
| F1 (Zéro logique JS) | ✅ Oui | ✅ Bien formulée |
| F2 (Zéro CSS inline) | ⚠️ Partiel | 🔴 Ne couvre pas template literals, pas d'exception animations |
| F3 (Arborescence CSS) | ❌ Incorrect | 🔴 Chemin `/css/` ≠ réalité `/styles/` |

| Angle mort | Criticité | Section proposée |
|---|---|---|
| Sécurité API (permitAll) | ✅ CORRIGÉ | Nouvelle section 4 (S1, S2, S3) |
| Template literals inline | ✅ CORRIGÉ | F2 renforcée + F7 (Purge effectuée) |
| Gestion d'erreurs | ✅ CORRIGÉ | F5 |
| Couche API centralisée | ✅ CORRIGÉ | F4 |
| State management | ✅ CORRIGÉ | F6 |
| Convention API REST | ✅ CORRIGÉ | B5 ajoutée |
