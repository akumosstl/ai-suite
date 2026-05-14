---
name: _style-audit
description: Step-by-step audit checklist to catalog anti-patterns before M3 migration
type: reference
---

# Style Audit Checklist

Run this audit on each page/component before starting migration. Document findings in a table.

## Phase 1: Inventory

### 1.1 File Structure Audit
- [ ] List all `.scss`, `.css`, and inline `styles: [...]` across all screens/components
- [ ] Flag components using inline styles (should migrate to external `.scss`)
- [ ] Flag components using `.css` extension (should rename to `.scss`)
- [ ] Verify `angular.json` has `stylePreprocessorOptions` configured if using shared partials

### 1.2 Global Theme Audit (`styles.scss`)
- [ ] Count all `!important` declarations
- [ ] List all `.mat-mdc-*` global selector overrides
- [ ] List all hardcoded hex colors (`#xxx`, `#xxxxxx`)
- [ ] Verify `@include mat.theme(...)` uses `theme-type: dark`
- [ ] Check if `body` uses hardcoded colors instead of `var(--mat-sys-*)`

### 1.3 Per-Component Audit
For each component, record:

| Component | File | Inline? | `!important` | `::ng-deep` | Hardcoded Hex | MDC Selectors | Est. Lines |
|-----------|------|---------|-------------|-------------|---------------|---------------|------------|

### 1.4 Pattern Inventory
Identify repeated patterns across components:

| Pattern | Components Using It | Count | Should Extract |
|---------|---------------------|-------|----------------|
| Page container (flex, 100vh, dark bg) | logs, agents, scripts... | N | `_layout.scss` mixin |
| Left panel + right panel | logs, agents, scripts... | N | `_layout.scss` mixin |
| `.icon-btn` | logs, agents, config... | N | `_components.scss` mixin |
| `.panel-header` | logs, agents, scripts... | N | `_components.scss` mixin |
| `.empty-state` | logs, agents... | N | `_components.scss` mixin |
| `.stat-card` | logs | 1 | Keep local |
| `.chip` / filter chips | logs | 1 | Consider shared if reused |
| Table styling | logs, agents | N | `_data-display.scss` mixin |

## Phase 2: Anti-Pattern Detection

### 2.1 `!important` Usage
```bash
# Find all !important in SCSS/CSS
rg "!important" --type css --type scss -c
```
- [ ] Global `styles.scss` `!important` count: ___
- [ ] Component-level `!important` count: ___
- [ ] Plan: Replace each with M3 token or `:host` scoped variable

### 2.2 `::ng-deep` Usage
```bash
# Find all ::ng-deep
rg "::ng-deep" --type css --type scss -c
```
- [ ] Count: ___
- [ ] Plan: Replace with MDC component CSS variables or `::part()` selectors

### 2.3 Hardcoded Color Audit
```bash
# Find all hex colors
rg "#[0-9a-fA-F]{3,8}\b" --type css --type scss -o | sort | uniq -c | sort -rn
```
- [ ] Top 5 most used hex values: ___
- [ ] Plan: Map each to `var(--mat-sys-*)` token per `_m3-theme-tokens.md`

### 2.4 Deep MDC Selector Audit
```bash
# Find MDC internal class selectors in component styles
rg "\.mdc-|\.mat-mdc-" --type css --type scss
```
- [ ] Count: ___
- [ ] Plan: Move to `:host` scope or replace with CSS custom properties

## Phase 3: Dependency & Import Audit

### 3.1 Material Module Imports
- [ ] List all `Mat*Module` imports per component
- [ ] Flag any barrel imports (e.g., `import { MatSharedModule }`)
- [ ] Verify all are granular (e.g., `MatButtonModule`, not `MatSharedModule`)

### 3.2 Standalone Compliance
- [ ] All components use `standalone: true`
- [ ] No `NgModule` references remain for Material components

### 3.3 `@angular/flex-layout` Check
```bash
rg "flex-layout" package.json
```
- [ ] Not present (good) / Present (plan removal)

## Phase 4: Accessibility Baseline

- [ ] Count `mat-icon-button` without `aria-label`
- [ ] Count custom interactive elements without ARIA attributes
- [ ] Check focus trap usage in custom modals
- [ ] Run Lighthouse a11y audit for baseline score: ___

## Output Template

After completing the audit, produce a summary:

```
## Style Audit Summary - [Date]

### Scope: [List pages/components audited]

### Findings:
- Global !important: X occurrences across Y selectors
- Component !important: X occurrences across Y files
- ::ng-deep: X occurrences across Y files
- Hardcoded hex colors: X unique values, Y total occurrences
- Deep MDC selectors: X occurrences

### Priority Migration Order:
1. [Component] - Reason (e.g., most !important usage)
2. [Component] - Reason
...

### Recommended Shared Mixins:
- [mixin name]: Used by N components
- [mixin name]: Used by N components
```
