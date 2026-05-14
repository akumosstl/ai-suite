---
name: _migration-patterns
description: Before/after code patterns for migrating from hardcoded styles to M3 tokens
type: reference
---

# M3 Migration Patterns

## Pattern 1: Global `styles.scss` - Theme Configuration

### Before
```scss
@use '@angular/material' as mat;

html {
  @include mat.theme((
    color: (
      primary: mat.$azure-palette,
      tertiary: mat.$blue-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}

body {
  color-scheme: dark;
  background-color: #1a1a1a;
  color: #ffffff;
  font-family: Roboto, sans-serif;
  margin: 0;
  height: 100%;
}
```

### After
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
```

**Key Change**: Add `theme-type: dark` inside `color` map. Replace hex with `var(--mat-sys-*)`.

---

## Pattern 2: Global `styles.scss` - Eliminate `!important` on Components

### Before (anti-pattern)
```scss
.mat-mdc-button, .mat-mdc-raised-button {
  background-color: #333 !important;
  color: white !important;
}

.mat-mdc-card {
  background-color: #2a2a2a !important;
  color: white !important;
}

.mat-mdc-dialog-container {
  --mdc-dialog-container-color: #2a2a2a !important;
  border-radius: 12px !important;
}
```

### After (M3 tokens via `:root`)
```scss
// Override MDC component variables at :root level - no !important needed
:root {
  // Button
  --mdc-filled-button-container-color: var(--mat-sys-surface-container-highest);
  --mdc-filled-button-label-text-color: var(--mat-sys-on-surface);

  // Card
  --mdc-elevated-card-container-color: var(--mat-sys-surface-container);

  // Dialog
  --mdc-dialog-container-color: var(--mat-sys-surface-container);
  --mdc-dialog-container-shape: var(--mat-sys-corner-medium);
  --mat-dialog-headline-color: var(--mat-sys-on-surface);
  --mat-dialog-supporting-text-color: var(--mat-sys-on-surface-variant);

  // Menu
  --mat-menu-container-color: var(--mat-sys-surface-container);
  --mat-menu-container-shape: var(--mat-sys-corner-medium);
  --mat-menu-item-label-text-color: var(--mat-sys-on-surface);

  // Table
  --mat-table-background-color: transparent;
  --mat-table-header-headline-color: var(--mat-sys-on-surface-variant);
  --mat-table-row-item-label-text-color: var(--mat-sys-on-surface);
  --mat-table-row-item-outline-color: var(--mat-sys-outline-variant);

  // Paginator
  --mat-paginator-container-color: var(--mat-sys-surface-container);
  --mat-paginator-container-text-color: var(--mat-sys-on-surface-variant);

  // Form field
  --mdc-filled-text-field-container-color: var(--mat-sys-surface-container-high);

  // Progress spinner
  --mdc-circular-progress-active-indicator-color: var(--mat-sys-primary);

  // Icon button
  --mat-icon-button-state-layer-color: var(--mat-sys-on-surface-variant);

  // Outlined button
  --mdc-outlined-button-outline-color: var(--mat-sys-outline);
  --mdc-outlined-button-label-text-color: var(--mat-sys-on-surface);
}
```

**Key Change**: `!important` on class selectors → CSS custom properties on `:root`. M3 engine resolves them.

---

## Pattern 3: Component Inline Styles → External `.scss`

### Before (inline in `.component.ts`)
```typescript
@Component({
  selector: 'app-logs',
  standalone: true,
  styles: [`
    .logs-container { background: #0d0d0d; color: #fff; }
    .icon-btn { border: 1px solid #3a3a3a; color: #888; }
    // ... 400 lines of CSS
  `]
})
```

### After (external `.scss` with shared mixins)
```typescript
@Component({
  selector: 'app-logs',
  standalone: true,
  styleUrls: ['./logs.component.scss'],
})
```

```scss
// logs.component.scss
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

.icon-btn {
  @include comp.icon-btn;
}

.metrics-table {
  @include data.data-table;
}

.empty-state {
  @include states.empty-state;
}
```

**Key Change**: Inline CSS → External `.scss` → Shared mixins. Reduces per-component CSS by ~60-80%.

---

## Pattern 4: Hardcoded Hex Colors → M3 Tokens

### Before
```scss
.stat-value { color: #4fc3f7; }
.stat-label { color: #888; }
.error-cell { color: #ff5252; }
```

### After
```scss
.stat-value { color: var(--mat-sys-primary); }
.stat-label { color: var(--mat-sys-on-surface-variant); }
.error-cell { color: var(--mat-sys-error); }
```

---

## Pattern 5: `::ng-deep` → MDC CSS Custom Properties

### Before (anti-pattern)
```scss
:host ::ng-deep .mat-mdc-paginator {
  background-color: #2a2a2a !important;
  color: #e0e0e0 !important;
}

:host ::ng-deep .mat-mdc-form-field {
  color: white !important;
}
```

### After (CSS custom properties in `:host`)
```scss
:host {
  --mat-paginator-container-color: var(--mat-sys-surface-container);
  --mat-paginator-container-text-color: var(--mat-sys-on-surface-variant);
  --mdc-filled-text-field-container-color: var(--mat-sys-surface-container-high);
}
```

**Key Change**: `::ng-deep` breaks encapsulation. `:host` with MDC variables maintains encapsulation while customizing.

---

## Pattern 6: CSS File Extension → SCSS

### Before
```
agents.component.css   (plain CSS, no variables)
```

### After
```
agents.component.scss  (Sass with @use, mixins, M3 tokens)
```

Also update the `@Component` decorator:
```typescript
// Before
styleUrls: ['./agents.component.css']
// After
styleUrls: ['./agents.component.scss']
```

---

## Pattern 7: Deferred Loading for Heavy Material Components

### Before
```typescript
@Component({
  imports: [MatDialogModule, MatTabsModule, MatTableModule],
  template: `
    <mat-tab-group>...</mat-tab-group>
    <mat-dialog>...</mat-dialog>
  `
})
```

### After
```typescript
@Component({
  imports: [MatTabsModule], // Only what's visible initially
  template: `
    <mat-tab-group>...</mat-tab-group>
    @defer (on interaction) {
      <app-heavy-dialog />
    } @placeholder {
      <button>Open Dialog</button>
    }
  `
})
```

---

## Pattern 8: ARIA Labels for Icon Buttons

### Before
```html
<button mat-icon-button (click)="toggle()">
  <mat-icon>menu</mat-icon>
</button>
```

### After
```html
<button mat-icon-button aria-label="Toggle menu" (click)="toggle()">
  <mat-icon>menu</mat-icon>
</button>
```

---

## Pattern 9: BreakpointObserver for Responsive Layout

### Before
```scss
.left-panel {
  width: 420px; // Too wide on mobile
}
```

### After
```typescript
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

export class MyComponent {
  isSmallScreen = signal(false);

  constructor(private breakpoints: BreakpointObserver) {
    this.breakpoints.observe(Breakpoints.Small).subscribe(result => {
      this.isSmallScreen.set(result.matches);
    });
  }
}
```

```scss
.left-panel {
  width: 320px;

  @media (max-width: 599px) {
    width: 100%;
    min-width: 100%;
  }
}
```
