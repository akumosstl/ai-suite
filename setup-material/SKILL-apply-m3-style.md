---
name: apply-m3-style
description: Full Angular Material v21 M3 style migration - audit, design system setup, global theme, component refactoring, a11y & performance. Orchestrates all sub-skills.
version: 1.0.0
requires:
  - _m3-theme-tokens.md
  - _style-audit.md
  - _design-system.md
  - _migration-patterns.md
  - SKILL-m3-global-theme.md
  - SKILL-m3-component-refactor.md
  - SKILL-m3-a11y-perf.md
---

# Skill: Apply M3 Style (Orchestrator)

## Description
Orchestrates the complete migration of an Angular project from hardcoded dark-theme CSS to Angular Material v21 M3 design tokens. This is the main entry point skill.

## Prerequisites
- Angular v17+ with `@angular/material` v17+
- SCSS preprocessor configured
- Reference page identified (the page with the best visual style to replicate)

## Execution Plan

Execute the following phases in order. Each phase produces an artifact that the next phase depends on.

---

### Phase 1: Style Audit

**Goal**: Catalog all anti-patterns and establish a migration priority order.

**Steps**:
1. Read `_style-audit.md` for the complete checklist
2. Run the audit on the project:
   - Find all `!important` declarations in global and component styles
   - Find all `::ng-deep` usages
   - Find all hardcoded hex colors and count occurrences
   - Find all deep MDC class selectors (`.mat-mdc-*`, `.mdc-*`)
   - Identify the **reference page** (best-styled page) and document its design tokens
   - Catalog repeated CSS patterns across pages
3. Produce the **Audit Summary** document

**Artifact**: Audit summary with priority migration order

---

### Phase 2: Design System Setup

**Goal**: Create shared SCSS partials with M3 tokens and reusable mixins.

**Steps**:
1. Read `_design-system.md` for the architecture pattern
2. Create the `src/styles/` directory with partials:
   - `_tokens.scss` - Semantic token aliases (color, spacing, typography, radius, elevation)
   - `_layout.scss` - Layout mixins (page-container, split-panel, left-panel, right-panel)
   - `_components.scss` - UI pattern mixins (icon-btn, panel-header, chip, badge, danger-btn)
   - `_data-display.scss` - Data display mixins (data-table, stat-card, status-badge, provider-badge, mono-cell)
   - `_states.scss` - State mixins (empty-state, loading-state)
   - `_a11y.scss` - Accessibility mixins (sr-only, focus-visible-ring)
3. Configure `angular.json` with `stylePreprocessorOptions.includePaths`
4. Verify build succeeds: `npm run build`

**Artifact**: Shared SCSS partials in `src/styles/`

---

### Phase 3: Global Theme Refactoring

**Goal**: Replace all `!important` global overrides with M3 CSS custom properties.

**Steps**:
1. Invoke `SKILL-m3-global-theme.md` instructions
2. Add `theme-type: dark` to `mat.theme()` color configuration
3. Replace `body` hardcoded colors with `var(--mat-sys-*)`
4. Convert every `.mat-mdc-*` `!important` block to `:root` CSS custom properties
5. Keep only truly global, non-component styles in `styles.scss` (scrollbar, overlay backdrop)
6. Verify build succeeds and visual parity in browser

**Artifact**: Clean `styles.scss` with zero `!important` on Material components

---

### Phase 4: Component Migration (per-page)

**Goal**: Migrate each page component to use the shared design system.

**Steps**:
1. Start with the **reference page** (e.g., `/logs`) - this validates the design system
2. For each component (in priority order from audit):
   - Invoke `SKILL-m3-component-refactor.md` instructions
   - Convert inline styles → external `.scss`
   - Rename `.css` → `.scss` if needed
   - Replace hardcoded hex with shared mixins and `var(--mat-sys-*)`
   - Ensure all custom styles are scoped under `:host`
   - Run build after each component
3. After each page, verify visual parity in browser

**Artifact**: All components using shared design system with zero hardcoded hex and zero `!important`

---

### Phase 5: Accessibility & Performance

**Goal**: Apply a11y best practices and optimize bundle size.

**Steps**:
1. Invoke `SKILL-m3-a11y-perf.md` instructions
2. Add `aria-label` to all `mat-icon-button` elements
3. Add focus trap to custom modals using `@angular/cdk/a11y`
4. Implement `BreakpointObserver` for responsive breakpoints on dense components
5. Audit Material module imports for granularity
6. Add `@defer` for heavy dialogs and tab content
7. Run final build and verify bundle size

**Artifact**: A11y-compliant, performance-optimized application

---

## Rollback Strategy

If any phase produces visual regressions:
1. Revert the last component migration using `git checkout -- <file>`
2. Debug the specific M3 token mapping for the affected component
3. Re-apply after fixing the token mapping
4. Keep the shared design system partials - they are the foundation

## Verification Checklist (End of Migration)

- [ ] `rg "!important" src/` returns zero results on `.scss` files
- [ ] `rg "::ng-deep" src/` returns zero results
- [ ] `rg "#[0-9a-fA-F]{3,8}" src/` returns zero results in component `.scss` files (only in `_tokens.scss` for brand colors)
- [ ] All components use external `.scss` (no inline `styles: [...]`)
- [ ] `npm run build` succeeds with no errors
- [ ] `npm test` passes
- [ ] Visual parity verified for all pages in browser
- [ ] Lighthouse a11y score >= 90
