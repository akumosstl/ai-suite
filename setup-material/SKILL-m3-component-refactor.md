---
name: m3-component-refactor
description: Refactor a single Angular component from hardcoded styles to M3 design system mixins and tokens
version: 1.0.0
requires:
  - _m3-theme-tokens.md
  - _design-system.md
  - _migration-patterns.md
---

# Skill: M3 Component Refactoring

## Scope
Refactors ONE component at a time. Repeat for each component in the migration queue.

## Pre-Conditions
- Shared SCSS partials exist in `src/styles/` (from design system setup)
- `angular.json` has `stylePreprocessorOptions.includePaths: ["src/styles"]`
- Global theme has been refactored (SKILL-m3-global-theme.md completed)

## Instructions

### Step 1: Analyze the Component

Read the component files and catalog:
1. Current style approach (inline / external `.css` / external `.scss`)
2. All hardcoded hex colors with their semantic meaning
3. All `::ng-deep` usages
4. All `!important` usages
5. CSS patterns that match shared mixins (from `_design-system.md`)
6. Component-specific styles that have no shared mixin equivalent

### Step 2: Create/Convert External `.scss` File

If the component uses inline styles or `.css`:
1. Create `component-name.component.scss` in the same directory
2. Move all styles from inline or `.css` into the new `.scss` file
3. Update the `@Component` decorator:
   ```typescript
   // Before
   styles: [`...`]  or  styleUrls: ['./foo.component.css']
   // After
   styleUrls: ['./foo.component.scss']
   ```

### Step 3: Replace Hardcoded Colors with M3 Tokens

For each hardcoded hex color found in Step 1:

1. Look up the semantic meaning in the component context
2. Map to the closest M3 system token using `_m3-theme-tokens.md` Hex-to-Token table
3. Replace the hex value with `var(--mat-sys-*)`

**Common mappings**:

| Semantic Context | Hex Pattern | M3 Token |
|-----------------|-------------|----------|
| Page background | `#0d0d0d`, `#111`, `#121212` | `var(--mat-sys-surface)` or `var(--mat-sys-surface-dim)` |
| Card/container bg | `#1a1a1a`, `#1e1e1e` | `var(--mat-sys-surface-container)` |
| Border/divider | `#2a2a2a`, `#3a3a3a` | `var(--mat-sys-outline-variant)` |
| Primary text | `#fff`, `#e0e0e0` | `var(--mat-sys-on-surface)` |
| Secondary text | `#888`, `#b0b0b0` | `var(--mat-sys-on-surface-variant)` |
| Accent/highlight | `#4fc3f7` | `var(--mat-sys-primary)` |
| Success | `#4caf50` | `var(--mat-sys-tertiary)` |
| Error/danger | `#ff5252` | `var(--mat-sys-error)` |
| Warning | `#ff9800` | `var(--mat-sys-secondary)` |

### Step 4: Replace Repeated Patterns with Shared Mixins

For each CSS pattern that matches a shared mixin:

1. Identify the matching mixin in `_design-system.md`
2. Add the `@use` import at the top of the `.scss` file
3. Replace the full CSS rule body with the mixin `@include`
4. Keep only the mixin call and any component-specific overrides

**Example**:

```scss
// BEFORE (40+ lines of custom CSS)
.logs-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0d0d0d;
  color: #fff;
}
.left-panel {
  width: 320px;
  min-width: 320px;
  background: #111;
  border-right: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: width 0.2s, min-width 0.2s;
}
// ... etc

// AFTER (with shared mixins)
@use 'layout' as layout;
@use 'components' as comp;
@use 'data-display' as data;
@use 'states' as states;

:host {
  @include layout.page-container;
}

.content {
  @include layout.split-panel;
}

.left-panel {
  @include layout.left-panel(320px);
}

.panel-header {
  @include comp.panel-header;
}

.icon-btn {
  @include comp.icon-btn;
}
// ... component-specific styles remain below
```

### Step 5: Eliminate `::ng-deep` and `!important`

For each `::ng-deep` or `!important` usage:

1. Identify the Material component being customized
2. Look up its MDC CSS custom property in `_m3-theme-tokens.md`
3. Replace with `:host` scoped variable:

```scss
// BEFORE
:host ::ng-deep .mat-mdc-paginator {
  background-color: #2a2a2a !important;
}

// AFTER
:host {
  --mat-paginator-container-color: var(--mat-sys-surface-container);
}
```

### Step 6: Handle Component-Specific Styles

Some styles are unique to the component and have no shared mixin. For these:

1. Keep them in the component `.scss` file
2. Replace hardcoded hex with `var(--mat-sys-*)` tokens
3. Scope under `:host` if they target Material sub-components
4. Add a comment grouping them as "component-specific"

Example of component-specific styles that stay local:
```scss
// Provider badge colors (brand-specific, not in design system)
.provider-openai {
  background: rgba(16, 163, 127, 0.15);
  color: #10a37f;
}

.provider-google {
  background: rgba(66, 133, 244, 0.15);
  color: #4285f4;
}

.provider-anthropic {
  background: rgba(204, 120, 50, 0.15);
  color: #cc7832;
}
```

### Step 7: Verify the Component

1. Run `npm run build` - must succeed
2. Navigate to the component's page in the browser
3. Verify visual parity with the reference page's style system
4. Check for any color contrast issues

## Per-Component Migration Template

For each component, create a tracking entry:

```
## [Component Name]
- Style file: [inline / .css / .scss]
- Hardcoded hex count: X
- ::ng-deep count: X
- !important count: X
- Matching shared mixins: [list]
- Component-specific styles: [list]
- Status: [pending / in-progress / done / verified]
```

## Rules
- NEVER modify TypeScript business logic
- NEVER modify HTML structural tags (only add aria-label if doing a11y phase)
- NEVER add `!important` or `::ng-deep`
- ALWAYS scope Material component overrides under `:host`
- ALWAYS use `var(--mat-sys-*)` tokens instead of hex colors
- Brand-specific colors (provider logos, etc.) may remain as hex with a comment explaining why
