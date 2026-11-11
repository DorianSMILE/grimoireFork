# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/rpg/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** rpg (Grimoire — Browser RPG)
**Generated:** 2026-11-10
**Category:** Gaming (Browser RPG / Dark Fantasy)
**Stack:** Vanilla JS / HTML5 / CSS3 (`styles/variables.css` → `styles/ui/` → `styles/pages/` → `styles/sprites/`)
**Design Dials:** Density 8/10 (Dense / Dashboard)

---

## Global Rules

### Color Palette

Aligned with `src/main/resources/static/styles/variables.css` and UI/UX Pro Max **Gaming + Dark Glassmorphism** palette:

| Role | Hex / Value | Existing CSS Variable (`variables.css`) | Design System Alias |
|------|-------------|-----------------------------------------|---------------------|
| Primary (Arcane Violet) | `#8b5cf6` | `--primary` | `--color-primary` |
| Primary Glow | `rgba(139, 92, 246, 0.4)` | `--primary-glow` | `--color-ring` |
| Secondary (Mystic Pink) | `#ec4899` | `--secondary` | `--color-secondary` |
| Accent / CTA (Runic Blue) | `#3b82f6` | `--accent` | `--color-accent` |
| Background Base (Abyss) | `#0b0f19` | `--bg-base` | `--color-background` |
| Background Gradient | `linear-gradient(135deg, #0b0f19 0%, #171e30 100%)` | `--bg-gradient` | `--bg-gradient` |
| Elevated Surface / Tooltip | `rgba(15, 23, 42, 0.95)` / `#1e293b` | *(inline in `.global-tooltip`, `.panel.editing-mode`)* | `--color-card` |
| Glass Surface | `rgba(255, 255, 255, 0.03)` | `--glass-bg` | `--glass-bg` |
| Glass Border | `rgba(255, 255, 255, 0.08)` | `--glass-border` | `--color-border` |
| Foreground (Main Text) | `#f8fafc` | `--text-main` | `--color-foreground` |
| Muted Foreground | `#94a3b8` | `--text-muted` | `--color-muted-foreground` |
| Success (Heal / Emerald) | `#10b981` | `--success` | `--color-success` |
| Destructive / Danger (Rose) | `#f43f5e` / `#dc2626` | `--danger` | `--color-destructive` |
| Warning / Gold / Ring Slot | `#f59e0b` | `--slot-anneau` | `--color-warning` |

#### RPG Combat & Domain Semantic Tokens (`variables.css`)

| Domain Token | Hex | CSS Variable | Semantic Utility Class |
|--------------|-----|--------------|------------------------|
| Mana | `#38bdf8` | `--mana` | `.text-mana` / `.tooltip-border-mana` |
| Health (PV) | `#ec4899` / `#f43f5e` | `--secondary` / `--danger` | `.text-pv` / `.text-pv-manquant` |
| Magic / Power | `#a855f7` | `--magic` | `.text-power`, `.text-magic` |
| Critical Hit | `#ef4444` | `--crit` | `.text-crit` |
| True Damage (Brut) | `#b91c1c` | `--brut` | `.text-brut` |
| Pierce | `#fb923c` | `--pierce` | `.text-effect-burn` |
| Shield / Armor | `#06b6d4` / `#22d3ee` | `--shield-light` / `--shield-lighter` | `.text-armor`, `.text-shield` |
| Magic Shield | `#d946ef` | `--magic-shield` | `.text-effect-debuff` |
| Karma (Light / Base / Dark) | `#fde047` / `#e7d198` / `#d8b4fe` | `--karma-light` / `--karma` / `--karma-dark` | `.text-karma` |
| Violence (Insp. / Base / Exp.) | `#c41a27` / `#a70740` / `#8c0b56` | `--violence-inspiration` / `--violence-base` / `--violence-expiration` | — |
| Target: Caster / Ally / Enemy | `#34d399` / `#60a5fa` / `#fb7185` | `--caster-color` / `--target-color` | `.text-target-caster`, `.text-target-ally`, `.text-target-enemy` |

> **Color Audit Note:** `src/main/resources/static/styles/variables.css` currently defines `:root` twice (lines 1–29 and 48–79) with conflicting `--danger` (`#dc2626` vs `#f43f5e`) and `--karma` definitions. Consolidate into a single `:root` block when touching `variables.css`.

---

### Typography

Matches existing project font stack (`Outfit` headings + `Inter` body + `Material Symbols Outlined` icons):

- **Heading / Display Font:** `Outfit`, sans-serif (`.page-logo`, `.logo`, `.panel-title`)
- **Body / UI Font:** `Inter`, sans-serif (global `*` reset, inputs, tooltips, tables, combat logs)
- **Monospace / Numeric Stats:** `JetBrains Mono`, monospace (recommended for high-density combat logs, damage rolls, cooldown timers, and `font-variant-numeric: tabular-nums`)
- **Icon Font:** `Material Symbols Outlined` (`.icon-sm` `0.9rem`, `.icon-md` `1.2rem`, `.icon-lg` `3rem`, `.icon-xl` `4rem`)
- **Mood:** Geometric, dark-fantasy modern, high-legibility at compact sizes
- **Google Fonts:** [Outfit + Inter + JetBrains Mono](https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@400;500;600;700&display=swap');
```

#### High-Density Type Scale (`--density 8`)

| Role | Size | Weight | Line Height | Existing Utility |
|------|------|--------|-------------|------------------|
| Micro / Badge (`.text-xxs`, `.admin-badge`) | `0.65rem` (10.4px) | `700` | `1.1` | `.text-xxs` |
| Compact / Tooltip Desc | `0.75rem` (12px) | `400–500` | `1.4` | — |
| Dense UI / Nav / Select (`.text-xs`) | `0.8rem` (12.8px) | `500` | `1.35` | `.text-xs` |
| Standard RPG Body (`.text-sm`) | `0.9rem` (14.4px) | `400–500` | `1.45` | `.text-sm` |
| Base Readability (`.text-base`) | `1.0rem` (16px) | `400–600` | `1.5` | `.text-base` |
| Panel Header (`.panel-title`) | `1.4rem` (22.4px) | `600` (`Outfit`) | `1.2` | `.panel-title` |
| Page Logo (`.page-logo`) | `1.8rem` (28.8px) | `700` (`Outfit`) | `1.0` | `.page-logo` |

---

### Spacing Variables

*Density: 8/10 — Dense / Dashboard (overrides standard spacing scale for high-density RPG panels, inventories, spell cards, and admin tables)*

| Token | Value | Usage | Closest Existing Utility (`utilities.css`) |
|-------|-------|-------|--------------------------------------------|
| `--space-xs` | `2px` / `0.125rem` | Micro badge padding, inline icon-stat gaps | — |
| `--space-sm` | `4px` / `0.25rem` | Tight chip gaps, compact list row padding | `.p-1`, `.gap-1`, `.mt-1`, `.mb-1` |
| `--space-md` | `8px` / `0.5rem` | Standard dense control padding, grid cell gap | `.p-2`, `.px-2`, `.py-2`, `.gap-2`, `.mb-2` |
| `--space-lg` | `12px` / `0.75rem` | Compact card/panel inner padding, group spacing | `.p-3`, `.gap-3`, `.mb-3`, `.mt-3` |
| `--space-xl` | `16px` / `1rem` | Panel gap, modal body padding, section separation | `.px-4`, `.pt-4`, `.gap-4`, `.mb-4`, `.mt-4` |
| `--space-2xl` | `24px` / `1.5rem` | Major layout column gap | `.gap-6` |
| `--space-3xl` | `32px` / `2rem` | Outer page padding (`.top-header`, `.grimoire-main`) | `.gap-8`, `.mb-8`, `.my-8` |

---

### Shadow & Glow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 4px rgba(0, 0, 0, 0.5)` | Stack badges (`.stack-count-badge`), compact chips |
| `--shadow-md` | `0 4px 20px rgba(0, 0, 0, 0.5)` | Dropdown menus (`.custom-select-options`), cards |
| `--shadow-lg` | `0 10px 30px rgba(0, 0, 0, 0.5)` | Glass panels (`.panel`), floating tooltips (`.global-tooltip`) |
| `--shadow-xl` | `0 10px 30px rgba(0, 0, 0, 0.8)` | Modals, spell preview overlay (`#globalSpellTooltip`) |
| `--glow-primary` | `0 10px 30px var(--primary-glow), 0 0 20px rgba(139, 92, 246, 0.15)` | Active spell/item editing (`.editing-preview-container`) |
| `--glow-amber` | `0 0 30px rgba(245, 158, 11, 0.15), inset 0 0 20px rgba(245, 158, 11, 0.05)` | Editing mode panel (`.panel.editing-mode`) |

---

## Component Specs (Vanilla CSS — Zero Inline Styles)

### Panels & Glass Surfaces (`styles/ui/layout.css`)

```css
/* Standard Glass Panel */
.panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 1.25rem; /* Dense override from 2rem for high-density views */
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  transition: all 0.3s ease;
}

/* Signature Top Runic Gradient Bar */
.panel::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, var(--primary), var(--secondary));
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
```

### Navigation Links & Domain Color Coding (`styles/ui/components.css`)

```css
.top-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;
}
```
- **Domain Accents:** Grimoire (`#a855f7`), Armory (`#3b82f6`), Vault (`#f59e0b`), Shop (`#10b981`), Alchemy (`#06b6d4`), Hunting (`#d47406`), Admin (`#ef4444`).

### Inputs & Custom Selects (`styles/ui/components.css`, `styles/ui/forms.css`)

```css
.custom-select-trigger {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  color: var(--text-main);
  min-height: 28px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.custom-select-trigger:hover,
.custom-select-wrapper.open .custom-select-trigger {
  border-color: #f59e0b;
}

.filter-search-input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}
```

### Tooltips & Floating Overlays (`styles/ui/components.css`)

```css
.global-tooltip {
  position: fixed;
  z-index: 999999;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(168, 85, 247, 0.5);
  border-radius: 8px;
  padding: 10px;
  color: var(--text-main);
  font-size: 0.8rem;
  line-height: 1.4;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  pointer-events: none;
}
```

---

## Style Guidelines

**Style:** Dark Mode (OLED / Abyss) + Dark Fantasy Glassmorphism + High-Density RPG HUD

**Keywords:** Dark fantasy, frosted glass, arcane glow, translucent slate panels, runic top-borders, pixel-art sprites (`image-rendering: pixelated`), semantic stat color-coding, compact data density.

**Best For:** Browser RPG spellbooks (Grimoire), equipment armories, alchemy crafting tables, turn-based combat HUDs, dungeon/hunting boards, and admin balancing consoles.

**Key Effects:**
- Frosted glass containers (`backdrop-filter: blur(12px–16px)`) over fixed deep-slate gradient (`--bg-gradient`)
- Subtle 1px translucent borders (`rgba(255, 255, 255, 0.08)`) that illuminate with domain/stat color on hover or active state
- Procedural particle & combat feedback keyframes (`karmaBalance`, `violenceShock`, `betrayalGlitch`, `consolidationImpact`, `creationPulse`, `destructionShake`)
- Crisp pixel-art rendering (`image-rendering: pixelated`) for character/monster/familiar sprites alongside vector `Material Symbols Outlined` UI icons

### Page Pattern

**Pattern Name:** Asymmetric Split Workspace / Dense RPG HUD
- **Primary Layout (`.grimoire-main`):** 2-column asymmetric split (`grid-template-columns: 1fr 1.2fr`, `max-width: 1600px`, collapsing to `1fr` at `≤1024px`) or single-column full-width (`max-width: 1400px–1600px`) for dense grids.
- **Navigation Strategy:** Persistent blurred `.top-header` (`app-navbar`) with color-coded domain pills (`.top-nav-link.nav-*`).
- **Feedback Strategy:** Non-blocking toast `.notification` at bottom-right (`showNotif(msg, isError)`) + contextual `.global-tooltip` on hover.

---

## Grimoire Architecture & Anti-Patterns (CRITICAL)

### Project-Mandated Rules (`GEMINI.md`)
- ❌ **ZERO Inline Styles (`style=` or `.style.*`):** Strictly forbidden in HTML and JS.
  - Toggle visibility exclusively via `.is-hidden` / `.is-visible`.
  - Toggle states exclusively via `.is-active`, `.is-disabled`, `.is-loading`, `.open`, `.show`.
  - *Sole exception:* Runtime procedural coordinates (`transform`, `left`, `top`) for combat/particle animations (`.karma-orb`, `.violence-ember`, tooltip positioning).
- ❌ **ZERO Business Logic or Formulas in JS:** Frontend is pure display. Pre-calculate derived stats, weights, and damages in backend Java `record` DTOs or `/simulate` endpoints.
- ❌ **ZERO CSS/HTML in Database:** Store semantic keys and semantic CSS class names (`stat-mana`, `.text-mana`), never raw `style="..."` or hex strings.
- ❌ **ZERO Direct `fetch()` or `alert()`:** Always route API calls through `js/services/api.js` and errors through `showNotif(msg, isError)`.
- ❌ **ZERO Unsanitized `innerHTML`:** Always bind user-originated strings via `textContent`.

### UI/UX Pro Max Anti-Patterns
- ❌ **Light/White Surfaces:** Never use `#FFFFFF` or light-mode card backgrounds; elevated surfaces must use dark slate (`#0f172a` / `#1e293b` / `rgba(15, 23, 42, 0.95)`).
- ❌ **Opaque Heavy Borders:** Avoid thick solid grey borders; use `1px solid var(--glass-border)` (`rgba(255, 255, 255, 0.08)`) with semantic glow on `:hover` / `:focus-visible`.
- ❌ **Layout-Shifting Hovers:** Never change border-width or padding on hover; use `border-color`, `box-shadow`, `background`, or `transform: translateY(-1px)`.
- ❌ **Low-Contrast Muted Text:** Keep normal text contrast ≥ 4.5:1 (`--text-main: #f8fafc`, `--text-muted: #94a3b8` on `#0b0f19` = 7.4:1).
- ❌ **Unbounded Z-Index Escalation:** Standardize layers instead of ad-hoc `9999999` values (Base content `1–10`, Fixed sprites `50`, Dropdowns `100`, Sticky Header `500`, Modals `1000`, Notifications/Tooltips `10000`).

---

## Pre-Delivery Checklist

Before delivering any UI code for Grimoire, verify:

- [ ] **Zero `style=` attributes** in HTML templates/fragments and **zero `.style.` manipulations** in JS (except procedural coordinates)
- [ ] Reused existing classes from [utilities.css](file:///C:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/styles/ui/utilities.css) and [components.css](file:///C:/Users/doson/IdeaProjects/grimoire/src/main/resources/static/styles/ui/components.css) before adding new CSS rules
- [ ] Visibility toggled via `.is-hidden` / `.is-visible` and states via `.is-active` / `.is-disabled` / `.is-loading`
- [ ] All clickable elements have `cursor: pointer` (`.cursor-pointer`) and smooth transitions (`150ms–300ms`)
- [ ] Numeric RPG stats align cleanly (use `tabular-nums` or monospace in dense tables/logs)
- [ ] Dark mode contrast ≥ 4.5:1 verified against `--bg-base` (`#0b0f19`) and `--color-card` (`#0f172a`)
- [ ] Visible `:focus-visible` states on all interactive inputs, selects, and buttons
- [ ] `prefers-reduced-motion` respected for continuous/heavy animations
- [ ] Responsive breakpoints verified at `1440px`, `1024px` (`.grimoire-main` split collapse), `768px`, and `375px`
- [ ] Files saved with explicit **UTF-8** encoding (preserving French accents and symbols)
