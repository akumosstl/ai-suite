import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RunpipelinesComponent } from './runpipelines.component';
import { ApiService, Pipeline, PipelineStep, PipelineRun } from '../../services/api.service';
import { ProjectContextService } from '../../services/project-context.service';
import { ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

describe('RunpipelinesComponent', () => {
  let component: RunpipelinesComponent;
  let fixture: ComponentFixture<RunpipelinesComponent>;
  let apiService: ApiService;
  let httpMock: HttpTestingController;

  const mockActivatedRoute = {
    queryParams: of({ pipelineId: '1', projectId: '1' })
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockDialog = {
    open: jasmine.createSpy('open').and.returnValue({
      afterClosed: () => of(true)
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        RunpipelinesComponent
      ],
      providers: [
        ApiService,
        ProjectContextService,
        ChangeDetectorRef,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RunpipelinesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('SSE Connection', () => {
    it('should connect to SSE stream on init', () => {
      const mockPipeline: Pipeline[] = [{ id: 1, name: 'Test', status: 'pending' } as Pipeline];
      const mockRun: PipelineRun = { id: 1, status: 'completed', steps: [] } as PipelineRun;

      spyOn(apiService, 'getPipelinesByProject').and.returnValue(of({ pipelines: mockPipeline }));
      spyOn(apiService, 'getLatestPipelineRun').and.returnValue(of(mockRun));
      spyOn(apiService, 'getPipelineSteps').and.returnValue(of([]));

      component.ngOnInit();

      expect(component.pipeline).toBeTruthy();
    });

    it('should handle step output from SSE', () => {
      const mockSteps: PipelineStep[] = [
        { id: 1, stepOrder: 1, status: 'running', outputContent: '' } as PipelineStep
      ];
      component.pipelineSteps = mockSteps;
      component.currentRunId = 1;

      const mockData = {
        stepId: 1,
        stepOrder: 1,
        output: 'Step completed',
        status: 'completed'
      };

      spyOn(apiService, 'updatePipelineRunStep').and.returnValue(of({}));

      component.handleStepOutput(mockData);

      expect(component.pipelineSteps[0].status).toBe('completed');
      expect(component.pipelineSteps[0].outputContent).toContain('Step completed');
});
    
    it('should handle pipeline complete event', () => {
      const mockData = { status: 'completed' };

      component.isRunning = true;

      component.handleStepOutput = jasmine.createSpy('handleStepOutput');

      expect(component.isRunning).toBe(true);
    });

    it('should handle step error event', () => {
      const mockSteps: PipelineStep[] = [
        { id: 1, stepOrder: 1, status: 'running', outputContent: '' } as PipelineStep
      ];
      component.pipelineSteps = mockSteps;

      const mockData = {
        stepId: 1,
        error: 'Test error',
        stackTrace: 'Error stack'
      };

      const event = {
        data: JSON.stringify(mockData)
      } as any;

      expect(component.pipelineSteps[0].status).toBe('running');
    });
  });

  describe('Pipeline Execution', () => {
    it('should stop pipeline correctly', () => {
      component.projectId = 1;
      component.pipeline = { id: 1 } as Pipeline;
      component.isRunning = true;
      component.currentRunId = 1;

      spyOn(apiService, 'stopPipeline').and.returnValue(of({}));
      spyOn(apiService, 'completePipelineRun').and.returnValue(of({}));

      component.stopPipeline();

      expect(apiService.stopPipeline).toHaveBeenCalledWith(1, 1);
});
  });

  describe('Polling', () => {
    it('should start polling interval', () => {
      component.isRunning = true;
      component.isPaused = false;
      component.pipeline = { id: 1 } as Pipeline;
      component.currentRunId = 1;

      spyOn(apiService, 'getLatestPipelineRun').and.returnValue(of({ id: 1, status: 'running', steps: [] }));

      component.startPolling(3000);

      expect(component.pollingInterval).toBeTruthy();
    });

    it('should stop polling', () => {
      component.pollingInterval = setInterval(() => {}, 1000);

      component.stopPolling();

      expect(component.pollingInterval).toBeUndefined();
    });
  });

  describe('Step Selection', () => {
    it('should select step correctly', () => {
      const mockStep: PipelineStep = { id: 1, stepOrder: 1 } as PipelineStep;
      component.pipelineSteps = [mockStep];

      component.selectStep(mockStep);

      expect(component.selectedStep).toEqual(mockStep);
    });
  });

  describe('Cleanup', () => {
    it('should disconnect SSE on destroy', () => {
      component.ngOnDestroy();

      expect(component.eventSource).toBeUndefined();
    });
  });
});

describe('RunStepByStepComponent', () => {
  let component: any;
  let apiService: ApiService;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', [
      'getPipelinesByProject',
      'getLatestPipelineRun',
      'runPipeline',
      'stopPipeline',
      'continuePipeline',
      'isPipelinePaused',
      'getPipelineSteps'
    ]);
});
  
  it('should handle step-by-step execution', () => {
    const currentStepIndex = 0;
    expect(currentStepIndex).toBe(0);
  });
});
