---
name: _design-system
description: Shared SCSS architecture pattern for M3 design system - variables, mixins, and file structure
type: reference
---

# M3 Design System Architecture

## File Structure

```
src/
  styles/
    _tokens.scss          # M3 token mappings (color, typography, spacing, elevation)
    _layout.scss          # Layout mixins (page-container, split-panel, etc.)
    _components.scss      # Reusable UI pattern mixins (icon-btn, panel-header, etc.)
    _data-display.scss    # Table, stat card, badge mixins
    _states.scss          # Loading, empty, error state mixins
    _a11y.scss            # Accessibility utilities (sr-only, focus-visible)
  styles.scss             # Global theme + @use of all partials
```

## `_tokens.scss` - Token Definitions

```scss
@use '@angular/material' as mat;

// Semantic token aliases - single source of truth
// These map M3 system tokens to project-specific names
$_color: (
  'surface': var(--mat-sys-surface),
  'surface-dim': var(--mat-sys-surface-dim),
  'surface-container': var(--mat-sys-surface-container),
  'surface-container-low': var(--mat-sys-surface-container-low),
  'surface-container-high': var(--mat-sys-surface-container-high),
  'surface-container-highest': var(--mat-sys-surface-container-highest),
  'on-surface': var(--mat-sys-on-surface),
  'on-surface-variant': var(--mat-sys-on-surface-variant),
  'outline': var(--mat-sys-outline),
  'outline-variant': var(--mat-sys-outline-variant),
  'primary': var(--mat-sys-primary),
  'on-primary': var(--mat-sys-on-primary),
  'primary-container': var(--mat-sys-primary-container),
  'error': var(--mat-sys-error),
  'error-container': var(--mat-sys-error-container),
  'tertiary': var(--mat-sys-tertiary),
  'secondary': var(--mat-sys-secondary),
);

// Access helper: token.color('primary')
@function color($name) {
  @return map-get($_color, $name);
}

// Spacing scale (4px base)
$spacing: (
  'xs': 4px,
  'sm': 8px,
  'md': 12px,
  'base': 16px,
  'lg': 20px,
  'xl': 24px,
  '2xl': 32px,
  '3xl': 48px,
  '4xl': 64px,
);

@function spacing($name) {
  @return map-get($spacing, $name);
}

// Typography scale
$font-size: (
  'xs': 0.7rem,
  'sm': 0.75rem,
  'base-sm': 0.8rem,
  'base': 0.85rem,
  'md': 0.95rem,
  'lg': 1rem,
  'xl': 1.1rem,
  '2xl': 1.25rem,
  '3xl': 1.4rem,
);

@function font-size($name) {
  @return map-get($font-size, $name);
}

// Border radius scale
$radius: (
  'xs': 4px,
  'sm': 6px,
  'md': 8px,
  'lg': 10px,
  'xl': 12px,
  '2xl': 16px,
  'pill': 9999px,
);

@function radius($name) {
  @return map-get($radius, $name);
}

// Elevation shadows
$elevation: (
  '0': none,
  '1': 0 1px 3px rgba(0, 0, 0, 0.3),
  '2': 0 4px 8px rgba(0, 0, 0, 0.3),
  '3': 0 8px 32px rgba(0, 0, 0, 0.5),
);

@function elevation($name) {
  @return map-get($elevation, $name);
}

// Transition defaults
$transition: (
  'fast': all 0.15s ease,
  'base': all 0.2s ease,
  'slow': all 0.3s ease,
);

@function transition($name) {
  @return map-get($transition, $name);
}

// Monospace font stack
$font-mono: 'Consolas', 'Monaco', 'Courier New', monospace;
```

## `_layout.scss` - Layout Mixins

```scss
@use './tokens' as token;

// Full-height page container
@mixin page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: token.color('surface');
  color: token.color('on-surface');
}

// Split panel layout (left sidebar + right content)
@mixin split-panel($sidebar-width: 320px, $direction: row) {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-direction: $direction;
}

@mixin left-panel($width: 320px) {
  width: $width;
  min-width: $width;
  background: token.color('surface-dim');
  border-right: 1px solid token.color('outline-variant');
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: width 0.2s, min-width 0.2s;

  &.collapsed {
    width: 0;
    min-width: 0;
    overflow: hidden;
  }
}

@mixin right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

## `_components.scss` - UI Pattern Mixins

```scss
@use './tokens' as token;

// Panel header with title + actions
@mixin panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: token.spacing('lg') token.spacing('base');
  border-bottom: 1px solid token.color('outline-variant');
}

@mixin panel-title {
  display: flex;
  align-items: center;
  gap: token.spacing('sm');
  font-size: token.font-size('lg');
  font-weight: 600;
  color: token.color('on-surface');

  mat-icon {
    color: token.color('primary');
    font-size: 20px;
    width: 20px;
    height: 20px;
  }
}

// Ghost-style icon button (from logs page - preferred style)
@mixin icon-btn {
  display: flex;
  align-items: center;
  gap: token.spacing('xs');
  padding: 6px 10px;
  background: transparent;
  border: 1px solid token.color('outline-variant');
  border-radius: token.radius('sm');
  color: token.color('on-surface-variant');
  font-size: token.font-size('base-sm');
  cursor: pointer;
  transition: token.transition('base');

  &:hover:not(:disabled) {
    background: token.color('surface-container');
    color: token.color('on-surface');
    border-color: token.color('primary');
  }

  &.active {
    background: color-mix(in srgb, token.color('primary') 15%, transparent);
    color: token.color('primary');
    border-color: token.color('primary');
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  mat-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
  }
}

// Danger variant for icon button
@mixin danger-btn {
  @include icon-btn;

  &:hover:not(:disabled) {
    border-color: token.color('error');
    color: token.color('error');
    background: color-mix(in srgb, token.color('error') 10%, transparent);
  }
}

// Filter chip
@mixin chip {
  padding: 4px token.spacing('md');
  border-radius: token.radius('2xl');
  border: 1px solid token.color('outline-variant');
  background: transparent;
  color: token.color('on-surface-variant');
  font-size: token.font-size('sm');
  cursor: pointer;
  transition: token.transition('base');

  &:hover {
    border-color: token.color('primary');
    color: token.color('on-surface');
  }

  &.active {
    background: color-mix(in srgb, token.color('primary') 15%, transparent);
    border-color: token.color('primary');
    color: token.color('primary');
  }
}

// Count badge
@mixin count-badge {
  background: color-mix(in srgb, token.color('primary') 20%, transparent);
  color: token.color('primary');
  font-size: token.font-size('xs');
  padding: 2px token.spacing('sm');
  border-radius: token.radius('lg');
  font-weight: 600;
}

// Panel footer
@mixin panel-footer {
  padding: token.spacing('md') token.spacing('base');
  border-top: 1px solid token.color('outline-variant');
  margin-top: auto;
}
```

## `_data-display.scss` - Table & Card Mixins

```scss
@use './tokens' as token;

// Data table (matches logs page metrics-table style)
@mixin data-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background: token.color('surface-container');
  }

  th {
    padding: token.spacing('md') 14px;
    text-align: left;
    color: token.color('on-surface-variant');
    font-weight: 500;
    font-size: token.font-size('sm');
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid token.color('outline-variant');
    white-space: nowrap;
  }

  td {
    padding: 10px 14px;
    color: token.color('on-surface-variant');
    font-size: token.font-size('base');
    border-bottom: 1px solid token.color('surface-container');
    white-space: nowrap;
  }
}

@mixin data-row-hover {
  transition: background 0.15s;

  &:hover {
    background: token.color('surface-container');
  }
}

// Stat card
@mixin stat-card {
  background: token.color('surface-container');
  border: 1px solid token.color('outline-variant');
  border-radius: token.radius('lg');
  padding: 14px;
  text-align: center;
  cursor: pointer;
  transition: token.transition('base');

  &:hover {
    border-color: token.color('outline');
    background: token.color('surface-container-high');
  }

  &.accent {
    border-color: token.color('primary');
    background: color-mix(in srgb, token.color('primary') 8%, transparent);
  }

  &.success .stat-value {
    color: token.color('tertiary');
  }

  &.error .stat-value {
    color: token.color('error');
  }

  &.info .stat-value {
    color: token.color('primary');
  }
}

@mixin stat-value {
  font-size: token.font-size('3xl');
  font-weight: 700;
  color: token.color('on-surface');
  line-height: 1.2;
}

@mixin stat-label {
  font-size: token.font-size('xs');
  color: token.color('on-surface-variant');
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

// Status badge
@mixin status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: token.font-size('sm');
  font-weight: 600;
  text-transform: uppercase;

  &.success { color: token.color('tertiary'); }
  &.error { color: token.color('error'); }

  mat-icon {
    font-size: 14px;
    width: 14px;
    height: 14px;
  }
}

// Provider badge (brand-specific)
@mixin provider-badge($color) {
  display: inline-block;
  padding: 2px 10px;
  border-radius: token.radius('xl');
  font-size: token.font-size('sm');
  font-weight: 500;
  background: color-mix(in srgb, $color 15%, transparent);
  color: $color;
}

// Monospace cell
@mixin mono-cell {
  font-family: token.$font-mono;
  font-size: token.font-size('base-sm');
}
```

## `_states.scss` - State Mixins

```scss
@use './tokens' as token;

@mixin empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: token.spacing('sm');
  padding: token.spacing('4xl') token.spacing('2xl');
  color: token.color('outline');

  mat-icon {
    font-size: 48px;
    width: 48px;
    height: 48px;
    color: token.color('surface-container-highest');
  }

  span {
    font-size: token.font-size('lg');
    color: token.color('on-surface-variant');
  }

  small {
    font-size: token.font-size('base-sm');
    color: token.color('outline');
  }
}

@mixin loading-state {
  display: flex;
  align-items: center;
  gap: token.spacing('md');
  padding: token.spacing('xl');
  color: token.color('on-surface-variant');

  &.centered {
    justify-content: center;
    padding: token.spacing('4xl');
  }
}
```

## `_a11y.scss` - Accessibility Utilities

```scss
// Screen reader only
@mixin sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// Focus visible ring
@mixin focus-visible-ring {
  &:focus-visible {
    outline: 2px solid var(--mat-sys-primary);
    outline-offset: 2px;
  }
}
```

## Usage in Component

```scss
// e.g., logs.component.scss
@use '../../../styles/_layout' as layout;
@use '../../../styles/_components' as comp;
@use '../../../styles/_data-display' as data;
@use '../../../styles/_states' as states;

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

.panel-title {
  @include comp.panel-title;
}

.icon-btn {
  @include comp.icon-btn;
}

.chip {
  @include comp.chip;
}

.metrics-table {
  @include data.data-table;
}

.empty-state {
  @include states.empty-state;
}
```

## Integration with `angular.json`

Add `stylePreprocessorOptions` to enable shared import paths:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "stylePreprocessorOptions": {
              "includePaths": ["src/styles"]
            }
          }
        }
      }
    }
  }
}
```

Then components can use shorter imports:
```scss
@use 'tokens' as token;
@use 'layout' as layout;
```
