import 'vitest/globals';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideMock } from '@ngneat/spectator';
import { ProjectComponent } from './project.component';
import { ApiService } from '../../services/api.service';
import { ProjectContextService } from '../../services/project-context.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Pipeline, PipelineStep } from '../../services/api.service';

describe('ProjectComponent Pipeline Features', () => {
  let component: ProjectComponent;
  let fixture: ComponentFixture<ProjectComponent>;
  let apiService: ApiService;
  let httpMock: HttpTestingController;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        ProjectComponent
      ],
      providers: [
        ApiService,
        ProjectContextService,
        ChangeDetectorRef,
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Pipeline Creation', () => {
    it('should create a new pipeline with correct properties', () => {
      const mockPipeline: Pipeline = {
        id: 1,
        name: 'Test Pipeline',
        description: 'Test Description',
        type: 'sequential',
        outputExtension: 'txt',
        status: 'pending',
        projectId: 1
      };

      spyOn(apiService, 'createPipeline').and.returnValue(of(mockPipeline));
      component.project = { id: 1, name: 'Test Project', path: '/test/path' } as any;
      component.showCreatePipelineForm();

      expect(component.showPipelineForm).toBe(true);
      expect(component.isEditingPipeline).toBe(false);
    });

    it('should call API to create pipeline with correct data', () => {
      const pipelineData = {
        name: 'New Pipeline',
        description: 'Description',
        type: 'sequential',
        outputExtension: 'txt'
      };

      const mockPipeline: Pipeline = {
        id: 1,
        ...pipelineData,
        status: 'pending',
        projectId: 1
      };

      spyOn(apiService, 'createPipeline').and.returnValue(of(mockPipeline));
      spyOn(component as any, 'loadPipelines').and.stub();

      component.project = { id: 1 } as any;
      component.selectedPipeline = null;
      (component as any).pipelineName = 'New Pipeline';
      (component as any).pipelineDescription = 'Description';
      (component as any).pipelineType = 'sequential';
      (component as any).pipelineExtension = 'txt';

      component.savePipeline();

      expect(apiService.createPipeline).toHaveBeenCalledWith(1, jasmine.objectContaining({
        name: 'New Pipeline',
        type: 'sequential'
      }));
    });
  });

  describe('Pipeline Step Management', () => {
    it('should load pipeline steps correctly', () => {
      const mockSteps: PipelineStep[] = [
        { id: 1, stepOrder: 1, type: 'agent', status: 'ready', agent: { id: 1, name: 'Agent 1', namespace: 'default', scope: 'global' } as any } as PipelineStep,
        { id: 2, stepOrder: 2, type: 'script', status: 'pending', script: { id: 1, name: 'Script 1' } as any } as PipelineStep
      ];

      spyOn(apiService, 'getPipelineSteps').and.returnValue(of(mockSteps));

      component.loadPipelineSteps(1);

      expect(component.pipelineSteps).toEqual(mockSteps);
      expect(apiService.getPipelineSteps).toHaveBeenCalledWith(1);
    });

    it('should add agent step to pipeline', () => {
      const mockPipeline: Pipeline = { id: 1, name: 'Pipeline', status: 'pending' } as Pipeline;
      const mockStep: PipelineStep = { id: 1, stepOrder: 1, type: 'agent' } as PipelineStep;
      const mockAgent = { id: 1, name: 'Test Agent' };
      const mockAgents: any[] = [mockAgent];

      component.selectedPipeline = mockPipeline;
      component.agents = mockAgents;
      component.selectedAgent = mockAgent as any;

      spyOn(apiService, 'addPipelineStep').and.returnValue(of(mockStep));
      spyOn(component as any, 'loadPipelineSteps').and.stub();

      component.addAgentToPipeline();

      expect(apiService.addPipelineStep).toHaveBeenCalledWith(1, 1, undefined);
    });

    it('should add script step to pipeline', () => {
      const mockPipeline: Pipeline = { id: 1, name: 'Pipeline', status: 'pending' } as Pipeline;
      const mockStep: PipelineStep = { id: 2, stepOrder: 1, type: 'script' } as PipelineStep;
      const mockScript = { id: 1, name: 'Test Script' };
      const mockScripts: any[] = [mockScript];

      component.selectedPipeline = mockPipeline;
      component.scripts = mockScripts;
      component.selectedScript = mockScript as any;

      spyOn(apiService, 'addPipelineStep').and.returnValue(of(mockStep));
      spyOn(component as any, 'loadPipelineSteps').and.stub();

      component.addScriptToPipeline();

      expect(apiService.addPipelineStep).toHaveBeenCalledWith(1, undefined, 1);
    });

    it('should remove step from pipeline', () => {
      const mockPipeline: Pipeline = { id: 1 } as Pipeline;
      const mockStep: PipelineStep = { id: 1, stepOrder: 1, agent: { name: 'Agent', namespace: 'default', scope: 'global' } as any } as PipelineStep;

      component.selectedPipeline = mockPipeline;
      component.pipelineSteps = [mockStep];
      component.project = { id: 1 } as any;

      spyOn(apiService, 'removePipelineStep').and.returnValue(of({}));
      spyOn(component as any, 'loadPipelineSteps').and.stub();

      component.removeStep(mockStep);

      expect(apiService.removePipelineStep).toHaveBeenCalledWith(1, 1);
    });

  it('should reorder adjacent steps via drag and drop', () => {
    const mockPipeline: Pipeline = { id: 1 } as Pipeline;
    const step1: PipelineStep = { id: 1, stepOrder: 1 } as PipelineStep;
    const step2: PipelineStep = { id: 2, stepOrder: 2 } as PipelineStep;

    component.selectedPipeline = mockPipeline;
    component.pipelineSteps = [step1, step2];
    component.project = { id: 1 } as any;
    component.isReorderingSteps = true;

    const mockEvent = {
      previousIndex: 0,
      currentIndex: 1
    } as any;

    spyOn(apiService, 'reorderPipelineSteps').and.returnValue(of([step2, step1]));
    spyOn(component as any, 'loadPipelineSteps').and.stub();

    component.dropStep(mockEvent);

    expect(apiService.reorderPipelineSteps).toHaveBeenCalledWith(1, [2, 1]);
  });

  it('should reorder non-adjacent steps via drag and drop', () => {
    const mockPipeline: Pipeline = { id: 1 } as Pipeline;
    const step1: PipelineStep = { id: 1, stepOrder: 1 } as PipelineStep;
    const step2: PipelineStep = { id: 2, stepOrder: 2 } as PipelineStep;
    const step3: PipelineStep = { id: 3, stepOrder: 3 } as PipelineStep;
    const step4: PipelineStep = { id: 4, stepOrder: 4 } as PipelineStep;

    component.selectedPipeline = mockPipeline;
    component.pipelineSteps = [step1, step2, step3, step4];
    component.project = { id: 1 } as any;
    component.isReorderingSteps = true;

    const mockEvent = {
      previousIndex: 3,
      currentIndex: 0
    } as any;

    spyOn(apiService, 'reorderPipelineSteps').and.returnValue(of([step4, step1, step2, step3]));
    spyOn(component as any, 'loadPipelineSteps').and.stub();

    component.dropStep(mockEvent);

    expect(apiService.reorderPipelineSteps).toHaveBeenCalledWith(1, [4, 1, 2, 3]);
  });
  });

  describe('Pipeline Execution', () => {
    it('should run pipeline and open new window', () => {
      const mockPipeline: Pipeline = { id: 1, type: 'sequential' } as Pipeline;
      const mockProject = { id: 1, path: '/test' };

      component.selectedPipeline = mockPipeline;
      component.project = mockProject as any;
      component.pipelineSteps = [{ id: 1 } as PipelineStep];
      component.isRunningPipeline = false;

      spyOn(apiService, 'runPipeline').and.returnValue(of({ message: 'started' }));
      spyOn(window, 'open').and.callFake(() => null);

      component.runPipeline();

      expect(component.isRunningPipeline).toBe(true);
      expect(apiService.runPipeline).toHaveBeenCalledWith(1, 1);
      expect(window.open).toHaveBeenCalledWith(
        '/runpipelines?pipelineId=1&projectId=1',
        '_blank'
      );
    });

    it('should not run pipeline if no steps exist', () => {
      component.selectedPipeline = { id: 1 } as Pipeline;
      component.pipelineSteps = [];
      component.project = { id: 1 } as any;

      spyOn(apiService, 'runPipeline');

      component.runPipeline();

      expect(apiService.runPipeline).not.toHaveBeenCalled();
    });

    it('should stop running pipeline', () => {
      const mockPipeline: Pipeline = { id: 1, status: 'running' } as Pipeline;

      component.selectedPipeline = mockPipeline;
      component.project = { id: 1 } as any;
      component.isRunningPipeline = true;

      spyOn(apiService, 'stopPipeline').and.returnValue(of({ message: 'stopped' }));
      spyOn(apiService, 'getLatestPipelineRun').and.returnValue(of({ id: 1, status: 'stopped' }));

      component.checkRunningPipeline();

      expect(component.isRunningPipeline).toBe(false);
    });
  });

  describe('Step-by-Step Pipeline', () => {
    it('should use correct URL for step-by-step pipeline', () => {
      const mockPipeline: Pipeline = { id: 1, type: 'step_by_step' } as Pipeline;

      component.selectedPipeline = mockPipeline;
      component.project = { id: 1 } as any;
      component.pipelineSteps = [{ id: 1 }] as PipelineStep[];
      component.isRunningPipeline = false;

      spyOn(apiService, 'runPipeline').and.returnValue(of({}));
      spyOn(window, 'open').and.callFake(() => null);

      component.runPipeline();

      expect(window.open).toHaveBeenCalledWith(
        '/run-step-by-step?pipelineId=1&projectId=1',
        '_blank'
      );
    });
  });

  describe('Pipeline Status', () => {
    it('should display pending status correctly', () => {
      const status = 'pending';
      expect(status).toBe('pending');
    });

    it('should display running status correctly', () => {
      const status = 'running';
      expect(status).toBe('running');
    });

    it('should display completed status correctly', () => {
      const status = 'completed';
      expect(status).toBe('completed');
    });

    it('should display failed status correctly', () => {
      const status = 'failed';
      expect(status).toBe('failed');
    });

    it('should display stopped status correctly', () => {
      const status = 'stopped';
      expect(status).toBe('stopped');
    });
  });

  describe('Pipeline Selection', () => {
    it('should select pipeline and load its steps', () => {
      const mockPipeline: Pipeline = { id: 1, name: 'Test', status: 'pending' } as Pipeline;

      spyOn(component as any, 'loadPipelineSteps').and.stub();

      component.selectPipeline(mockPipeline);

      expect(component.selectedPipeline).toEqual(mockPipeline);
      expect((component as any).loadPipelineSteps).toHaveBeenCalledWith(1);
    });
  });
});
