# Pipeline Status CSS Reference

This document describes the CSS styles used to display different status states for pipelines and pipeline steps.

---

## Pipeline Status Styles

### `.pipeline-status`

Base class for pipeline status badges.

```scss
.pipeline-status {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}
```

### `pending`

When a pipeline is created but not yet executed.

```scss
.pipeline-status.pending {
  background: rgba(255, 152, 0, 0.2);  // Orange background (20% opacity)
  color: #ffb74d;                       // Light orange text
}
```

| Property | Value |
|----------|-------|
| Background | `rgba(255, 152, 0, 0.2)` |
| Text Color | `#ffb74d` |

---

### `active` / `running`

When a pipeline is currently executing.

```scss
.pipeline-status.active, 
.pipeline-status.running {
  background: rgba(76, 175, 80, 0.2);  // Green background (20% opacity)
  color: #81c784;                       // Light green text
}
```

| Property | Value |
|----------|-------|
| Background | `rgba(76, 175, 80, 0.2)` |
| Text Color | `#81c784` |

---

### `completed`

When all steps finished successfully.

```scss
.pipeline-status.completed {
  background: rgba(33, 150, 243, 0.2);  // Blue background (20% opacity)
  color: #64b5f6;                      // Light blue text
}
```

| Property | Value |
|----------|-------|
| Background | `rgba(33, 150, 243, 0.2)` |
| Text Color | `#64b5f6` |

---

### `failed`

When a step encountered an error.

```scss
.pipeline-status.failed {
  background: rgba(244, 67, 54, 0.2);  // Red background (20% opacity)
  color: #e57373;                      // Light red text
}
```

| Property | Value |
|----------|-------|
| Background | `rgba(244, 67, 54, 0.2)` |
| Text Color | `#e57373` |

---

### `stopped`

When execution was manually stopped.

> **Note**: No explicit CSS defined - inherits default styling or falls back to `pending`.

---

## Step Status Styles

### `.step-status`

Base class for step status badges.

```scss
.step-status {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}
```

---

### `ready`

Step is prepared to run but hasn't started.

```scss
.step-status.ready {
  background: rgba(156, 39, 176, 0.2);  // Purple background (20% opacity)
  color: #ba68c8;                        // Light purple text
}
```

| Property | Value |
|----------|-------|
| Background | `rgba(156, 39, 176, 0.2)` |
| Text Color | `#ba68c8` |

---

### `pending`

Step is waiting to be executed.

```scss
.step-status.pending {
  background: rgba(255, 152, 0, 0.2);  // Orange background (20% opacity)
  color: #ffb74d;                       // Light orange text
}
```

| Property | Value |
|----------|-------|
| Background | `rgba(255, 152, 0, 0.2)` |
| Text Color | `#ffb74d` |

---

### `active` / `running`

Step is currently executing.

```scss
.step-status.active, 
.step-status.running {
  background: rgba(76, 175, 80, 0.2);  // Green background (20% opacity)
  color: #81c784;                       // Light green text
}
```

| Property | Value |
|----------|-------|
| Background | `rgba(76, 175, 80, 0.2)` |
| Text Color | `#81c784` |

---

### `completed`

Step finished successfully.

```scss
.step-status.completed {
  background: rgba(33, 150, 243, 0.2);  // Blue background (20% opacity)
  color: #64b5f6;                        // Light blue text
}
```

| Property | Value |
|----------|-------|
| Background | `rgba(33, 150, 243, 0.2)` |
| Text Color | `#64b5f6` |

---

### `failed`

Step encountered an error.

```scss
.step-status.failed {
  background: rgba(244, 67, 54, 0.2);  // Red background (20% opacity)
  color: #e57373;                       // Light red text
}
```

| Property | Value |
|----------|-------|
| Background | `rgba(244, 67, 54, 0.2)` |
| Text Color | `#e57373` |

---

## Status Color Summary

| Status | Color Name | Hex | RGB |
|--------|------------|-----|-----|
| pending | Orange | `#ffb74d` | 255, 183, 77 |
| ready | Purple | `#ba68c8` | 186, 104, 200 |
| running | Green | `#81c784` | 129, 199, 132 |
| completed | Blue | `#64b5f6` | 100, 181, 246 |
| failed | Red | `#e57373` | 229, 115, 115 |

---

## Implementation Pattern

The status is applied using Angular's `[ngClass]` directive:

```html
<!-- Pipeline -->
<span class="pipeline-status" [ngClass]="pipeline.status || 'pending'">
  {{ pipeline.status || 'pending' }}
</span>

<!-- Step -->
<span class="step-status" [ngClass]="step.status || 'pending'">
  {{ step.status || 'pending' }}
</span>
```

---

## Dark Theme Considerations

The current styles use semi-transparent backgrounds with light text colors, which work well on dark backgrounds. If implementing light theme support:

1. Increase background opacity (e.g., `0.3` to `0.5`)
2. Darken text colors
3. Or use solid backgrounds with white/light text

---

## Adding New Statuses

To add a new status (e.g., `paused`):

1. Add the status to the backend model
2. Add CSS class in component:
   ```scss
   .step-status.paused, .pipeline-status.paused {
     background: rgba(255, 193, 7, 0.2);  // Amber
     color: #ffca28;
   }
   ```
3. Update frontend template to include the new status class
4. Ensure SSE events send the correct status value
