# Diagram Feature - Pipeline Flow Visualization

## Overview

Add a "Diagram" menu item that opens a full-featured diagram editor page where users can drag & drop pipelines from any project, create visual connections (arrows) between them, add text boxes, change colors, and save/load diagrams for later editing.

**Library**: [maxGraph](https://github.com/maxGraph/maxGraph) (TypeScript fork of mxGraph/draw.io engine) — Apache 2.0, no commercial license required.

---

## 1. Backend Changes

### 1.1 New Model: `Diagram.java`

- Fields: `id`, `name`, `description` (optional), `content` (TEXT — stores XML serialization of maxGraph model), `createdAt`, `updatedAt`
- Follow same pattern as `RecipeFile.java`
- Table name: `diagram`

### 1.2 New Repository: `DiagramRepository.java`

- Extends `JpaRepository<Diagram, Long>`
- Methods: `findAll(Pageable)`, `findByNameContainingIgnoreCase(String, Pageable)`, `findTop20ByOrderByUpdatedAtDesc()`

### 1.3 New Controller: `DiagramController.java`

- REST API at `/api/diagrams`
- CRUD endpoints:
  - `GET /api/diagrams` — list paginated (page, size)
  - `GET /api/diagrams/search?term=&page=&size=` — search by name
  - `GET /api/diagrams/{id}` — get by ID
  - `POST /api/diagrams` — create (name + content required)
  - `PUT /api/diagrams/{id}` — update (preserves createdAt)
  - `DELETE /api/diagrams/{id}` — delete
- Follow same pattern as `RecipeFileController.java`

### 1.4 New Endpoint: `GET /api/projects/all/pipelines`

- Returns all projects with their pipelines in a flat structure for the pipeline picker sidebar
- Response: `[{ projectId, projectName, pipelineId, pipelineName, pipelineStatus }]`
- Needed because currently pipelines are nested under `/api/projects/{projectId}/pipelines`
- Add to `ProjectController.java` or a new utility controller

---

## 2. Frontend Changes

### 2.1 Install maxGraph

```bash
npm install @maxgraph/core
```

### 2.2 New Screen: `screens/diagram/`

**Files**:
- `diagram.component.ts`
- `diagram.component.html`
- `diagram.component.css`

**Layout** (dark-theme, following existing pattern like recipe/pipelines):

```
┌──────────────────────────────────────────────────────────┐
│ Top Toolbar: [New] [Save] [Undo] [Redo] [Zoom] [Export] │
│            Pipeline Picker: [Project ▼] → [Pipeline ▼]  │
├────────────┬─────────────────────────────────────────────┤
│ Left Panel │                                             │
│ (collapsib │         maxGraph Canvas                     │
│  le)       │         (Full Diagram Editor)               │
│            │                                             │
│ Diagram    │                                             │
│ List       │                                             │
│ + Search   │                                             │
│ + Paginat° │                                             │
│            │                                             │
├────────────┤                                             │
│ Pipeline   │                                             │
│ Palette    │                                             │
│ (drag from │                                             │
│  here)     │                                             │
└────────────┴─────────────────────────────────────────────┘
```

**Features**:

| Feature | Implementation |
|---------|---------------|
| Pipeline Picker | Dropdown to select project → shows its pipelines as draggable items. Drag from sidebar onto canvas to create a pipeline node. |
| Drag & Drop Pipeline Nodes | Each dropped pipeline becomes a styled node (rounded rect) with pipeline name, project name, status badge |
| Connections (Arrows) | Click-drag from node edge to create directed edge (arrow). MaxGraph handles this natively. |
| Text Boxes | Toolbar button to add free-form text annotation nodes |
| Color Customization | Toolbar: fill color, stroke color, font color pickers |
| Shape Tools | Toolbar: rectangle, ellipse, rhombus (decision), text label |
| Undo/Redo | MaxGraph built-in undo manager |
| Zoom | MaxGraph built-in zoom + toolbar buttons |
| Save/Open | Save serializes maxGraph model to XML → persists via `/api/diagrams`. Open loads from list. |
| New Diagram | Clear canvas + reset form |
| Delete Diagram | Delete from list with confirmation dialog |
| Export | Export as PNG/SVG (maxGraph built-in) |
| Keyboard Shortcuts | Ctrl+S (save), Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+B (toggle left panel), Delete (remove selected) |

### 2.3 Menu Bar Update: `menu-bar.component.ts`

- Add "Diagram" item under **Stack** menu (after Pipelines/Recipe)
- Icon: `account_tree`
- Add keyboard shortcut: `Ctrl+Shift+D` → navigate to `/diagram`
- Add `/diagram` to `internalPages` array in `updateNavigationState()`

### 2.4 Route: `app.routes.ts`

- Add `{ path: 'diagram', component: DiagramComponent }`

### 2.5 API Service: `api.service.ts`

- Add `Diagram` interface: `{ id?, name, description?, content, createdAt?, updatedAt? }`
- Add `PipelineSummary` interface: `{ projectId, projectName, pipelineId, pipelineName, pipelineStatus }`
- Add CRUD methods: `getDiagrams()`, `searchDiagrams()`, `getDiagram()`, `createDiagram()`, `updateDiagram()`, `deleteDiagram()`
- Add: `getAllProjectPipelines()` → `GET /api/projects/all/pipelines`

---

## 3. File Summary

### New Files

| File | Description |
|------|-------------|
| `backend/.../model/Diagram.java` | JPA entity |
| `backend/.../repository/DiagramRepository.java` | Spring Data repo |
| `backend/.../controller/DiagramController.java` | REST CRUD |
| `desktop-angular/src/app/screens/diagram/diagram.component.ts` | Component logic |
| `desktop-angular/src/app/screens/diagram/diagram.component.html` | Template |
| `desktop-angular/src/app/screens/diagram/diagram.component.css` | Dark theme styles |

### Modified Files

| File | Change |
|------|--------|
| `desktop-angular/package.json` | Add `@maxgraph/core` dependency |
| `desktop-angular/src/app/app.routes.ts` | Add `/diagram` route |
| `desktop-angular/src/app/components/menu-bar/menu-bar.component.ts` | Add Diagram menu + Ctrl+Shift+D |
| `desktop-angular/src/app/services/api.service.ts` | Add Diagram + PipelineSummary interfaces & API methods |
| `backend/.../controller/ProjectController.java` | Add `GET /api/projects/all/pipelines` endpoint |

---

## 4. Implementation Order

1. **Backend**: Diagram entity + repository + controller + all-pipelines endpoint
2. **Frontend**: Install maxGraph, add route + menu
3. **Frontend**: API service methods for diagrams + pipeline summary
4. **Frontend**: Diagram component (HTML structure, left panel, pipeline picker)
5. **Frontend**: maxGraph canvas integration (initialization, pipeline node creation on drop)
6. **Frontend**: Drawing tools (shapes, text, connections, colors)
7. **Frontend**: Save/Open/Delete diagram (serialize/deserialize maxGraph model)
8. **Frontend**: Polish (keyboard shortcuts, export, undo/redo)

---

## 5. Key Design Decisions

### maxGraph Model Serialization
- Use `codec.encode(model)` to get XML string
- Store as string in `content` column (TEXT)
- On load, `codec.decode()` restores the full graph state (positions, styles, edges, labels)
- This preserves everything — node positions, styles, connections, custom attributes

### Pipeline Nodes
- Custom maxGraph style: rounded rectangle with pipeline name as label, project name as subtitle
- Colored border based on status:
  - Green = completed
  - Orange = running
  - Red = failed
  - Gray = pending
- Store `pipelineId` and `projectId` as custom attributes on the maxGraph cell
- This maintains reference even if pipeline names change

### Pipeline Palette
- Left panel bottom section shows pipelines grouped by project
- User expands a project to see its pipelines
- Drag a pipeline from the palette onto the canvas to create a node
- Uses HTML5 drag-and-drop API with maxGraph's `dropTarget` support

### Connection Style
- Default: solid arrow (directed edge)
- Optional styles: dashed (conditional), dotted (async), thick (critical path)
- Edge labels supported for adding descriptions to connections
