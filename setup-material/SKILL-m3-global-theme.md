---
name: m3-global-theme
description: Refactor global styles.scss - eliminate !important overrides, configure M3 dark theme tokens at :root level
version: 1.0.0
requires:
  - _m3-theme-tokens.md
  - _migration-patterns.md
---

# Skill: M3 Global Theme Refactoring

## Scope
Only modifies `src/styles.scss` (and any other global stylesheet files). Does NOT touch component files.

## Pre-Conditions
- `_m3-theme-tokens.md` is available as reference
- Audit of `!important` and hex colors in `styles.scss` has been completed

## Instructions

### Step 1: Configure M3 Dark Theme

Ensure `mat.theme()` includes `theme-type: dark`:

```scss
@use '@angular/material' as mat;

html {
  height: 100%;
  @include mat.theme((
    color: (
      primary: mat.$azure-palette,
      tertiary: mat.$blue-palette,
      theme-type: dark,
    ),
    typography: Roboto,
    density: 0,
  ));
}
```

### Step 2: Replace Body Hardcoded Colors

```scss
// BEFORE
body {
  color-scheme: dark;
  background-color: #1a1a1a;
  color: #ffffff;
}

// AFTER
body {
  color-scheme: dark;
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}
```

### Step 3: Convert `!important` Blocks to `:root` Variables

For EACH `.mat-mdc-*` selector with `!important` in `styles.scss`, follow this process:

1. Identify the CSS property being overridden (e.g., `background-color`, `color`, `border-radius`)
2. Look up the corresponding MDC CSS custom property in `_m3-theme-tokens.md` Component-Level section
3. Move the override to `:root` as a CSS custom property assignment
4. Replace hardcoded hex values with `var(--mat-sys-*)` system tokens

**Example conversion table**:

| Before (selector + !important) | After (:root variable) |
|--------------------------------|------------------------|
| `.mat-mdc-button { background: #333 !important }` | `:root { --mdc-filled-button-container-color: var(--mat-sys-surface-container-highest) }` |
| `.mat-mdc-card { background: #2a2a2a !important }` | `:root { --mdc-elevated-card-container-color: var(--mat-sys-surface-container) }` |
| `.mat-mdc-dialog-container { --mdc-dialog-container-color: #2a2a2a !important }` | `:root { --mdc-dialog-container-color: var(--mat-sys-surface-container) }` |
| `.mat-mdc-menu-panel { background: #2a2a2a !important }` | `:root { --mat-menu-container-color: var(--mat-sys-surface-container) }` |
| `.mat-mdc-menu-item { color: #e0e0e0 !important }` | `:root { --mat-menu-item-label-text-color: var(--mat-sys-on-surface) }` |
| `.mat-mdc-table { background: transparent !important }` | `:root { --mat-table-background-color: transparent }` |
| `.mat-mdc-header-cell { color: #888 !important }` | `:root { --mat-table-header-headline-color: var(--mat-sys-on-surface-variant) }` |
| `.mat-mdc-cell { color: #e0e0e0 !important }` | `:root { --mat-table-row-item-label-text-color: var(--mat-sys-on-surface) }` |
| `.mat-mdc-paginator { background: #2a2a2a !important }` | `:root { --mat-paginator-container-color: var(--mat-sys-surface-container) }` |
| `.mat-mdc-icon-button { color: #e0e0e0 !important }` | `:root { --mat-icon-button-state-layer-color: var(--mat-sys-on-surface-variant) }` |
| `.mat-mdc-outlined-button { border-color: #555 !important }` | `:root { --mdc-outlined-button-outline-color: var(--mat-sys-outline) }` |
| `.mat-mdc-progress-spinner circle { stroke: #1976d2 !important }` | `:root { --mdc-circular-progress-active-indicator-color: var(--mat-sys-primary) }` |

### Step 4: Keep Only Non-Component Global Styles

After converting all component overrides, `styles.scss` should only contain:

```scss
@use '@angular/material' as mat;

html {
  height: 100%;
  @include mat.theme((
    color: (
      primary: mat.$azure-palette,
      tertiary: mat.$blue-palette,
      theme-type: dark,
    ),
    typography: Roboto,
    density: 0,
  ));
}

body {
  color-scheme: dark;
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font-family: Roboto, sans-serif;
  margin: 0;
  height: 100%;
}

// M3 component variable overrides (no !important)
:root {
  --mdc-filled-button-container-color: var(--mat-sys-surface-container-highest);
  --mdc-filled-button-label-text-color: var(--mat-sys-on-surface);
  // ... all other MDC variable overrides from Step 3
}

// Scrollbar styling (non-component, safe to keep)
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--mat-sys-surface-container); }
::-webkit-scrollbar-thumb { background: var(--mat-sys-outline); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--mat-sys-on-surface-variant); }

// Overlay backdrop
.cdk-overlay-dark-backdrop { background: rgba(0, 0, 0, 0.7); }

// Dialog size overrides (layout, not color)
.console-dialog-panel .mat-mdc-dialog-surface {
  width: 95vw;
  height: 90vh;
  max-width: none;
  max-height: none;
}

// Global monospace font for code inputs
.mat-mdc-form-field input,
.mat-mdc-form-field textarea {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
}

.mat-mdc-form-field input::placeholder,
.mat-mdc-form-field textarea::placeholder {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  color: var(--mat-sys-on-surface-variant);
  opacity: 1;
}
```

### Step 5: Verify

1. Run `npm run build` - must succeed
2. Open the application in browser
3. Verify visual parity: buttons, cards, dialogs, menus, tables, paginators all look correct
4. Toggle between pages to confirm consistency

## Rules
- NEVER add `!important` back
- NEVER target `.mat-mdc-*` class selectors for color/style overrides - use `:root` variables only
- Layout-related overrides (width, height, max-width) on specific dialog classes are acceptable without `!important`
- If an MDC variable doesn't exist for a specific override, use `:root` with `var(--mat-sys-*)` values and add a comment explaining why
