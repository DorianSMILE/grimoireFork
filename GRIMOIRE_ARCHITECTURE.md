# 📖 GRIMOIRE : Architecture Master Guidelines

## 1. Les 3 Piliers Fondamentaux (Philosophie)
1. **Single Source of Truth (SSOT) :** Le backend (Java/Spring Boot) est le "Cerveau". Il détient 100% de la logique métier, des règles d'équilibrage, des calculs et des textes. Le frontend (JS/HTML/CSS) est "Stupide". Il se contente d'afficher les données formatées qu'il reçoit et de capter les clics.
2. **Séparation des Préoccupations (UI vs Data) :** Le Backend ne sait pas ce qu'est une couleur, le Frontend ne sait pas ce qu'est une formule mathématique.
3. **Modularité Front-End :** Bien que codé en Vanilla JS/CSS, le front doit agir comme un framework moderne (composants isolés, responsabilités uniques, pas de code spaghetti).

---

## 2. Règles Back-End (Le Cerveau)

*   **Règle B1 - Interdiction du CSS/HTML en Base de Données :** 
    Le backend stocke de la donnée sémantique, jamais de présentation. Ne stockez jamais de balises `<strong style="...">` ou de codes hexadécimaux (`#ff0000`). Utilisez du texte brut ou des classes CSS sémantiques (ex: `<span class="stat-mana">`).
*   **Règle B2 - Les "Rich Enums" pour les Métadonnées :** 
    Les types stricts (Comportements, Raretés, Catégories, Slots, Sources) ne sont pas de simples chaînes. L'`enum` Java doit centraliser ses propres métadonnées (label, description, icône, couleur CSS sémantique) via des propriétés privées, et être sérialisée en objet JSON complet pour le front via un `@JsonFormat(shape = Shape.OBJECT)` ou un serializer custom.
    **Exemple** : `EquipmentSlot.CASQUE` doit exposer `{ "name": "CASQUE", "label": "Casque", "icon": "masks" }` et non simplement `"CASQUE"`.
    **Liste des enums à enrichir** : `EquipmentRarity`, `EquipmentSlot`, `MonsterBehavior`, `MonsterType`, `Source`, `ConsumableCategory`.
*   **Règle B3 - Les DTOs "Actifs" :** 
    Ne jamais exposer les entités JPA directement. Le backend doit calculer toutes les données dérivées (ex: le poids total d'un item, les dégâts finaux d'un sort) et les intégrer en tant que champs natifs dans les DTOs envoyés au front.
*   **Règle B4 - Endpoints de Simulation :** 
    Si une interface nécessite de prévisualiser le résultat d'un calcul complexe avant sauvegarde (ex: modification de stats), le backend doit fournir une route `POST /api/.../simulate` plutôt que de laisser le front deviner la formule.
*   **Règle B5 - Conventions REST et Nommage API :**
    - Les ressources doivent être nommées au pluriel (ex: `/api/equipments`, `/api/characters`).
    - Les actions globales réservées aux modérateurs/admins doivent être explicites et idéalement préfixées par `/api/admin/` (ex: `/api/admin/equipments` plutôt que `/api/equipment/all`).
    - Utiliser systématiquement les verbes HTTP appropriés (`GET` pour la lecture, `POST` pour la création ou simulation, `PUT/PATCH` pour l'édition, `DELETE` pour la suppression).

---

## 3. Règles Front-End (L'Affichage)

*   **Règle F1 - Zéro Logique Métier en JS :** 
    Il est formellement interdit de coder en dur des multiplicateurs, des constantes d'équilibrage (`WEIGHT_LIMITS`), des dictionnaires de traduction (`behaviorTitles`) ou des règles de jeu dans les scripts JavaScript. Si une donnée manque, faites un appel API ou modifiez le DTO.
*   **Règle F2 - Zéro CSS inline dans le JS :** 
    Ne jamais injecter de logique de style via JavaScript, que ce soit par manipulation DOM (`element.style.display = 'none'`) ou par template literal (`` `<div style="...">` ``). Le JS sert uniquement à basculer des classes d'état CSS existantes (`.is-hidden`, `.is-active`).
    **Exception** : les animations procédurales (ex: positionnement de particules via `transform`, `left`, `top`) où les valeurs sont calculées en runtime sont exemptées de cette règle.
*   **Règle F3 - Arborescence CSS stricte :** 
    *   `/styles/variables.css` : Variables CSS custom, tokens de couleur, typographie.
    *   `/styles/ui/` : Composants réutilisables partagés (boutons, tooltips, modales, notifications, formulaires).
    *   `/styles/pages/` : Layouts uniques à une page (ex: `vault.css`, `armory.css`).
    *   `/styles/sprites/` : Fichiers isolés contenant uniquement les lourdes animations (ex: `@keyframes`, spritesheets pixel art).

---

## 4. Règles de Sécurité

*   **Règle S1 - Protection des routes API :**
    Les endpoints admin (`/api/**/admin/**`, création/suppression/modification d'entités de jeu) doivent être protégés par `@PreAuthorize("hasRole('ADMIN')")` ou via `SecurityFilterChain`. Le RBAC frontend (masquage de boutons) est cosmétique et ne constitue **pas** une sécurité.
*   **Règle S2 - CSRF :**
    Si CSRF est désactivé (API stateless consommée par du JS same-origin), documenter explicitement pourquoi. À terme, envisager un header custom (`X-Requested-With`) vérifié côté serveur pour protéger contre les requêtes cross-origin.
*   **Règle S3 - Ne jamais exposer de stacktraces au client :**
    Les erreurs API doivent retourner un JSON structuré `{ "error": "message user-friendly" }`, jamais de `err.stack` ou d'exception Java. Utiliser un `@ControllerAdvice` global.

---

## 5. Règles Front-End Avancées (Patterns)

*   **Règle F4 - Couche API centralisée :**
    Tous les appels `fetch()` doivent passer par un wrapper centralisé dans `api.js` (ou un fichier dédié par domaine : `api/equipment.js`, `api/combat.js`). Ce wrapper gère : les headers communs, la vérification `res.ok`, la redirection sur 401, et le parsing JSON. Aucun `fetch()` direct dans les fichiers de page.
*   **Règle F5 - Gestion d'erreurs unifiée :**
    Interdit d'utiliser `alert()` pour les erreurs. Utiliser systématiquement le système de notification existant (`showNotif(message, isError)`). Ne jamais afficher de stack trace ou de détail technique à l'utilisateur.
*   **Règle F6 - State par page :**
    Chaque page encapsule son état dans un objet dédié (`const pageState = { ... }`), jamais en variables globales `let` éparpillées. Le state partagé inter-pages reste dans `state.js`.
*   **Règle F7 - Zéro HTML dans le JS (template strings) :**
    Privilégier des fonctions de création de composants (`createCard(data)`, `createStatBadge(stat)`) qui utilisent `document.createElement()` et des classes CSS, plutôt que des template literals injectés via `innerHTML`. Si `innerHTML` est utilisé pour des raisons de performance, le HTML ne doit contenir **aucun attribut `style`** — uniquement des classes CSS.

---

## 🛠️ THE MASTER SYSTEM PROMPT 
*(À fournir à l'agent IA via `@GRIMOIRE_ARCHITECTURE.md` dans l'IDE pour toute tâche de développement)*

> **[DIRECTIVES ARCHITECTURALES - PROJET GRIMOIRE]**
> Tu es un Architecte Logiciel Senior travaillant sur un RPG (Spring Boot + Vanilla JS). Avant de générer du code, applique ces invariants :
> 1. **SSOT (Backend Brain) :** Le backend Java détient 100% des formules (mathématiques, dégâts, poids) et des dictionnaires (descriptions, labels). Purge toute logique métier codée en dur dans le frontend JS (supprime les switch/cases, les maps de métadonnées, les constantes de stats).
> 2. **Data vs UI :** Le backend ne doit renvoyer aucun code CSS ou style inline (pas de `style="..."`). Utilise des classes CSS sémantiques. 
> 3. **DTOs & Rich Enums :** Le front consomme des DTOs pré-calculés. Si le front a besoin de traduire une valeur, enrichis l'Enum Java avec des propriétés (`label`, `description`, `icon`) et expose-la en JSON.
> 4. **Front-End Modulaire :** Le CSS utilitaire (tooltips, boutons) va dans des fichiers dédiés (`styles/ui/`). Isole les animations lourdes (Spritesheets) dans `styles/sprites/`. Le JS ne modifie pas le DOM avec du style en ligne, il ne fait qu'ajouter ou retirer des classes CSS (ex: `.is-hidden`).
> 5. **Sécurité :** Les routes admin sont protégées par `@PreAuthorize`. Le RBAC front n'est que cosmétique. Les erreurs API retournent du JSON structuré, jamais de stacktrace.
> 6. **Fetch centralisé :** Tous les appels API passent par un wrapper dans `api.js`. Zéro `fetch()` direct dans les pages. Gestion unifiée des erreurs via `showNotif()`, jamais `alert()`.
> 7. **Zéro HTML inline :** Les templates JS n'injectent jamais d'attribut `style="..."`. Utiliser des classes CSS et des fonctions de création de composants.
> 
> Concentre-toi sur la propreté, la scalabilité et l'élimination stricte de la duplication de code entre le back et le front.