import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService, Diagram, PipelineSummary } from '../../services/api.service';
import { PipelineResultDialogComponent } from '../../components/pipeline-result-dialog.component';
import { SimpleInputDialogComponent } from '../../components/simple-input-dialog/simple-input-dialog.component';
import { MenuBarComponent } from '../../components/menu-bar/menu-bar.component';
import { PanelToggleComponent } from '../../components/panel-toggle/panel-toggle.component';
import {
  Graph,
  Cell,
  ModelXmlSerializer,
  UndoManager,
  constants as maxConstants,
  type CellStateStyle,
  type PanningHandler,
} from '@maxgraph/core';

interface PipelineGroup {
  projectId: number;
  projectName: string;
  pipelines: PipelineSummary[];
  expanded: boolean;
}

@Component({
  selector: 'app-diagram',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatPaginatorModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    MatExpansionModule,
    MatTooltipModule,
    MatSnackBarModule,
    MenuBarComponent,
    PipelineResultDialogComponent,
    SimpleInputDialogComponent,
    PanelToggleComponent,
  ],
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css'],
})
export class DiagramComponent implements OnInit, OnDestroy {
  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;

  diagrams: Diagram[] = [];
  selectedDiagram: Diagram | null = null;
  formDiagram: Diagram = this.getEmptyDiagram();
  searchTerm = '';
  loading = false;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  statusMessage = '';
  leftPanelCollapsed = false;

  graph!: Graph;
  undoManager!: UndoManager;
  serializer!: ModelXmlSerializer;
  isDirty = false;

  pipelineGroups: PipelineGroup[] = [];
  pipelineLoading = false;

currentTool: 'select' | 'hand' | 'rectangle' | 'ellipse' | 'rhombus' | 'text' | 'line' | 'arrow' =
'select';
  fillColor = '#1e3a5f';
  strokeColor = '#4fc3f7';
  fontColor = '#ffffff';
  currentZoom = 100;
  edgeColor = '#4fc3f7';
  edgeStyle: 'orthogonal' | 'straight' | 'curved' | 'dashed' = 'orthogonal';
  connectionSource: Cell | null = null;
  fontSize = 12;
  private clipboard: Cell[] = [];
  private clipboardOffset = 0;

  isMonitoring = false;
  isDarkTheme = true;
  private monitoringInterval: any = null;
  private static readonly MONITORING_POLL_MS = 3000;
  private previousRunningKeys = new Set<string>();

  private keydownHandler!: (event: KeyboardEvent) => void;
  private wheelHandler!: (event: WheelEvent) => void;

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  private getEmptyDiagram(): Diagram {
    return {
      name: '',
      description: '',
      content: '<mxGraphModel><root><Cell id="0"/><Cell id="1" parent="0"/></root></mxGraphModel>',
    };
  }

  ngOnInit(): void {
    this.loadDiagrams();
    this.loadPipelineSummaries();
    this.setupKeyboardShortcuts();
  }

  ngAfterViewInit(): void {
    this.initGraph();
  }

  ngOnDestroy(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    if (this.wheelHandler) {
      this.graphContainer?.nativeElement?.removeEventListener('wheel', this.wheelHandler);
    }
    this.stopMonitoring();
    if (this.graph) {
      this.graph.destroy();
    }
  }

  private setupKeyboardShortcuts(): void {
    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        this.saveDiagram();
      } else if (event.ctrlKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        this.undo();
      } else if (event.ctrlKey && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        this.redo();
      } else if (event.ctrlKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        this.copySelected();
      } else if (event.ctrlKey && event.key.toLowerCase() === 'x') {
        event.preventDefault();
        this.cutSelected();
      } else if (event.ctrlKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        this.pasteCells();
      } else if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        this.toggleLeftPanel();
      } else if (event.ctrlKey && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        this.zoomIn();
      } else if (event.ctrlKey && event.key === '-') {
        event.preventDefault();
        this.zoomOut();
      } else if (event.ctrlKey && event.key === '0') {
        event.preventDefault();
        this.zoomActual();
      } else if (event.ctrlKey && event.shiftKey && event.key === '>') {
        event.preventDefault();
        this.increaseFontSize();
      } else if (event.ctrlKey && event.shiftKey && event.key === '<') {
        event.preventDefault();
        this.decreaseFontSize();
      } else if (event.key === 'Delete') {
        this.deleteSelected();
      } else if (event.key.toLowerCase() === 'v' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        this.setTool('select');
      } else if (event.key.toLowerCase() === 'h' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        this.setTool('hand');
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  @HostListener('document:keydown.control.b')
  onToggleLeftPanel(): void {
    this.toggleLeftPanel();
  }

  toggleLeftPanel(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
    setTimeout(() => {
      if (this.graph) this.graph.sizeDidChange();
    }, 100);
  }

  private initGraph(): void {
    const container = this.graphContainer.nativeElement;
    this.graph = new Graph(container);
    this.graph.setPanning(true);
    this.graph.setConnectable(true);
    this.graph.setCellsEditable(true);
    this.graph.setCellsResizable(true);
    this.graph.setCellsMovable(true);
    this.graph.setHtmlLabels(true);
    this.graph.setAllowDanglingEdges(false);

    this.graph.getStylesheet().getDefaultEdgeStyle()!['edgeStyle'] = 'orthogonalEdgeStyle';
    this.graph.getStylesheet().getDefaultEdgeStyle()!['strokeColor'] = '#4fc3f7';
    this.graph.getStylesheet().getDefaultEdgeStyle()!['fontColor'] = '#ffffff';

    this.undoManager = new UndoManager(100);
    const listener = (_sender: any, evt: any) => {
      const edit = evt.getProperty('edit');
      this.undoManager.undoableEditHappened(edit);
      this.isDirty = true;
    };
    this.graph.getDataModel().addListener('undo', listener);
    this.graph.getDataModel().addListener('redo', listener);

    this.serializer = new ModelXmlSerializer(this.graph.getDataModel());

    this.graph.addListener('click', (_sender: any, evt: any) => {
      const cell = evt.getProperty('cell');

      if (this.currentTool === 'line' || this.currentTool === 'arrow') {
        if (cell && !cell.isEdge()) {
          if (!this.connectionSource) {
            this.connectionSource = cell;
            this.graph.setSelectionCell(cell);
            this.graph.setCellStyles('strokeWidth' as keyof CellStateStyle, 3 as any, [cell]);
            this.statusMessage = 'Source selected — click another shape to connect';
            this.cdr.markForCheck();
          } else if (cell !== this.connectionSource) {
            const source = this.connectionSource;
            this.graph.setCellStyles('strokeWidth' as keyof CellStateStyle, 2 as any, [source]);
            this.insertEdge(source, cell);
            this.connectionSource = null;
            this.statusMessage = '';
            this.currentTool = 'select';
            this.graph.setConnectable(true);
            this.cdr.markForCheck();
          }
        } else if (!cell) {
          if (this.connectionSource) {
            this.graph.setCellStyles('strokeWidth' as keyof CellStateStyle, 2 as any, [
              this.connectionSource,
            ]);
            this.connectionSource = null;
          }
          this.statusMessage = 'Connection cancelled — click a shape first';
          this.cdr.markForCheck();
        }
        return;
      }

      if (cell && !cell.isEdge()) {
        const style = this.graph.getCellStyle(cell);
        if (style) {
          this.fillColor = (style['fillColor'] as string) || '#1e3a5f';
          this.strokeColor = (style['strokeColor'] as string) || '#4fc3f7';
          this.fontColor = (style['fontColor'] as string) || '#ffffff';
          this.fontSize = (style['fontSize'] as number) || 12;
          if (style['dashed']) {
            this.edgeStyle = 'dashed';
          }
          this.cdr.markForCheck();
        }
      }
      if (cell && cell.isEdge()) {
        const style = this.graph.getCellStyle(cell);
        if (style) {
          this.edgeColor = (style['strokeColor'] as string) || '#4fc3f7';
          this.fontSize = (style['fontSize'] as number) || 12;
          const es = style['edgeStyle'] as string;
        if (es === 'straightEdgeStyle') this.edgeStyle = 'straight';
        else if (es === 'elbowEdgeStyle') this.edgeStyle = 'curved';
        else if (style['dashed']) this.edgeStyle = 'dashed';
        else this.edgeStyle = 'orthogonal';
          this.cdr.markForCheck();
        }
      }
    });

    const dropTarget = container;
    dropTarget.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    });
    dropTarget.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer!.getData('application/json');
      if (!data) return;
      try {
        const pipeline = JSON.parse(data) as PipelineSummary;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left - 100;
        const y = e.clientY - rect.top - 30;
        this.addPipelineNode(pipeline, x, y);
      } catch {
        /* ignore parse errors */
      }
    });

    dropTarget.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('pipeline-open-btn')) {
        const projectId = target.getAttribute('data-project-id');
        const pipelineId = target.getAttribute('data-pipeline-id');
        if (projectId && pipelineId) {
          e.preventDefault();
          e.stopPropagation();
          this.router.navigate(['/project', projectId], { queryParams: { pipelineId } });
        }
      }
      if (target.classList.contains('pipeline-run-btn')) {
        const projectId = target.getAttribute('data-project-id');
        const pipelineId = target.getAttribute('data-pipeline-id');
        if (projectId && pipelineId) {
          e.preventDefault();
          e.stopPropagation();
          this.apiService.runPipeline(+projectId, +pipelineId).subscribe({
            next: () => {
              const url = `/runpipelines?pipelineId=${pipelineId}&projectId=${projectId}`;
              window.open(url, '_blank');
            },
            error: (err: any) => {
              console.error('Error running pipeline:', err);
              this.ngZone.run(() => {
                this.statusMessage = 'Error running pipeline: ' + (err.error?.error || err.message);
                this.cdr.detectChanges();
              });
            },
          });
        }
      }
    });

    this.wheelHandler = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      if (event.deltaY < 0) {
        this.ngZone.run(() => this.zoomIn());
      } else if (event.deltaY > 0) {
        this.ngZone.run(() => this.zoomOut());
      }
    };
    container.addEventListener('wheel', this.wheelHandler, { passive: false });
  }

  addPipelineNode(pipeline: PipelineSummary, x: number, y: number): void {
    if (!this.graph) return;
    const statusColor = this.getStatusColor(pipeline.pipelineStatus);
    const status = pipeline.pipelineStatus || 'pending';
    const label = `<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;">
  <b>${pipeline.pipelineName}</b>
  <span style="color:#aaa;font-size:10px;">${pipeline.projectName}</span>
  <span style="color:${statusColor};font-size:10px;">● ${status}</span>
  <button class="pipeline-open-btn" data-project-id="${pipeline.projectId}" data-pipeline-id="${pipeline.pipelineId}" title="Open in Project">↗</button>
  <button class="pipeline-run-btn" data-project-id="${pipeline.projectId}" data-pipeline-id="${pipeline.pipelineId}" title="Run Pipeline">▶</button>
</div>`;
    const parent = this.graph.getDefaultParent();
    const cell = this.graph.insertVertex(parent, null, label, x, y, 200, 80, {
      shape: 'rectangle',
      rounded: true,
      arcSize: 20,
      fillColor: '#1e3a5f',
      strokeColor: statusColor,
      strokeWidth: 2,
      fontColor: '#ffffff',
      fontSize: 12,
      align: 'center',
      verticalAlign: 'middle',
      overflow: 'fill',
      whiteSpace: 'wrap',
    });
    (cell as any).pipelineId = pipeline.pipelineId;
    (cell as any).projectId = pipeline.projectId;
    this.isDirty = true;
  }

  private getStatusColor(status?: string): string {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'running':
        return '#ff9800';
      case 'failed':
        return '#f44336';
      case 'stopped':
        return '#ffc107';
      case 'interrupted':
        return '#9c27b0';
      default:
        return '#9e9e9e';
    }
  }

  toggleMonitoring(): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    } else {
      this.startMonitoring();
    }
  }

  private startMonitoring(): void {
    this.isMonitoring = true;
    this.previousRunningKeys.clear();
    this.refreshPipelineStatuses();
    this.monitoringInterval = setInterval(() => {
      this.refreshPipelineStatuses();
    }, DiagramComponent.MONITORING_POLL_MS);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.clearRunningVisuals();
    this.previousRunningKeys.clear();
  }

  private clearRunningVisuals(): void {
    if (!this.graph) return;
    const svgRoot = this.graphContainer.nativeElement.querySelector('svg');
    if (svgRoot) {
      const runningNodes = svgRoot.querySelectorAll('.pipeline-node-running');
      runningNodes.forEach((node: Element) => {
        node.classList.remove('pipeline-node-running');
      });
    }
  }

  private updateRunningPipelineVisuals(statusMap: Map<string, PipelineSummary>): void {
    if (!this.graph) return;
    const svgRoot = this.graphContainer.nativeElement.querySelector('svg');
    if (!svgRoot) return;

    const currentRunningKeys = new Set<string>();

    this.graph.getDataModel().beginUpdate();
    try {
      const cells = this.graph.getChildCells(this.graph.getDefaultParent());
      for (const cell of cells) {
        if (cell.isEdge()) continue;
        const value = cell.getValue() as string;
        if (!value || !value.includes('data-pipeline-id')) continue;

        const pipelineIdMatch = value.match(/data-pipeline-id="(\d+)"/);
        const projectIdMatch = value.match(/data-project-id="(\d+)"/);
        if (!pipelineIdMatch || !projectIdMatch) continue;

        const key = `${projectIdMatch[1]}:${pipelineIdMatch[1]}`;
        const latest = statusMap.get(key);
        if (!latest) continue;

        const isRunning = latest.pipelineStatus === 'running';
        if (isRunning) {
          currentRunningKeys.add(key);
        }

        const cellState = this.graph.getView().getState(cell);
        if (cellState && cellState.shape && cellState.shape.node) {
          const svgNode = cellState.shape.node as SVGElement;
          if (isRunning) {
            svgNode.classList.add('pipeline-node-running');
          } else {
            svgNode.classList.remove('pipeline-node-running');
          }
        }
      }
    } finally {
      this.graph.getDataModel().endUpdate();
    }

    if (currentRunningKeys.size > 0 && !this.setsEqual(currentRunningKeys, this.previousRunningKeys)) {
      if (currentRunningKeys.size > 0) {
        const names: string[] = [];
        currentRunningKeys.forEach((key) => {
          const parts = key.split(':');
          const summary = statusMap.get(key);
          if (summary) names.push(summary.pipelineName);
        });
        if (names.length > 0) {
          this.statusMessage = `Monitoring: ${names.join(', ')} running...`;
          this.cdr.markForCheck();
        }
      }
    }
    this.previousRunningKeys = currentRunningKeys;
  }

  private setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }

  private refreshPipelineStatuses(): void {
    if (!this.graph) return;
    this.apiService.getAllProjectPipelines().subscribe({
      next: (summaries) => {
        this.ngZone.run(() => {
          const statusMap = new Map<string, PipelineSummary>();
          for (const s of summaries) {
            statusMap.set(`${s.projectId}:${s.pipelineId}`, s);
          }
          this.updatePipelineCells(statusMap);
          if (this.isMonitoring) {
            this.updateRunningPipelineVisuals(statusMap);
          }
        });
      },
      error: () => {},
    });
  }

  private updatePipelineCells(statusMap: Map<string, PipelineSummary>): void {
    if (!this.graph) return;
    const cells = this.graph.getChildCells(this.graph.getDefaultParent());
    let updated = false;

    this.graph.getDataModel().beginUpdate();
    try {
      for (const cell of cells) {
        if (cell.isEdge()) continue;
        const value = cell.getValue() as string;
        if (!value || !value.includes('data-pipeline-id')) continue;

        const pipelineIdMatch = value.match(/data-pipeline-id="(\d+)"/);
        const projectIdMatch = value.match(/data-project-id="(\d+)"/);
        if (!pipelineIdMatch || !projectIdMatch) continue;

        const key = `${projectIdMatch[1]}:${pipelineIdMatch[1]}`;
        const latest = statusMap.get(key);
        if (!latest) continue;

        const newStatus = latest.pipelineStatus || 'pending';
        const newColor = this.getStatusColor(newStatus);
        const pipelineName = latest.pipelineName;
        const projectName = latest.projectName;

        const newLabel = `<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;">
  <b>${pipelineName}</b>
  <span style="color:#aaa;font-size:10px;">${projectName}</span>
  <span style="color:${newColor};font-size:10px;">● ${newStatus}</span>
  <button class="pipeline-open-btn" data-project-id="${latest.projectId}" data-pipeline-id="${latest.pipelineId}" title="Open in Project">↗</button>
  <button class="pipeline-run-btn" data-project-id="${latest.projectId}" data-pipeline-id="${latest.pipelineId}" title="Run Pipeline">▶</button>
</div>`;

        cell.setValue(newLabel);
        this.graph.setCellStyles('strokeColor' as keyof CellStateStyle, newColor as any, [cell]);
        (cell as any).pipelineId = latest.pipelineId;
        (cell as any).projectId = latest.projectId;
        updated = true;
      }
    } finally {
      this.graph.getDataModel().endUpdate();
    }

    if (updated) {
      this.isDirty = true;
      this.saveDiagramSilent();
    }
  }

  private saveDiagramSilent(): void {
    if (!this.graph || !this.serializer) return;
    if (!this.formDiagram.id) return;

    this.formDiagram.content = this.serializer.export({ pretty: false });
    this.apiService.updateDiagram(this.formDiagram.id, this.formDiagram).subscribe({
      next: (updated) => {
        this.ngZone.run(() => {
          this.selectedDiagram = { ...updated };
          this.formDiagram = { ...updated };
          this.isDirty = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {},
    });
  }

  setTool(tool: 'select' | 'hand' | 'rectangle' | 'ellipse' | 'rhombus' | 'text' | 'line' | 'arrow'): void {
    if (this.connectionSource && this.graph) {
      this.graph.setCellStyles('strokeWidth' as keyof CellStateStyle, 2 as any, [
        this.connectionSource,
      ]);
    }
    this.currentTool = tool;
    this.connectionSource = null;
    this.statusMessage = '';
    if (!this.graph) return;
    this.graph.setConnectable(tool === 'select');
    const panning = this.graph.getPlugin<PanningHandler>('PanningHandler');
    if (panning) {
      panning.panningEnabled = tool === 'select' || tool === 'hand';
      panning.useLeftButtonForPanning = tool === 'hand';
      panning.ignoreCell = tool === 'hand';
    }
    const container = this.graphContainer.nativeElement;
    if (tool === 'hand') {
      container.style.cursor = 'grab';
      container.classList.add('hand-tool');
      this.graph.setCellsMovable(false);
      this.graph.setCellsResizable(false);
    } else {
      container.style.cursor = '';
      container.classList.remove('hand-tool');
      this.graph.setCellsMovable(true);
      this.graph.setCellsResizable(true);
    }
  }

  private getEdgeStyleValue(): string {
    switch (this.edgeStyle) {
      case 'straight':
        return 'straightEdgeStyle';
      case 'curved':
        return 'elbowEdgeStyle';
      case 'dashed':
        return 'orthogonalEdgeStyle';
      default:
        return 'orthogonalEdgeStyle';
    }
  }

  insertEdge(source: Cell, target: Cell): void {
    if (!this.graph || source === target) return;
    const parent = this.graph.getDefaultParent();
    const style: any = {
      edgeStyle: this.getEdgeStyleValue(),
      strokeColor: this.edgeColor,
      fontColor: '#ffffff',
      fontSize: 11,
    };
    if (this.edgeStyle === 'dashed') {
      style['dashed'] = true;
      style['dashPattern'] = '8 4';
    }
    if (this.currentTool === 'arrow') {
      style['endArrow'] = 'block';
      style['endFill'] = 1;
    } else {
      style['endArrow'] = 'none';
      style['endFill'] = 0;
    }
    this.graph.insertEdge(parent, null, '', source, target, style);
    this.isDirty = true;
  }

  onEdgeColorChange(color: string): void {
    this.edgeColor = color;
    if (!this.graph) return;
    const cells = this.graph.getSelectionCells();
    if (cells && cells.length > 0) {
      const edges = cells.filter((c) => c.isEdge());
      if (edges.length > 0) {
        this.graph.setCellStyles('strokeColor' as keyof CellStateStyle, color as any, edges);
        this.isDirty = true;
      }
    }
  }

  onEdgeStyleChange(style: 'orthogonal' | 'straight' | 'curved' | 'dashed'): void {
    this.edgeStyle = style;
    if (!this.graph) return;
    const cells = this.graph.getSelectionCells();
    if (cells && cells.length > 0) {
      const edges = cells.filter((c) => c.isEdge());
      if (edges.length > 0) {
        this.graph.setCellStyles(
          'edgeStyle' as keyof CellStateStyle,
          this.getEdgeStyleValue() as any,
          edges,
        );
        if (style === 'dashed') {
          this.graph.setCellStyles('dashed' as keyof CellStateStyle, true as any, edges);
          this.graph.setCellStyles('dashPattern' as keyof CellStateStyle, '8 4' as any, edges);
        } else {
          this.graph.setCellStyles('dashed' as keyof CellStateStyle, false as any, edges);
          this.graph.setCellStyles('dashPattern' as keyof CellStateStyle, '' as any, edges);
        }
      }
      const vertices = cells.filter((c) => !c.isEdge());
      if (vertices.length > 0) {
        if (style === 'dashed') {
          this.graph.setCellStyles('dashed' as keyof CellStateStyle, true as any, vertices);
          this.graph.setCellStyles('dashPattern' as keyof CellStateStyle, '8 4' as any, vertices);
        } else {
          this.graph.setCellStyles('dashed' as keyof CellStateStyle, false as any, vertices);
          this.graph.setCellStyles('dashPattern' as keyof CellStateStyle, '' as any, vertices);
        }
      }
      this.isDirty = true;
    }
  }

  onCanvasClick(event: MouseEvent): void {
    if (!this.graph) return;

    if (this.currentTool === 'line' || this.currentTool === 'arrow') return;

    if (this.currentTool === 'select') return;
    if (this.currentTool === 'hand') return;
    const container = this.graphContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const parent = this.graph.getDefaultParent();

    switch (this.currentTool) {
      case 'rectangle':
        this.graph.insertVertex(parent, null, '', x - 50, y - 25, 100, 50, {
          shape: 'rectangle',
          rounded: true,
          fillColor: this.fillColor,
          strokeColor: this.strokeColor,
          fontColor: this.fontColor,
        });
        break;
      case 'ellipse':
        this.graph.insertVertex(parent, null, '', x - 40, y - 30, 80, 60, {
          shape: 'ellipse',
          fillColor: this.fillColor,
          strokeColor: this.strokeColor,
          fontColor: this.fontColor,
        });
        break;
      case 'rhombus':
        this.graph.insertVertex(parent, null, '', x - 50, y - 40, 100, 80, {
          shape: 'rhombus',
          fillColor: this.fillColor,
          strokeColor: this.strokeColor,
          fontColor: this.fontColor,
        });
        break;
      case 'text':
        this.graph.insertVertex(parent, null, 'Text', x - 40, y - 15, 80, 30, {
          shape: 'rectangle',
          fillColor: 'none',
          strokeColor: 'none',
          fontColor: this.fontColor,
          fontSize: this.fontSize,
          align: 'center',
          verticalAlign: 'middle',
        });
        break;
    }
    this.isDirty = true;
    this.currentTool = 'select';
    this.graph.setConnectable(true);
  }

  onFillColorChange(color: string): void {
    this.fillColor = color;
    this.applyStyleToSelected('fillColor', color);
  }

  onStrokeColorChange(color: string): void {
    this.strokeColor = color;
    this.applyStyleToSelected('strokeColor', color);
  }

  onFontColorChange(color: string): void {
    this.fontColor = color;
    this.applyStyleToSelected('fontColor', color);
  }

  increaseFontSize(): void {
    this.fontSize = Math.min(this.fontSize + 2, 72);
    this.applyFontSize();
  }

  decreaseFontSize(): void {
    this.fontSize = Math.max(this.fontSize - 2, 6);
    this.applyFontSize();
  }

  private applyFontSize(): void {
    if (!this.graph) return;
    const cells = this.graph.getSelectionCells();
    if (cells && cells.length > 0) {
      this.graph.setCellStyles('fontSize' as keyof CellStateStyle, this.fontSize as any, cells);
      this.isDirty = true;
    }
  }

  private applyStyleToSelected(styleKey: keyof CellStateStyle, value: string): void {
    if (!this.graph) return;
    const cells = this.graph.getSelectionCells();
    if (cells && cells.length > 0) {
      this.graph.setCellStyles(styleKey, value as any, cells);
      this.isDirty = true;
    }
  }

  undo(): void {
    if (!this.undoManager || !this.undoManager.canUndo()) return;
    this.undoManager.undo();
  }

  redo(): void {
    if (!this.undoManager || !this.undoManager.canRedo()) return;
    this.undoManager.redo();
  }

  deleteSelected(): void {
    if (!this.graph) return;
    const cells = this.graph.getSelectionCells();
    if (cells && cells.length > 0) {
      this.graph.removeCells(cells);
      this.isDirty = true;
    }
  }

  copySelected(): void {
    if (!this.graph) return;
    const cells = this.graph.getSelectionCells();
    if (!cells || cells.length === 0) return;
    const clones = this.graph.cloneCells(cells);
    this.clipboard = clones;
    this.clipboardOffset = 0;
    this.statusMessage = `${clones.length} item(s) copied`;
    this.cdr.markForCheck();
  }

  cutSelected(): void {
    if (!this.graph) return;
    const cells = this.graph.getSelectionCells();
    if (!cells || cells.length === 0) return;
    this.clipboard = this.graph.cloneCells(cells);
    this.clipboardOffset = 0;
    this.graph.removeCells(cells);
    this.isDirty = true;
    this.statusMessage = `${this.clipboard.length} item(s) cut`;
    this.cdr.markForCheck();
  }

  pasteCells(): void {
    if (!this.graph || this.clipboard.length === 0) return;
    this.clipboardOffset += 20;
    const offset = this.clipboardOffset;
    const clones = this.graph.cloneCells(this.clipboard);
    this.graph.getDataModel().beginUpdate();
    try {
      for (const cell of clones) {
        if (!cell.isEdge()) {
          const geo = cell.getGeometry();
          if (geo) {
            cell.setGeometry(geo.clone());
            cell.getGeometry()!.x += offset;
            cell.getGeometry()!.y += offset;
          }
        }
      }
      const parent = this.graph.getDefaultParent();
      this.graph.addCells(clones, parent);
    } finally {
      this.graph.getDataModel().endUpdate();
    }
    this.graph.setSelectionCells(clones);
    this.isDirty = true;
    this.statusMessage = `${clones.length} item(s) pasted`;
    this.cdr.markForCheck();
  }

  zoomIn(): void {
    if (!this.graph) return;
    this.graph.zoomIn();
    this.currentZoom = Math.round(this.graph.getView().getScale() * 100);
  }

  zoomOut(): void {
    if (!this.graph) return;
    this.graph.zoomOut();
    this.currentZoom = Math.round(this.graph.getView().getScale() * 100);
  }

  zoomActual(): void {
    if (!this.graph) return;
    this.graph.zoomActual();
    this.currentZoom = 100;
  }

  fitToWindow(): void {
    if (!this.graph) return;
    const bounds = this.graph.getGraphBounds();
    if (!bounds) return;
    const container = this.graphContainer.nativeElement;
    const scale = Math.min(
      container.clientWidth / (bounds.width + 40),
      container.clientHeight / (bounds.height + 40),
    );
    this.graph.zoomTo(scale);
    this.currentZoom = Math.round(scale * 100);
  }

  exportSvg(): void {
    if (!this.graph) return;
    const svgRoot = this.graph.container.querySelector('svg');
    if (!svgRoot) return;
    const svgData = new XMLSerializer().serializeToString(svgRoot);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `${this.formDiagram.name || 'diagram'}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  

  loadDiagrams(): void {
    this.loading = true;
    this.apiService.getDiagrams(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.diagrams = response?.diagrams ?? [];
          this.totalElements = response?.totalElements ?? 0;
          this.totalPages = response?.totalPages ?? 0;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.statusMessage = 'Error loading diagrams: ' + err.message;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  search(): void {
    if (this.searchTerm.trim()) {
      this.currentPage = 0;
      this.loading = true;
      this.apiService.searchDiagrams(this.searchTerm, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.diagrams = response?.diagrams ?? [];
            this.totalElements = response?.totalElements ?? 0;
            this.totalPages = response?.totalPages ?? 0;
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Error searching diagrams: ' + err.message;
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
      });
    } else {
      this.clearSearch();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadDiagrams();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.searchTerm.trim()) {
      this.search();
    } else {
      this.loadDiagrams();
    }
  }

  loadPipelineSummaries(): void {
    this.pipelineLoading = true;
    this.apiService.getAllProjectPipelines().subscribe({
      next: (summaries) => {
        this.ngZone.run(() => {
          const groupMap = new Map<number, PipelineGroup>();
          for (const s of summaries) {
            if (!groupMap.has(s.projectId)) {
              groupMap.set(s.projectId, {
                projectId: s.projectId,
                projectName: s.projectName,
                pipelines: [],
                expanded: false,
              });
            }
            groupMap.get(s.projectId)!.pipelines.push(s);
          }
          this.pipelineGroups = Array.from(groupMap.values());
          this.pipelineLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.pipelineLoading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  togglePipelineGroup(group: PipelineGroup): void {
    group.expanded = !group.expanded;
  }

  onPipelineDragStart(event: DragEvent, pipeline: PipelineSummary): void {
    event.dataTransfer!.setData('application/json', JSON.stringify(pipeline));
    event.dataTransfer!.effectAllowed = 'copy';
  }

  selectDiagram(diagram: Diagram): void {
    if (this.isDirty && this.formDiagram.id) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    this.selectedDiagram = { ...diagram };
    this.formDiagram = { ...diagram };
    this.loadDiagramContent(diagram.content);
    this.statusMessage = `Diagram selected: ${diagram.name}`;
    this.isDirty = false;
    this.refreshPipelineStatuses();
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  private loadDiagramContent(xml: string): void {
    if (!this.graph || !this.serializer) return;
    this.graph.getDataModel().beginUpdate();
    try {
      this.graph.removeCells(this.graph.getChildCells(this.graph.getDefaultParent()));
      this.serializer.import(xml);
    } finally {
      this.graph.getDataModel().endUpdate();
    }
    this.undoManager.clear();
  }

  newDiagram(): void {
    if (this.isDirty) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    this.selectedDiagram = null;
    this.formDiagram = this.getEmptyDiagram();
    this.loadDiagramContent(this.formDiagram.content);
    this.statusMessage = 'New diagram created';
    this.isDirty = false;
  }

  saveDiagram(): void {
    if (!this.graph || !this.serializer) return;

    this.dialog.open(SimpleInputDialogComponent, {
      data: {
        title: 'Save Diagram',
        label: 'Diagram Name',
        placeholder: 'Enter diagram name',
        value: this.formDiagram.name,
        icon: 'save'
      },
      width: '400px'
    }).afterClosed().subscribe((name: string | undefined) => {
      if (!name) return;
      this.formDiagram.name = name;
      this.formDiagram.content = this.serializer.export({ pretty: false });

    if (this.formDiagram.id) {
        this.apiService.updateDiagram(this.formDiagram.id, this.formDiagram).subscribe({
          next: (updated) => {
            this.ngZone.run(() => {
              this.statusMessage = `Diagram '${updated.name}' updated successfully`;
              this.selectedDiagram = { ...updated };
              this.formDiagram = { ...updated };
              this.isDirty = false;
              this.loadDiagrams();
              this.cdr.detectChanges();
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.statusMessage = 'Error: ' + (err.error?.error || err.message);
              this.cdr.detectChanges();
            });
          },
        });
      } else {
        this.apiService.createDiagram(this.formDiagram).subscribe({
          next: (created) => {
            this.ngZone.run(() => {
              this.statusMessage = `Diagram '${created.name}' created successfully`;
              this.selectedDiagram = { ...created };
              this.formDiagram = { ...created };
              this.isDirty = false;
              this.currentPage = 0;
              this.loadDiagrams();
              this.cdr.detectChanges();
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              this.statusMessage = 'Error: ' + (err.error?.error || err.message);
              this.cdr.detectChanges();
            });
          },
        });
      }
    });
  }

  deleteDiagram(diagram: Diagram, event: Event): void {
    event.stopPropagation();
    if (!diagram.id) return;

    this.dialog
      .open(PipelineResultDialogComponent, {
        data: {
          success: false,
          message: `Do you really want to delete the diagram "${diagram.name}"?`,
          showConfirm: true,
          confirmText: 'Delete',
          cancelText: 'Cancel',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.apiService.deleteDiagram(diagram.id!).subscribe({
            next: () => {
              this.ngZone.run(() => {
                this.dialog
                  .open(PipelineResultDialogComponent, {
                    data: {
                      success: true,
                      message: `Diagram "${diagram.name}" deleted successfully!`,
                    },
                  })
                  .afterClosed()
                  .subscribe(() => {
                    setTimeout(() => {
                      if (this.selectedDiagram?.id === diagram.id) {
                        this.newDiagram();
                      }
                      this.loadDiagrams();
                    }, 0);
                  });
              });
            },
            error: (err) => {
              this.ngZone.run(() => {
                this.dialog.open(PipelineResultDialogComponent, {
                  data: {
                    success: false,
                    message: err.error?.message || err.message || 'Failed to delete diagram.',
                  },
                });
              });
            },
          });
        }
      });
  }

  getStatusClass(): string {
    if (!this.statusMessage) return '';
    if (this.statusMessage.includes('Error')) return 'error';
    if (
      this.statusMessage.includes('success') ||
      this.statusMessage.includes('created') ||
      this.statusMessage.includes('updated') ||
      this.statusMessage.includes('deleted') ||
      this.statusMessage.includes('selected') ||
      this.statusMessage.includes('New')
    )
      return 'success';
    return 'info';
  }
}
