# État de la Migration vers React — Grimoire

> Dernière mise à jour : 11/11/2026  
> Stack cible : **React 19 · TypeScript · Vite 6 · React Router 7** (intégré à **Spring Boot 3.4.4**)

---

## 1. Architecture de la SPA React (Migration 100% Complétée)

Les **16 pages** de Grimoire sont désormais migrées dans la SPA React sans interruption de service ni duplication du backend :

- **Code source React** : centralisé dans `frontend/` (`React 19` + `TypeScript` + `react-router-dom`).
- **Build de production Spring Boot (`:8080`)** :
  - `npm --prefix frontend run build` compile l'application React dans `src/main/resources/static/app/` (`base: '/app/'`).
  - Les feuilles de style, assets et modules métier (`src/main/resources/static/styles/`, `js/`, `images/`, `sons/`) sont servis par Spring Boot.
  - `SpaForwardController.java` et `SecurityConfig.java` routent toutes les URLs SPA (`/grimoire`, `/armory`, `/dungeons`, `/vault`, `/shop`, `/alchemy`, `/hunting`, `/shop-admin`, `/pve-admin`, `/alchemy-admin`, `/secrets`, `/dungeon-stats`, `/achievements`, `/combat`, `/login`, `/register`) vers `forward:/app/index.html` en neutralisant les en-têtes conditionnels (`If-None-Match` / `If-Modified-Since`) et en forçant `Cache-Control: no-store` pour éviter tout `HTTP 304` vide au rechargement navigateur.
  - Les anciens fichiers `*.html` (`login.html`, `register.html`, `index.html`, `armory.html`, `dungeons.html`, `combat.html`, etc.) redirigent automatiquement vers leurs nouvelles URLs propres sans `.html`.
- **Serveur de développement HMR (`:5173`)** :
  - `vite.config.ts` proxifie `/api`, `/styles`, `/js`, `/images`, `/sons` vers `http://localhost:8080`.
- **Navigation SPA unifiée** :
  - Toutes les transitions entre les 16 pages s'effectuent en **SPA instantanée** sans rechargement complet (via `<Link>`, `useNavigate` ou `SpaLinkInterceptor` dans `App.tsx` qui intercepte également les clics internes de `<app-navbar>`).

---

## 2. Avancement Global (16 / 16 pages migrées — 100%)

| Page | Ancienne URL | Nouvelle URL | Statut | Composant React | Notes techniques |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Connexion** | `/login.html` | `/login` | ✅ Migrée | `src/pages/LoginPage.tsx` | Typage strict DTO, détection session de combat active, zéro style inline. |
| **Inscription** | `/register.html` | `/register` | ✅ Migrée | `src/pages/RegisterPage.tsx` | Validation mots de passe, auto-login, thème émeraude `.auth-page-register`. |
| **Grimoire & Forge** | `/` (`index.html`) | `/grimoire` | ✅ Migrée | `src/pages/GrimoirePage.tsx` | Redirection `/` → `/grimoire`, sous-composants modulaires (`SpellForgePanel`, `SpellFilterBar`, `SpellCard`), animations Lvl 1–5 & Voie/Spiritualité. |
| **Armurerie** | `/armory.html` | `/armory` | ✅ Migrée | `src/pages/ArmoryPage.tsx` | Gestion des personnages, équipement, toile des spécificités (`hero-spider.js`), tutoriel guidé. |
| **Donjons** | `/dungeons.html` | `/dungeons` | ✅ Migrée | `src/pages/DungeonsPage.tsx` | Sélection d'équipe, cartes de donjons, sacoche, lobbys multijoueur SSE, tutoriel donjon. |
| **Coffres (Vault)** | `/vault.html` | `/vault` | ✅ Migrée | `src/pages/VaultPage.tsx` | Inventaire de compte, filtres d'équipements/consommables/anomalies, création/édition admin, destruction. |
| **Boutique** | `/shop.html` | `/shop` | ✅ Migrée | `src/pages/ShopPage.tsx` | Marchand quotidien, promos avec compte à rebours, marché noir, amélioration de boutique, tutoriel. |
| **Alchimie** | `/alchemy.html` | `/alchemy` | ✅ Migrée | `src/pages/AlchemyPage.tsx` | Grimoire de recettes, filtres par récompense/nouveauté, chaudron de transmutation, particules. |
| **Tableau de Chasse** | `/hunting.html` | `/hunting` | ✅ Migrée | `src/pages/HuntingPage.tsx` | Quêtes journalières/hebdomadaires, classements, timers dynamiques, réclamation de paliers. |
| **Admin Boutique** | `/shop-admin.html` | `/shop-admin` | ✅ Migrée | `src/pages/ShopAdminPage.tsx` | CRUD modèles d'équipements/consommables de boutique, coûts en anomalies, paliers d'amélioration. |
| **Admin PvE** | `/pve-admin.html` | `/pve-admin` | ✅ Migrée | `src/pages/PveAdminPage.tsx` | CRUD monstres, mutations, donjons, salles, butin exclusif et secrets requis. |
| **Admin Alchimie** | `/alchemy-admin.html` | `/alchemy-admin` | ✅ Migrée | `src/pages/AlchemyAdminPage.tsx` | CRUD recettes et ingrédients d'alchimie (anomalies, consommables, équipements, secrets, XP Spirit). |
| **Mes Secrets** | `/secrets.html` | `/secrets` | ✅ Migrée | `src/pages/SecretsPage.tsx` | Composant 100% React TypeScript, thèmes CSS sémantiques, réclamation récompenses avec animation d'or flottant. |
| **Statistiques PvE** | `/dungeon-stats.html` | `/dungeon-stats` | ✅ Migrée | `src/pages/DungeonStatsPage.tsx` | KPIs, graphiques Chart.js (issues, voies, spiritualités), filtre par donjon/secret, historique des runs, reset tutoriels. |
| **Succès** | `/achievements.html` | `/achievements` | ✅ Migrée | `src/pages/AchievementsPage.tsx` | Progression globale, équipement de titre actif, filtres par catégorie, cartes de succès et mystères. |
| **Combat PvE** | `/combat.html` | `/combat` | ✅ Migrée | `src/pages/CombatPage.tsx` | Moteur de combat tour par tour, multijoueur SSE, signaux/émotes, événements de salle, zéro style inline. |

---

## 3. Composants Partagés & Services (100% Complétés)

| Élément | Statut actuel | Architecture & Fichiers |
| :--- | :---: | :--- |
| **Client API & Auth (`frontend/src/services/api.ts`)** | ✅ Complété | Client TypeScript complet (`apiFetch`, `apiGet`, `apiPost`, `apiPut`, `apiDelete`, `loginApi`, `registerApi`, `logoutApi`, `fetchCurrentUser`, `isAdmin`) synchronisé avec `auth.js` et `api.js`. |
| **Barre de navigation (`Navbar.tsx`, `AppLayout.tsx`, `navbar.js`)** | ✅ Complété | Composants React partagés `src/components/Navbar.tsx` et `src/components/AppLayout.tsx` + mise à jour dynamique en place (`attributeChangedCallback` sur `active-page`) sans démontage de `#authNavContainer` ni attribut `style=` inline. |
| **Modales & Toasts (`UiFeedbackContext.tsx`, `modal.js`, `ui.js`)** | ✅ Complété | Contextes React `ModalProvider`, `ToastProvider` et `UiFeedbackProvider` (`src/context/UiFeedbackContext.tsx`, hooks `useModal` / `useToast`) connectés à `<app-modal>` et `#notif`. |
| **Moteur de Sorts & Forge (`src/components/grimoire/`)** | ✅ Complété | `GrimoirePage.tsx` découpé en sous-composants React modulaires (`src/components/grimoire/SpellForgePanel.tsx`, `SpellFilterBar.tsx`, `SpellCard.tsx` + `SpellEditingPreview`) pilotant `grimoire.js` et `forge.js` (< 500 lignes par fichier). |

---

## 4. Retour d'Expérience & Correctifs Appliqués

Au fil de la migration complète des 16 pages, les points critiques suivants ont été résolus et constituent le standard du projet :

1. **Conteneur `#root` en plein écran** :
   - `body` étant en `display: flex; flex-direction: column`, `#root` doit avoir `width: 100%; min-height: 100vh;` (`login.css`) pour éviter que les pages centrées ne se réduisent à la largeur de leur carte centrale.
2. **Prévention des réponses `304 Not Modified` vides au F5 (`SpaForwardController.java`)** :
   - Lors d'un `forward:/app/index.html`, `ResourceHttpRequestHandler` de Spring Boot comparait l'ETag de `/app/index.html` avec l'en-tête `If-None-Match` du navigateur et renvoyait parfois un `304` sans corps sur les routes SPA. `SpaForwardController` enveloppe la requête via `HttpServletRequestWrapper` pour ignorer `If-None-Match` / `If-Modified-Since` et définit `Cache-Control: no-cache, no-store, must-revalidate`.
3. **Visibilité initiale et spécificité CSS (Zéro `style=` inline)** :
   - `.is-hidden.is-hidden` (`display: none !important;`) est réservé aux éléments dont la visibilité est basculée par classe CSS (`classList.add/remove('is-hidden')`).
   - `.init-hidden` (`display: none;` sans `!important`) permet de masquer initialement un élément en JSX tout en laissant les scripts JS legacy (`el.style.display = 'block'` + `classList.remove('init-hidden')`) l'afficher dynamiquement (ex: `#prepInterface` et `#dungeonsTabs` dans `/dungeons`).
4. **Collision `window.isAdmin`** :
   - `auth.js` stocke un booléen dans `window.isAdmin`, tandis que `api.js` exporte une fonction `isAdmin(user)`. Ne jamais faire `Object.assign(window, api)` sans exclure `isAdmin`, sinon `window.isAdmin` devient une fonction (*truthy*) et active l'interface administrateur chez les joueurs normaux.
5. **Ordre d'initialisation des métadonnées (`initMeta`)** :
   - Toujours exécuter `await constants.initMeta()` (`/api/meta/all`) **avant** de construire les listes déroulantes ou les cartes de sorts afin que `GLOBAL_SRC_LABELS` (`CASTER_HEALTH_MAX` → `PV Max Lanc.`) et `GLOBAL_STAT_LABELS` soient remplis.
6. **Suivi des validations Co-op `(1/2)` en Combat (`/combat`)** :
   - En mode multijoueur, toutes les actions nécessitant la validation des deux joueurs (continuer après victoire, ouvrir/passer un coffre, choisir une option de rencontre/piège/altération/porte étrange, passer la salle du marchand) affichent l'indicateur `(readyCount/totalCount)` en temps réel via SSE (`playerReadyNextRoom` et `playerRoomChoices`), avec mise en évidence du bouton choisi (`.is-choice-selected`) et bannière d'état de l'allié.
7. **Classes d'affinité sémantiques des cartes de sorts (`filters.js` & `spell-cards.css`)** :
   - Les couleurs de voies, spiritualités et mutations sont portées par les classes `.affinity-*`, `.origin-filter-btn` et `.lvl-badge-*` (`getVoieAffinityClass`, `getSpiritAffinityClass`, `getSpellAffinityClass` exportées par `js/utils/filters.js`), éliminant les attributs `style=` inline dans le rendu du Grimoire et des infobulles de combat.
8. **Préservation des animations par palier (Lvl 1–5) et par Voie Lvl 5 / Spiritualité Lvl 3 (`spell-cards.css`, `spell-cards-animations.css`, `particles.js`)** :
   - Les cartes de sorts du Grimoire combinent `.spell-card-lvl-${tierNumber}` (progression visuelle et reflets de niveau 1 à 5 alimentés par `--spell-color` et `--spell-rgb` issus de `.affinity-*`) et `attachLvl5CardEffects(card, origin)` (`particles.js` + `spell-cards-animations.css`) pour déclencher les animations élémentaires d'entrée/sortie au survol de chaque Voie Niveau 5 (`wind`, `water`, `poison`, `earth`, `lava`, `plant`, `fire`, `explosion`) et de chaque Spiritualité Niveau 3 (`spirit`, `darkness`, `karma` selon l'alignement Harmonie/Lumière/Ténèbres).

---

## 5. Commandes de Build & Synchronisation

Après toute modification dans `frontend/` ou dans `src/main/resources/static/` :

```powershell
npm --prefix frontend run build
.\mvnw.cmd resources:resources
```
