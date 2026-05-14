---
name: m3-a11y-perf
description: Apply accessibility best practices and performance optimizations for Angular Material v21 M3 applications
version: 1.0.0
requires:
  - _m3-theme-tokens.md
---

# Skill: M3 Accessibility & Performance

## Scope
Applies accessibility (a11y) and performance best practices to an Angular Material v21 project. Should be run after component migration is complete.

## Part 1: Accessibility (a11y)

### 1.1 ARIA Labels for Icon Buttons

**Problem**: `mat-icon-button` elements with only an icon have no accessible name.

**Detection**:
```bash
# Find all mat-icon-button without aria-label
rg "mat-icon-button" --type html -n | rg -v "aria-label"
```

**Fix**: Add `aria-label` to every `mat-icon-button`:

```html
<!-- Before -->
<button mat-icon-button (click)="togglePanel()">
  <mat-icon>menu</mat-icon>
</button>

<!-- After -->
<button mat-icon-button aria-label="Toggle panel" (click)="togglePanel()">
  <mat-icon>menu</mat-icon>
</button>
```

**Standard aria-label values**:

| Icon | aria-label |
|------|-----------|
| `menu` | "Open menu" |
| `close` | "Close" |
| `search` | "Search" |
| `add` | "Add" |
| `delete` / `remove` | "Delete" |
| `edit` / `create` | "Edit" |
| `refresh` | "Refresh" |
| `filter_list` | "Filter" |
| `settings` | "Settings" |
| `info` | "More information" |
| `visibility` / `visibility_off` | "Toggle visibility" |
| `keyboard_arrow_left` | "Previous" |
| `keyboard_arrow_right` | "Next" |
| `expand_more` / `expand_less` | "Toggle details" |
| `content_copy` | "Copy" |
| `download` | "Download" |
| `upload` | "Upload" |
| `fullscreen` | "Toggle fullscreen" |
| `chevron_left` / `chevron_right` | "Toggle panel" |

### 1.2 Focus Management with CDK

**Problem**: Custom modals/dialogs that don't use MatDialog lose focus management.

**Solution**: Use `@angular/cdk/a11y` for focus trapping.

```typescript
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

export class MyComponent implements OnDestroy {
  private focusTrap: FocusTrap | null = null;

  constructor(private focusTrapFactory: FocusTrapFactory) {}

  openCustomModal() {
    // Create focus trap when modal opens
    const element = document.querySelector('.custom-modal');
    if (element) {
      this.focusTrap = this.focusTrapFactory.create(element);
      this.focusTrap.focusInitialElement();
    }
  }

  closeCustomModal() {
    // Destroy focus trap when modal closes
    if (this.focusTrap) {
      this.focusTrap.destroy();
      this.focusTrap = null;
    }
  }

  ngOnDestroy() {
    this.focusTrap?.destroy();
  }
}
```

### 1.3 Color Contrast Validation

**Detection**: Run automated contrast checking.

```bash
# Install axe-core for automated testing (if not present)
npm install --save-dev @axe-core/playwright
```

**Manual check**: For each custom color usage, verify WCAG AA contrast ratio:
- Normal text (< 18px): 4.5:1 minimum
- Large text (>= 18px bold or >= 24px): 3:1 minimum
- UI components: 3:1 minimum

**M3 tokens that are guaranteed to pass**: All `--mat-sys-on-surface` and `--mat-sys-on-*-container` tokens automatically meet contrast requirements against their corresponding surface tokens when using `theme-type: dark`.

**Custom colors that need manual validation**:
- Brand-specific colors (provider badges, etc.)
- Any `rgba()` with transparency that reduces contrast

### 1.4 Semantic HTML

Ensure custom interactive elements have proper ARIA roles:

```html
<!-- Before: div acting as button -->
<div class="chip" (click)="toggle()">Filter</div>

<!-- After: proper button with role -->
<button class="chip" role="switch" [attr.aria-checked]="isActive" (click)="toggle()">
  Filter
</button>
```

### 1.5 Focus Visible Styling

Add global focus-visible styles to `styles.scss`:

```scss
// Focus visible for all interactive elements
:focus-visible {
  outline: 2px solid var(--mat-sys-primary);
  outline-offset: 2px;
}

// Remove default outline for mouse users
:focus:not(:focus-visible) {
  outline: none;
}
```

---

## Part 2: Performance

### 2.1 Granular Material Module Imports

**Problem**: Importing entire module groups increases bundle size.

**Detection**:
```bash
# Find any barrel/non-granular imports
rg "from '@angular/material'" src/ | rg -v "from '@angular/material/[a-z]"
```

**Fix**: Ensure every import is granular:

```typescript
// BAD - imports entire module group
import { MatButtonModule } from '@angular/material';

// GOOD - imports specific module
import { MatButtonModule } from '@angular/material/button';
```

**Verify per-component**: Each standalone component should only import the Material modules it actually uses in its template.

### 2.2 Standalone Component Architecture

**Verification**:
```bash
# Find any NgModule usage
rg "NgModule" src/app/ --type ts
```

- [ ] All components use `standalone: true`
- [ ] No `NgModule` references for Material components
- [ ] Each component declares its own imports array

### 2.3 Deferred Loading with `@defer`

**Strategy**: Defer heavy Material components that aren't visible on initial render.

**Dialogs**:
```html
<!-- Before: dialog component imported eagerly -->
<ng-container *ngIf="showDialog">
  <app-heavy-dialog [data]="dialogData" (closed)="onDialogClosed()" />
</ng-container>

<!-- After: deferred loading -->
@defer (on interaction) {
  <app-heavy-dialog [data]="dialogData" (closed)="onDialogClosed()" />
} @placeholder {
  <button mat-raised-button>Open Dialog</button>
}
```

**Tab content**:
```html
<mat-tab-group>
  <mat-tab label="Overview">
    <app-overview />  <!-- Eager: first tab visible -->
  </mat-tab>
  <mat-tab label="Details">
    @defer (when tabIndex === 1) {
      <app-details />  <!-- Lazy: only loads when tab is selected -->
    } @placeholder {
      <mat-spinner diameter="24" />
    }
  </mat-tab>
</mat-tab-group>
```

### 2.4 Responsive Layout with BreakpointObserver

**Problem**: Fixed-width panels break on small screens.

**Solution**: Use `@angular/cdk/layout` BreakpointObserver.

```typescript
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Injectable()
export class ResponsiveService {
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  isTablet$ = this.breakpointObserver.observe(Breakpoints.Tablet)
    .pipe(map(result => result.matches));
}
```

**In component**:
```typescript
export class MyComponent {
  private breakpoints = inject(BreakpointObserver);
  isSmallScreen = signal(false);

  constructor() {
    this.breakpoints.observe([Breakpoints.Small, Breakpoints.Handset])
      .pipe(takeUntilDestroyed())
      .subscribe(result => this.isSmallScreen.set(result.matches));
  }
}
```

**Template usage**:
```html
<div class="left-panel" [class.collapsed]="isSmallScreen()">
  <!-- Panel content -->
</div>
```

### 2.5 Bundle Size Audit

```bash
# Build with source maps for analysis
npm run build -- --source-map

# Check bundle sizes
ls -la dist/*/browser/*.js
```

**Target**: After migration, bundle size should decrease or stay the same due to:
- Shared mixins reducing per-component CSS
- Granular imports reducing unused Material code
- Deferred loading reducing initial bundle

---

## Verification Checklist

### Accessibility
- [ ] All `mat-icon-button` elements have `aria-label`
- [ ] Custom modals use CDK focus trap
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] Focus-visible styling applied globally
- [ ] Semantic HTML used for interactive elements
- [ ] Lighthouse a11y score >= 90

### Performance
- [ ] All Material imports are granular (`@angular/material/button`, not `@angular/material`)
- [ ] All components are standalone
- [ ] `@defer` applied to heavy dialogs/tabs not in initial viewport
- [ ] BreakpointObserver used for responsive layouts (no `@angular/flex-layout`)
- [ ] Bundle size has not increased from baseline
