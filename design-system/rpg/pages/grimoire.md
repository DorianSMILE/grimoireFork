# Grimoire Page Design System Override

> **PROJECT:** Grimoire (`rpg`)
> **PAGE:** `/grimoire` (`GrimoirePage.tsx`, `grimoire.js`, `forge.js`, `spell-cards.css`, `effects-panel.css`, `layout.css`)
> **GENERATED:** 2026-11-10
> **PAGE TYPE:** RPG Spellbook Catalog (Codex) & Admin Spell Forge CRUD Workspace
> **DENSITY:** `8 / 10` (High-density tactical codex & multi-effect rule builder)

> [!IMPORTANT]
> **Override Rule:** This file extends [`design-system/rpg/MASTER.md`](../MASTER.md). Any rule defined here supersedes `MASTER.md` exclusively for the `/grimoire` route. All `GEMINI.md` constraints remain strictly enforced (**zero inline `style=` or `.style.*` manipulation**, **zero business formulas/translations in JS**).

---

## 1. Page-Specific Design Direction & Modes

The `/grimoire` view serves two distinct personas that must **never visually collide**:
1. **Player Codex Mode (Default / `.single-col`):** Pure discovery and theorycrafting catalog. Full-width multi-column responsive spell card grid with sticky multi-criteria filter deck. Zero admin chrome.
2. **Admin Forge Mode (2-Column / 3-Column Workspace):** Data-dense CRUD authoring environment splitting **Spell Metadata (`#spellForgePanel`)**, **Effect Stack Builder (`#effectsPanel` / `#effectsList`)**, and **Live Spell Catalog (`#grimoireCatalogPanel`)**.

---

## 2. Layout & Spatial Architecture Overrides

### 2.1 Mode Switching (`main.grimoire-main`)

| Mode | Container Class | Grid Template (`>= 1280px`) | Max Width | Gap | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Player Codex** | `.grimoire-main.single-col` | `1fr` (Catalog Panel only; `#spellForgePanel.is-hidden`) | `1600px` | `var(--space-lg)` (`24px`) | Uncluttered spell browsing; cards flow in a 2-to-3 column responsive grid |
| **Admin Split (2-Col)** | `.grimoire-main.forge-2col` | `minmax(440px, 1fr) minmax(520px, 1.25fr)` | `1720px` | `var(--space-lg)` (`24px`) | Left: `#spellForgePanel` (sticky scroll) · Right: `#grimoireCatalogPanel` |
| **Admin Studio (3-Col)** | `.grimoire-main.forge-3col` | `minmax(360px, 0.9fr) minmax(420px, 1.1fr) minmax(440px, 1fr)` | `1920px` (`98vw`) | `var(--space-md)` (`16px`) | Col 1: `#spellForgePanel` (Identity, Costs, Affinities) · Col 2: `#effectsPanel` (`#effectsList` Effect Builder) · Col 3: `#grimoireCatalogPanel` (Catalog & Live Preview) |

### 2.2 Spell Catalog Grid (`.spells-list` / `#createdSpellsContainer`)
- **Current Flaw:** `.spells-list` uses `display: flex; flex-direction: column; gap: 1.5rem;`, stretching single spell cards across 1500px+ in `.single-col` Player mode and wasting horizontal viewport real estate.
- **Override Specification:**
  - **Player Codex (`.single-col .spells-list`):** `display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.25rem; align-items: start;`
  - **Compact / Scroll Mode (`.spells-list.compact-mode`):** `max-height: 75vh; overflow-y: auto; padding-right: 0.5rem;`
  - **Admin Split Mode (`.grimoire-main:not(.single-col) .spells-list`):** `display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem;`

---

## 3. Multi-Criteria Filter Deck (`#grimoireFiltersContainer`)

### 3.1 Stacking Context & Surface
- **Fix Stacking Abuse:** Remove `z-[9999999]` from `#grimoireFiltersContainer` (currently breaking modal/tooltip layering). Use semantic token `--z-sticky: 20` (`z-20`) so global tooltips (`--z-tooltip: 80`) and modals (`--z-modal: 60`) render cleanly above it.
- **Surface:** `background: rgba(15, 23, 42, 0.65); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1rem 1.25rem;`

### 3.2 Two-Tier Filter Hierarchy
Organize filters by cognitive priority:
1. **Tier 1 — Affinity Pill Selectors (Primary Identity):**
   - **Voie (`#filterVoiesButtonsContainer`)** and **Spiritualité (`#filterSpiritsButtonsContainer`)** side-by-side in a 2-column grid (`grid-template-columns: 1fr 1fr; gap: 1rem`).
   - **Affinity Pill Anatomy:** `.affinity-filter-chip` with `--affinity-color` and `--affinity-rgb` CSS custom properties set once on creation (or mapped via semantic classes `.affinity-destruction`, `.affinity-consolidation`, etc.), using `.is-active` for selection glow instead of JS inline `.style.*` mutations.
   - **Admin Mutation Filter (`#filterMutationAdminContainer`):** Hidden for players via `.is-hidden`; revealed for Admins as a compact 3rd pill group or inline select badge.
2. **Tier 2 — Tactical Utility Bar (4-Column Strip):**
   - `grid-template-columns: 1.4fr 1.2fr 1fr 1.2fr` on desktop (`>= 1024px`), collapsing to `1fr 1fr` on tablet and `1fr` on mobile.
   - Controls:
     1. **Search (`#filterSearch`):** Instant text filter with `search` icon prefix and clear button.
     2. **Effect Nature (`#filterEffect`):** Categorized `<select>` (Damage, Heal, Mana, Control/Mitigation, Ailments).
     3. **Rank Tier (`#filterLevel`):** `ALL` or Ranks `1`–`5`.
     4. **Sort (`#sortBy`) + Action-Type Cycling Button (`#spellTypeFilterBtn`):** Paired in a flex row.

### 3.3 Action-Type Cycling Button (`#spellTypeFilterBtn`)
- **Current Flaw:** `window.toggleSpellTypeFilter` in `grimoire.js` overwrites `btn.innerHTML` with inline `style="..."` and mutates `btn.style.backgroundColor`, `btn.style.borderColor`, `btn.style.color`, `btn.style.boxShadow`, and `btn.style.transform`.
- **Override Specification:**
  - Keep a static DOM structure inside `#spellTypeFilterBtn` and toggle semantic state classes:
    - `.spell-type-filter-btn[data-state="ALL"]` (Composite 3-icon triad: `bolt`, `hourglass_empty`, `cyclone`)
    - `.spell-type-filter-btn.is-instant` (`border-color: rgba(251, 191, 36, 0.45); background: rgba(251, 191, 36, 0.15); color: #fbbf24; box-shadow: 0 0 10px rgba(251, 191, 36, 0.25);`)
    - `.spell-type-filter-btn.is-banal` (`border-color: rgba(96, 165, 250, 0.45); background: rgba(96, 165, 250, 0.15); color: #60a5fa; box-shadow: 0 0 10px rgba(96, 165, 250, 0.25);`)
    - `.spell-type-filter-btn.is-canalise` (`border-color: rgba(192, 132, 252, 0.45); background: rgba(192, 132, 252, 0.15); color: #c084fc; box-shadow: 0 0 10px rgba(192, 132, 252, 0.25);`)
    - `.spell-type-filter-btn.is-pulsing` (`transform: scale(0.92)` transition for 150ms).

---

## 4. Spell Card Hierarchy & Tier Clarity (`.spell-card`)

### 4.1 5-Tier Visual Progression (Ranks 1–5)
Currently, Ranks 1, 2, and 3 share the exact same card container appearance (`.spell-card`), making progression invisible until Rank 4. Enforce a clear 5-step visual ladder driven by CSS classes `.spell-card-lvl-1` through `.spell-card-lvl-5`:

| Tier Class | Rank Role | Border Alpha | Surface Tint | Rank Badge Class | Special Visual Treatment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`.spell-card-lvl-1`** | Novice (Rank I) | `rgba(255, 255, 255, 0.10)` | `rgba(15, 23, 42, 0.45)` | `.lvl-badge-1` (Muted slate pill) | Clean matte glass, zero outer glow |
| **`.spell-card-lvl-2`** | Adept (Rank II) | `rgba(255, 255, 255, 0.20)` | `rgba(15, 23, 42, 0.55)` | `.lvl-badge-2` (Bright silver border) | Subtle top highlight `inset 0 1px 0 rgba(255,255,255,0.12)` |
| **`.spell-card-lvl-3`** | Master (Rank III / Max Spirit) | `rgba(var(--spell-rgb), 0.45)` | `linear-gradient(160deg, rgba(var(--spell-rgb), 0.10), rgba(15, 23, 42, 0.65))` | `.lvl-badge-3` (Affinity-colored border & text) | Affinity-tinted left accent bar (`border-left: 3px solid var(--spell-color)`) |
| **`.spell-card-lvl-4`** | Grandmaster (Rank IV) | `rgba(var(--spell-rgb), 0.70)` | `linear-gradient(145deg, rgba(var(--spell-rgb), 0.18), rgba(15, 23, 42, 0.75))` | `.lvl-badge-4` (`auto_awesome` icon + affinity glow) | Outer aura `0 8px 24px -6px rgba(var(--spell-rgb), 0.30)` |
| **`.spell-card-lvl-5`** | **Prestige / Capstone (Rank V)** | `var(--spell-color)` (`1.5px` + `@keyframes lvl5-pulse-glow`) | `linear-gradient(135deg, rgba(var(--spell-rgb), 0.30) 0%, rgba(15, 23, 42, 0.90) 65%, rgba(var(--spell-rgb), 0.18) 100%)` | `.lvl-badge-5` (Gradient fill + white border + `workspace_premium`) | Diagonal sheen sweep (`::before`), affinity particle canvas overlay, corner rune accent |

### 4.2 Level 5 Prestige Card Motion & Hover Rules
- **No Scale Jitter on Hover:** Replace `.spell-card-lvl-5:hover { transform: translateY(-6px) scale(1.02); }` in `spell-cards.css` with `transform: translateY(-3px);` (zero `scale()`) to eliminate text subpixel blurring and adjacent grid card overlap.
- **Accessibility Guard:** Wrap `@keyframes lvl5-pulse-glow` and canvas particle loops in `@media (prefers-reduced-motion: no-preference)`.
- **Locked Spell State:** Replace inline `style="opacity: 0.6; filter: grayscale(60%); pointer-events: none;"` with `.spell-card.is-locked`. Keep tooltip hover active on the lock badge so players can see *how* to unlock the spell (required Voie/Spiritualité mastery rank).

### 4.3 Action Category & Cost Readability (`tabular-nums`)
- **Action Category Badges:**
  - ⚡ **Instantané (`.badge-amber`):** `#fbbf24` icon + text, `rgba(245, 158, 11, 0.15)` fill.
  - ⏳ **Banal (`.badge-slate` / `.badge-blue`):** `#60a5fa` icon + text, `rgba(59, 130, 246, 0.12)` fill.
  - 🌀 **Canalisé (`.badge-purple`):** `#c084fc` icon + text, `rgba(168, 85, 247, 0.15)` fill + inline turn duration chip (`2T · ⚡ Autorisé`).
- **Numeric Discipline (`font-variant-numeric: tabular-nums`):**
  - Apply `font-variant-numeric: tabular-nums` and `font-family: var(--font-mono, 'JetBrains Mono', monospace)` to `.spell-meta`, `.calc-val-highlight`, `.badge-pill`, and all cost chips (`Mana`, `PV`, `Chaleur`, `Graines`).
- **Effect Summary Rows (`.spell-effects-summary .effect-line`):**
  - Structured scannable anatomy: `[Target Icon + Target Tag] [Channeling Turn / Option / Soul Condition Pill] [Effect Type Badge] ➔ [Tabular Value + Stat/Damage Type + Duration]`.

---

## 5. Admin Forge CRUD Workspace (`#spellForgePanel` & `#effectsPanel`)

### 5.1 Separating Metadata from Effect Stack Builder
Currently, `#spellForgePanel` stacks **all** spell metadata fields, conditional affinity panels, 17 effect creation buttons, and the entire `#effectsList` accordion inside one tall column (`GrimoirePage.tsx` lines 163–662), requiring excessive vertical scrolling when editing spells with 3+ effects.
- **2-Column / 3-Column Forge Architecture:**
  - **Column A (`#spellForgePanel` — Identity, Costs & Affinities):**
    - Spell Name (`#nom`), Rank (`#niveau` 1–5 + `#rankTitlePreview`), Casting Type (`#castingTypeSelect` + `#channelingConfig`).
    - 2x2 Cost Matrix (`.cost-section`): `#manaCost` / `#percentManaCost`, `#healCost` / `#percentHealCost`, plus conditional `#heatCostCard` and `#seedCostCard`.
    - Target Scope Toggle (`#isMonsterSpell`: Hero Voie/Spiritualité vs. Monster Mutation) and conditional sub-panels (`#violenceConfig`, `#karmaConfig`).
  - **Column B (`#effectsPanel` — Effect Palette & `#effectsList` Stack):**
    - Grouped Effect Palette (Offense, Recovery, Control/Utility, Affinity-Specific `#heatEffectButtons`, `#ameDetacheeEffectButton`, `#budEffectButton`).
    - Scrollable `#effectsList` container with `.effect-item.target-*` cards.
    - Sticky Primary CTA footer (`#submitSpellBtn` + `cancelEditSpell` button when `.editing-mode` is active).

### 5.2 Effect Item Card Rules (`effects-panel.css`)
- **Zero Inline Badge Styles:** Replace `typeBadgeStyle` string concatenation in `forge.js` (`renderEffects`) with semantic CSS classes in `effects-panel.css`:
  - `.effect-type-badge.eff-badge-damage` (Red gradient)
  - `.effect-type-badge.eff-badge-dot` (Crimson/Orange gradient)
  - `.effect-type-badge.eff-badge-heal` / `.eff-badge-hot` (Emerald/Teal gradient)
  - `.effect-type-badge.eff-badge-mana` / `.eff-badge-mot` (Blue/Indigo gradient)
  - `.effect-type-badge.eff-badge-buff` (Purple/Amber gradient)
  - `.effect-type-badge.eff-badge-shield` (Cyan/Blue gradient)
  - `.effect-type-badge.eff-badge-purge` (Sky gradient)
  - `.effect-type-badge.eff-badge-heat` (Orange/Red gradient)
  - `.effect-type-badge.eff-badge-soul` (Rose/Crimson gradient)
  - `.effect-type-badge.eff-badge-bud` (Emerald/Green gradient)
- **Segmented Sub-Controls (Violence, Karma, Detached Soul, Channeling Turns):**
  - Replace inline `style="display: flex; ..."` and `.style.background` / `.style.border` mutations with reusable `.segmented-control` and `.segmented-btn.is-active` classes (`--seg-color` CSS variable).

### 5.3 Floating Edit Preview (`#editingSpellPreview`)
- Position in bottom-right (`z-index: var(--z-dropdown, 40)` instead of `1000`), or dock directly at the top of `#effectsPanel` so it never occludes catalog cards on 1366x768 screens.
- Hide `.btn-edit` / `.btn-delete-small` inside `#editingSpellPreview` via pure CSS: `#editingSpellPreview .btn-edit, #editingSpellPreview .btn-delete-small { display: none; }` (eliminating the fragile `cardBody.querySelector('.spell-card-header div[style*="..."]')` hack in `grimoire.js` line 1187).

---

## 6. Page-Specific Anti-Patterns to Eliminate

| Anti-Pattern | Location | Required Fix |
| :--- | :--- | :--- |
| **`z-[9999999]` on filter container** | `GrimoirePage.tsx:683` | Replace with `z-20` (`--z-sticky`) |
| **Inline `.style.*` & `style="..."` in `#spellTypeFilterBtn`** | `grimoire.js:14-63` | Toggle `.is-instant`, `.is-banal`, `.is-canalise`, `.is-pulsing` classes |
| **Duplicate `getSpellEffectsSummaryHtml` vs `getCalculatedSpellEffectsSummaryHtml`** | `grimoire.js:238-566` vs `568-950` | Consolidate into a single CSS-class-based renderer (`getCalculatedSpellEffectsSummaryHtml` already uses `.eff-color-*` and `.dt-text-*` classes!) |
| **Inline `lvlBadgeStyle` & badge `style="..."` in `getSpellCardHtml`** | `grimoire.js:958-1133` | Replace with `.lvl-badge-1..5` and `--badge-color` / `--badge-rgb` CSS variables |
| **`.style.display = 'none' \| 'grid' \| 'flex' \| 'block'` in Forge** | `forge.js:10-12, 23-32, 120-194` | Toggle `.is-hidden` (and unify `.init-hidden` / `.hidden` into `.is-hidden`) |
| **Inline `.style.*` mutations in `updateViolenceLabel` & `updateKarmaLabel`** | `forge.js:215-303` | Toggle `.is-active` on `.violence-option-btn` and `.karma-option-btn` |
| **Massive `typeBadgeStyle` inline CSS string in `renderEffects`** | `forge.js:760-822` | Use `.effect-type-badge.eff-badge-*` classes in `effects-panel.css` |
| **Broken selector `div[style*="display: flex; gap: 0.3rem"]` in `updateEditingPreview`** | `grimoire.js:1187-1190` | Selector no longer matches because header uses Tailwind `flex flex-wrap items-center gap-1`; fix via CSS rule `#editingSpellPreview .spell-card-header button { display: none; }` |
| **Hardcoded translation maps (`typeNames`, stat icons) in JS** | `grimoire.js:314-356, 684-769` | Move to backend Rich Enums (`@JsonFormat(Shape.OBJECT)`) or centralize in `ui.js` dictionary until backend endpoint is enriched |
