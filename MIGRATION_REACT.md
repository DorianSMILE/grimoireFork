# État de la Migration vers React — Grimoire

> Dernière mise à jour : 10/11/2026  
> Stack cible : **React 19 · TypeScript · Vite 6 · React Router 7** (intégré à **Spring Boot 3.4.4**)

---

## 1. Architecture de Migration (Pattern *Strangler Fig*)

La migration s'effectue **page par page** sans interruption de service ni duplication du backend :

- **Code source React** : isolé dans le dossier `frontend/` (`React 19` + `TypeScript` + `react-router-dom`).
- **Build de production Spring Boot (`:8080`)** :
  - `npm --prefix frontend run build` compile l'application React dans `src/main/resources/static/app/` (`base: '/app/'`).
  - Les ressources Vanilla existantes (`src/main/resources/static/styles/`, `js/`, `images/`, `sons/`, `*.html`) restent intactes.
  - `WebMvcConfig.java` et `SecurityConfig.java` pré-enregistrent toutes les routes SPA cibles (`/grimoire`, `/armory`, `/dungeons`, `/login`, `/register`, etc.) vers `forward:/app/index.html`.
  - Les anciens fichiers HTML (`login.html`, `register.html`, `index.html`, `armory.html`, `dungeons.html`) sont conservés sous forme de micro-redirections vers les nouvelles URLs propres (`/login`, `/register`, `/grimoire`, `/armory`, `/dungeons`) pour garantir zéro lien cassé depuis les pages non migrées.
- **Serveur de développement HMR (`:5173`)** :
  - `vite.config.ts` proxifie automatiquement `/api`, `/styles`, `/js`, `/images`, `/sons` ainsi que toutes les pages `*.html` non encore migrées vers `http://localhost:8080`.
- **Navigation hybride transparente** :
  - Entre deux pages migrées en React : navigation **SPA instantanée** sans rechargement (via `<Link>` ou `SpaLinkInterceptor` dans `App.tsx` qui intercepte aussi les clics dans `<app-navbar>`).
  - Entre une page React et une page Vanilla : navigation classique partageant le même `localStorage` (`accessToken`, `isLikelyLoggedIn`, `activeCombatId`) et le cookie `refresh_token`.

---

## 2. Avancement Global (9 / 15 pages migrées)

| Page | Ancienne URL | Nouvelle URL | Statut | Composant React | Notes techniques |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Connexion** | `/login.html` | `/login` | ✅ Migrée | `src/pages/LoginPage.tsx` | Typage strict DTO, détection session de combat active, zéro style inline. |
| **Inscription** | `/register.html` | `/register` | ✅ Migrée | `src/pages/RegisterPage.tsx` | Validation mots de passe, auto-login, thème émeraude `.auth-page-register`. |
| **Grimoire & Forge** | `/` (`index.html`) | `/grimoire` | ✅ Migrée | `src/pages/GrimoirePage.tsx` | Redirection `/` → `/grimoire`, filtres multi-critères, animations Lvl-5, Forge admin. |
| **Armurerie** | `/armory.html` | `/armory` | ✅ Migrée | `src/pages/ArmoryPage.tsx` | Gestion des personnages, équipement, toile des spécificités (`hero-spider.js`), tutoriel guidé. |
| **Donjons** | `/dungeons.html` | `/dungeons` | ✅ Migrée | `src/pages/DungeonsPage.tsx` | Sélection d'équipe, cartes de donjons, sacoche, lobbys multijoueur SSE, tutoriel donjon. |
| **Coffres (Vault)** | `/vault.html` | `/vault` | ✅ Migrée | `src/pages/VaultPage.tsx` | Inventaire de compte, filtres d'équipements/consommables/anomalies, création/édition admin, destruction. |
| **Boutique** | `/shop.html` | `/shop` | ✅ Migrée | `src/pages/ShopPage.tsx` | Marchand quotidien, promos avec compte à rebours, marché noir, amélioration de boutique, tutoriel. |
| **Alchimie** | `/alchemy.html` | `/alchemy` | ✅ Migrée | `src/pages/AlchemyPage.tsx` | Grimoire de recettes, filtres par récompense/nouveauté, chaudron de transmutation, particules. |
| **Tableau de Chasse** | `/hunting.html` | `/hunting` | ✅ Migrée | `src/pages/HuntingPage.tsx` | Quêtes journalières/hebdomadaires, classements, timers dynamiques, réclamation de paliers. |
| **Mes Secrets** | `/secrets.html` | `/secrets` | ⏳ À migrer | — | Page simple (lecture secrets + réclamation récompenses). |
| **Succès** | `/achievements.html` | `/achievements` | ⏳ À migrer | — | Page simple (filtres par catégorie, barres de progression, titres). |
| **Statistiques PvE** | `/dungeon-stats.html` | `/dungeon-stats` | ⏳ À migrer | — | Tableaux et statistiques de performance en donjon. |
| **Combat PvE** | `/combat.html` | `/combat` | ⏳ À migrer | — | Moteur de combat tour par tour, canvas/animations, signaux. |
| **Admin Boutique** | `/shop-admin.html` | `/shop-admin` | ⏳ À migrer | — | CRUD modèles d'équipements et anomalies. |
| **Admin Alchimie** | `/alchemy-admin.html` | `/alchemy-admin` | ⏳ À migrer | — | CRUD recettes et ingrédients d'alchimie. |
| **Admin PvE** | `/pve-admin.html` | `/pve-admin` | ⏳ À migrer | — | CRUD monstres, mutations, donjons et simulations. |

---

## 3. Composants Partagés & Services

| Élément | Statut actuel | Cible fin de migration |
| :--- | :--- | :--- |
| **Client API & Auth (`frontend/src/services/api.ts`)** | ✅ Créé en TypeScript (`apiFetch`, `loginApi`, `registerApi`, `fetchCurrentUser`) | Enrichir au fil des pages migrées et supprimer `static/js/services/auth.js` + `api.js` une fois la dernière page migrée. |
| **Barre de navigation (`navbar.js`)** | 🔄 Web Component `<app-navbar>` encapsulé + intercepté par `SpaLinkInterceptor` | Convertir en composant React `<Navbar />` partagé dans un `<AppLayout />` pour conserver l'en-tête monté sans re-rendu entre les pages. |
| **Modales & Toasts (`modal.js`, `ui.js`)** | 🔄 Web Component `<app-modal>` + fonctions globales | Convertir en contexte/composant React (`ModalProvider` / `ToastProvider`). |
| **Moteur de Sorts & Forge (`grimoire.js`, `forge.js`)** | 🔄 Pont ES Module (`initGrimoirePage` dans `app.js`) piloté par `GrimoirePage.tsx` | Découper progressivement en sous-composants React (`<SpellCard />`, `<SpellFilterBar />`, `<SpellForgePanel />`). |

---

## 4. Retour d'Expérience & Correctifs Appliqués

Lors de la migration des 3 premières pages (`/login`, `/register`, `/grimoire`), les points suivants ont été résolus et servent de standard pour la suite :

1. **Conteneur `#root` en plein écran** :
   - `body` étant en `display: flex; flex-direction: column`, `#root` doit avoir `width: 100%; min-height: 100vh;` (`login.css`) pour éviter que les pages centrées ne se réduisent à la largeur de leur carte centrale.
2. **Visibilité initiale et spécificité CSS (Zéro `style=` inline)** :
   - Pour masquer un panneau par défaut sans attribut `style="display:none"`, utiliser `.is-hidden` (`display: none !important;`) ou `.init-hidden.init-hidden` (`layout.css`, spécificité `(0,2,0)`) afin de surpasser `.panel { display: flex }` ou `.form-row { display: grid }`.
3. **Collision `window.isAdmin`** :
   - `auth.js` stocke un booléen dans `window.isAdmin`, tandis que `api.js` exporte une fonction `isAdmin(user)`. Ne jamais faire `Object.assign(window, api)` sans exclure `isAdmin`, sinon `window.isAdmin` devient une fonction (*truthy*) et active l'interface administrateur chez les joueurs normaux.
4. **Ordre d'initialisation des métadonnées (`initMeta`)** :
   - Toujours exécuter `await constants.initMeta()` (`/api/meta/all`) **avant** de construire les listes déroulantes ou les cartes de sorts afin que `GLOBAL_SRC_LABELS` (`CASTER_HEALTH_MAX` → `PV Max Lanc.`) et `GLOBAL_STAT_LABELS` soient remplis.

---

## 5. Procédure Standard pour Migrer la Prochaine Page

Pour chaque nouvelle page `/nom-page` (ex: `/secrets` ou `/achievements`) :

1. **Composant React** : Créer `frontend/src/pages/NomPage.tsx` sans attribut `style=` inline.
2. **Routeur React (`frontend/src/App.tsx`)** :
   - Ajouter `<Route path="/nom-page" element={<NomPage />} />` et `<Route path="/nom-page.html" element={<Navigate to="/nom-page" replace />} />`.
   - Ajouter `'/nom-page'` et `'/nom-page.html'` dans `SPA_ROUTES`.
3. **Proxy Vite (`frontend/vite.config.ts`)** :
   - Ajouter `nom-page\\.html` dans l'exclusion de la regex proxy HTML.
4. **Spring Boot (`WebMvcConfig.java` & `SecurityConfig.java`)** :
   - Ajouter `registry.addViewController("/nom-page").setViewName("forward:/app/index.html");`.
   - Autoriser `"/nom-page"` dans `SecurityConfig.java` (et `CombatInterceptor.java` si nécessaire).
5. **Redirection legacy** :
   - Remplacer `src/main/resources/static/nom-page.html` par la redirection vers `/nom-page` et mettre à jour le lien dans `navbar.js`.
6. **Build & Vérification** :
   - Exécuter `npm --prefix frontend run build` puis `.\mvnw.cmd resources:resources`.
