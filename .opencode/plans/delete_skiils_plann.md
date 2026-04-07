# Plan: Fix Skills Page - ExpressionChangedAfterItHasBeenCheckedError

## Problem Analysis

The error occurs at `skills.component.ts:95` in the template:
```html
<div *ngIf="loading === true" class="loading-state">
```

**Root Cause**: `ExpressionChangedAfterItHasBeenCheckedError` occurs when a value changes during Angular's change detection cycle. The `loading` property is being modified after Angular has already checked it.

Looking at `deleteSkillInline()` (lines 1161-1210):
1. Opens a confirmation dialog
2. After dialog closes, calls `loadSkills()` (line 1193)
3. `loadSkills()` sets `loading = true` synchronously at line 980
4. But the component was already checked in this cycle - the dialog closing triggered change detection

## Current Flow Analysis

```
deleteSkillInline()
  └─> dialog.open(confirmDialog).afterClosed()
        └─> if confirmed:
              └─> apiService.deleteSkill().subscribe()
                    └─> on next: dialog.open(successDialog).afterClosed()
                          └─> loadSkills()  ← CHANGES loading AFTER check
```

The issue: `loadSkills()` sets `loading = true` synchronously inside the same change detection cycle triggered by the dialog closing.

## Tasks

### Task 1: Fix timing issue in deleteSkillInline
- **File**: `desktop-angular/src/app/screens/skills/skills.component.ts`
- **Issue**: `loadSkills()` called inside nested `afterClosed()` callback changes `loading` synchronously
- **Fix Options**:
  1. Use `setTimeout(() => this.loadSkills(), 0)` to defer to next tick
  2. Use `ChangeDetectorRef` properly - use `markForCheck()` instead of `detectChanges()`
  3. Move `loadSkills()` call outside the nested dialog callback

### Task 2: Verify no other similar issues
- Check other places where `loadSkills()` is called inside callbacks/dialogs

### Task 3: Test the fix
- Test delete skill functionality

## Recommended Solution

Wrap the `loadSkills()` call in `setTimeout` to defer it to the next change detection cycle:

```typescript
// In deleteSkillInline, replace line 1193:
this.loadSkills();

// With:
setTimeout(() => this.loadSkills(), 0);
```

This ensures the change to `loading` happens in a new cycle, not the current one.

## Alternative Solutions

1. **Use `Promise.resolve().then()`** - Similar to setTimeout but more Angular-idiomatic
2. **Separate loading state** - Use a separate flag for dialog loading vs data loading
3. **Use signals** - Angular Signals handle this automatically (but requires larger refactor)