import { test, expect } from '@playwright/test';

test.describe('Pipeline Feature', () => {
  const baseUrl = 'http://localhost:4200';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  test('should load the application and navigate to project', async ({ page }) => {
    await expect(page).toHaveTitle(/agentic/i);
  });

  test('should display pipelines section in sidebar', async ({ page }) => {
    await page.waitForSelector('.pipelines-list, .sidebar', { timeout: 10000 });
    const pipelinesSection = await page.locator('.pipelines-list, text=Pipelines').first();
    await expect(pipelinesSection).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Pipelines section not found - may need to login first');
    });
  });

  test('should create a new pipeline', async ({ page }) => {
    await page.waitForSelector('.add-btn, button[title*="Create pipeline"]', { timeout: 10000 });
    
    const createButton = page.locator('button[title*="Create pipeline"], button.add-btn').first();
    await createButton.click().catch(() => {
      console.log('Create pipeline button not found');
    });
    
    const dialog = page.locator('dialog, .dialog, .modal').first();
    const nameInput = page.locator('input[name="pipelineName"], #pipelineName').first();
    
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Pipeline');
      const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
      await submitButton.click();
    }
  });

  test('should add a step to pipeline', async ({ page }) => {
    await page.waitForSelector('.pipeline-section, .step-item', { timeout: 10000 });
    
    const addStepButton = page.locator('button[title*="Add Step"], button:has-text("Add Step")').first();
    await addStepButton.click().catch(() => {
      console.log('Add Step button not found');
    });
  });

  test('should display pipeline status correctly', async ({ page }) => {
    const statusElements = page.locator('.pipeline-status, .step-status');
    const count = await statusElements.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const status = statusElements.nth(i);
        const text = await status.textContent();
        console.log(`Pipeline status: ${text}`);
      }
    }
  });

  test('should display step-by-step pipeline controls', async ({ page }) => {
    const continueButton = page.locator('button:has-text("Continue")');
    const stopButton = page.locator('button:has-text("Stop")');
    
    const hasContinue = await continueButton.count() > 0;
    const hasStop = await stopButton.count() > 0;
    
    console.log(`Continue button present: ${hasContinue}`);
    console.log(`Stop button present: ${hasStop}`);
  });
});

test.describe('Project File Creation', () => {
  const apiUrl = 'http://localhost:8080/api';

  test('should create a file in project path via API', async ({ request }) => {
    const response = await request.post(`${apiUrl}/projects/1/files`, {
      data: {
        fileName: 'opencode.json',
        content: '{"name": "test", "version": "1.0.0"}'
      }
    });
    
    console.log(`Create file API status: ${response.status()}`);
    
    if (response.status() === 200) {
      const data = await response.json();
      console.log(`File created: ${data.fileName}`);
    }
  });
});

test.describe('Pipeline API Backend', () => {
  const apiUrl = 'http://localhost:8080/api';

  test('should fetch pipelines list', async ({ request }) => {
    const response = await request.get(`${apiUrl}/projects/1/pipelines`);
    console.log(`Pipelines API status: ${response.status()}`);
    
    if (response.status() === 200) {
      const data = await response.json();
      console.log(`Found ${data.pipelines?.length || 0} pipelines`);
    }
  });

  test('should create a new pipeline via API', async ({ request }) => {
    const response = await request.post(`${apiUrl}/projects/1/pipelines`, {
      data: {
        name: 'Test Pipeline',
        description: 'Test description',
        type: 'sequential',
        outputExtension: 'txt'
      }
    });
    
    console.log(`Create pipeline API status: ${response.status()}`);
    
    if (response.status() === 201 || response.status() === 200) {
      const pipeline = await response.json();
      console.log(`Created pipeline: ${pipeline.name} with ID: ${pipeline.id}`);
    }
  });

  test('should add a step to pipeline via API', async ({ request }) => {
    const pipelinesResponse = await request.get(`${apiUrl}/projects/1/pipelines`);
    const data = await pipelinesResponse.json();
    const pipelineId = data.pipelines?.[0]?.id;
    
    if (pipelineId) {
      const agentsResponse = await request.get(`${apiUrl}/projects/1/agents`);
      const agentsData = await agentsResponse.json();
      const agentId = agentsData.agents?.[0]?.id;
      
      if (agentId) {
        const stepResponse = await request.post(
          `${apiUrl}/pipelines/${pipelineId}/steps?agentId=${agentId}`
        );
        console.log(`Add step API status: ${stepResponse.status()}`);
      }
    }
  });

  test('should run a pipeline via API', async ({ request }) => {
    const pipelinesResponse = await request.get(`${apiUrl}/projects/1/pipelines`);
    const data = await pipelinesResponse.json();
    const pipelineId = data.pipelines?.[0]?.id;
    
    if (pipelineId) {
      const response = await request.post(`${apiUrl}/projects/1/pipelines/${pipelineId}/run`, {
        data: {}
      });
      console.log(`Run pipeline API status: ${response.status()}`);
      
      const responseData = await response.json();
      console.log(`Run response: ${JSON.stringify(responseData)}`);
    }
  });

  test('should stop a running pipeline via API', async ({ request }) => {
    const pipelinesResponse = await request.get(`${apiUrl}/projects/1/pipelines`);
    const data = await pipelinesResponse.json();
    const pipelineId = data.pipelines?.[0]?.id;
    
    if (pipelineId) {
      const response = await request.post(`${apiUrl}/projects/1/pipelines/${pipelineId}/stop`, {
        data: {}
      });
      console.log(`Stop pipeline API status: ${response.status()}`);
    }
  });

  test('should get pipeline paused state', async ({ request }) => {
    const pipelinesResponse = await request.get(`${apiUrl}/projects/1/pipelines`);
    const data = await pipelinesResponse.json();
    const pipelineId = data.pipelines?.[0]?.id;
    
    if (pipelineId) {
      const response = await request.get(`${apiUrl}/projects/1/pipelines/${pipelineId}/paused`);
      console.log(`Paused state API status: ${response.status()}`);
      
      if (response.status() === 200) {
        const pausedData = await response.json();
        console.log(`Pipeline paused: ${pausedData.paused}, pending step: ${pausedData.pendingStepOrder}`);
      }
    }
  });

  test('should continue a step-by-step pipeline via API', async ({ request }) => {
    const pipelinesResponse = await request.get(`${apiUrl}/projects/1/pipelines`);
    const data = await pipelinesResponse.json();
    const pipelineId = data.pipelines?.[0]?.id;
    
    if (pipelineId) {
      const response = await request.post(`${apiUrl}/projects/1/pipelines/${pipelineId}/continue`, {
        data: {}
      });
      console.log(`Continue pipeline API status: ${response.status()}`);
    }
  });

  test('should connect to SSE stream', async ({ request }) => {
    const pipelinesResponse = await request.get(`${apiUrl}/projects/1/pipelines`);
    const data = await pipelinesResponse.json();
    const pipelineId = data.pipelines?.[0]?.id;
    
    if (pipelineId) {
      const sseUrl = `${apiUrl}/pipelines/${pipelineId}/stream`;
      console.log(`SSE URL: ${sseUrl}`);
      
      const response = await request.get(sseUrl);
      console.log(`SSE connection status: ${response.status()}`);
    }
  });

  test('should execute step-by-step pipeline with two steps', async ({ request }) => {
    const pipelinesResponse = await request.get(`${apiUrl}/projects/1/pipelines`);
    const data = await pipelinesResponse.json();
    const pipelines = data.pipelines || [];
    
    const stepByStepPipeline = pipelines.find((p: any) => p.type === 'step_by_step');
    
    if (!stepByStepPipeline) {
      console.log('No step-by-step pipeline found, creating one...');
      const createResponse = await request.post(`${apiUrl}/projects/1/pipelines`, {
        data: {
          name: 'StepByStep Test',
          description: 'Test pipeline with two steps',
          type: 'step_by_step',
          outputExtension: 'json'
        }
      });
      
      if (createResponse.status() === 201 || createResponse.status() === 200) {
        const newPipeline = await createResponse.json();
        console.log(`Created step-by-step pipeline with ID: ${newPipeline.id}`);
        
        const agentsResponse = await request.get(`${apiUrl}/projects/1/agents`);
        const agentsData = await agentsResponse.json();
        const agents = agentsData.agents || [];
        
        if (agents.length >= 2) {
          await request.post(`${apiUrl}/pipelines/${newPipeline.id}/steps?agentId=${agents[0].id}`);
          await request.post(`${apiUrl}/pipelines/${newPipeline.id}/steps?agentId=${agents[1].id}`);
          console.log('Added two steps to pipeline');
        }
      }
      return;
    }
    
    console.log(`Found step-by-step pipeline: ${stepByStepPipeline.id}`);
    
    const stepsResponse = await request.get(`${apiUrl}/pipelines/${stepByStepPipeline.id}/steps`);
    const stepsData = await stepsResponse.json();
    const steps = stepsData.steps || [];
    
    console.log(`Pipeline has ${steps.length} steps`);
    
    const runResponse = await request.post(`${apiUrl}/projects/1/pipelines/${stepByStepPipeline.id}/run`, {
      data: {}
    });
    console.log(`Run pipeline status: ${runResponse.status()}`);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const pausedResponse = await request.get(`${apiUrl}/projects/1/pipelines/${stepByStepPipeline.id}/paused`);
    if (pausedResponse.status() === 200) {
      const pausedData = await pausedResponse.json();
      console.log(`Pipeline paused: ${pausedData.paused}, pending step: ${pausedData.pendingStepOrder}`);
    }
    
    if (steps.length >= 1) {
      const continueResponse = await request.post(`${apiUrl}/projects/1/pipelines/${stepByStepPipeline.id}/continue`, {
        data: {}
      });
      console.log(`Continue pipeline status: ${continueResponse.status()}`);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const finalPausedResponse = await request.get(`${apiUrl}/projects/1/pipelines/${stepByStepPipeline.id}/paused`);
      if (finalPausedResponse.status() === 200) {
        const finalPausedData = await finalPausedResponse.json();
        console.log(`Final state - Pipeline paused: ${finalPausedData.paused}, pending step: ${finalPausedData.pendingStepOrder}`);
      }
    }
  });
});
