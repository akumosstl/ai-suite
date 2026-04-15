import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const screenshotsDir = path.join(process.cwd(), 'e2e', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Pipeline SSE Real-time Updates', () => {
  const apiUrl = 'http://localhost:8080/api';
  const frontendUrl = 'http://localhost:4200';

  test('should complete pipeline run with SSE updates', async ({ page, request }) => {
    console.log('=== Starting Pipeline SSE Test ===');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    await page.goto(frontendUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, `${timestamp}-01-initial-load.png`) });
    console.log('Screenshot: Initial load');

    const pipelinesResponse = await request.get(`${apiUrl}/projects/1/pipelines`);
    console.log(`API Status - Get pipelines: ${pipelinesResponse.status()}`);
    
    const data = await pipelinesResponse.json();
    const pipelines = data.pipelines || [];
    console.log(`Found ${pipelines.length} pipelines`);
    
    const testPipeline = pipelines.find((p: any) => p.id === 4);
    
    if (!testPipeline) {
      console.log('Pipeline with ID 4 not found, using first available pipeline');
    }
    
    const pipelineId = testPipeline?.id || pipelines[0]?.id;
    
    if (!pipelineId) {
      throw new Error('No pipeline found to test');
    }
    
    console.log(`Testing with pipeline ID: ${pipelineId}`);
    await page.screenshot({ path: path.join(screenshotsDir, `${timestamp}-02-pipeline-selected.png`) });
    console.log('Screenshot: Pipeline selected');

    const runResponse = await request.post(`${apiUrl}/pipelines/${pipelineId}/runs`);
    console.log(`API Status - Create run: ${runResponse.status()}`);
    
    const runData = await runResponse.json();
    console.log(`Run created with ID: ${runData.id}, status: ${runData.status}`);
    console.log(`Run details: ${JSON.stringify(runData, null, 2)}`);
    
    await page.screenshot({ path: path.join(screenshotsDir, `${timestamp}-03-run-created.png`) });
    console.log('Screenshot: Run created');

    const runPageUrl = `${frontendUrl}/runpipelines?pipelineId=${pipelineId}&projectId=1`;
    await page.goto(runPageUrl);
    await page.waitForLoadState('networkidle');
    
    console.log(`Navigated to: ${runPageUrl}`);
    await page.screenshot({ path: path.join(screenshotsDir, `${timestamp}-04-runpipelines-page.png`) });
    console.log('Screenshot: Run pipelines page loaded');

    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: path.join(screenshotsDir, `${timestamp}-05-after-wait.png`) });
    console.log('Screenshot: After 3 second wait');

    console.log('\n--- Console Messages ---');
    consoleMessages.forEach(msg => console.log(msg));
    console.log('------------------------\n');

    const runningIndicator = page.locator('.running-indicator, .spinning');
    const isRunningVisible = await runningIndicator.count() > 0 && await runningIndicator.first().isVisible().catch(() => false);
    
    console.log(`Running indicator visible: ${isRunningVisible}`);

    const stepItems = page.locator('.step-list-item, .pipeline-step');
    const stepCount = await stepItems.count();
    console.log(`Found ${stepCount} steps`);

    await page.screenshot({ path: path.join(screenshotsDir, `${timestamp}-06-final-state.png`) });
    console.log('Screenshot: Final state');

    console.log('\n=== Test Summary ===');
    console.log(`- Pipeline ID: ${pipelineId}`);
    console.log(`- Run ID: ${runData.id}`);
    console.log(`- Initial Run Status: ${runData.status}`);
    console.log(`- Steps Found: ${stepCount}`);
    console.log(`- Running Indicator: ${isRunningVisible ? 'visible' : 'not visible'}`);
    console.log('=====================\n');

    const runStatusResponse = await request.get(`${apiUrl}/pipeline-runs/${runData.id}`);
    const finalRunData = await runStatusResponse.json();
    console.log(`Final run status from API: ${finalRunData.status}`);
    
    await page.screenshot({ path: path.join(screenshotsDir, `${timestamp}-07-complete.png`) });
    console.log('Screenshot: Complete');
  });

  test('should verify SSE connection', async ({ page, request }) => {
    console.log('=== Testing SSE Connection ===');
    
    const apiUrl = 'http://localhost:8080/api';
    
    const runResponse = await request.post(`${apiUrl}/pipelines/4/runs`);
    const runData = await runResponse.json();
    console.log(`Created run ID: ${runData.id}`);
    
    const sseUrl = `${apiUrl}/pipeline-runs/${runData.id}/stream`;
    console.log(`Testing SSE URL: ${sseUrl}`);
    
    const sseResponse = await request.get(sseUrl, { timeout: 5000 }).catch(() => null);
    if (sseResponse) {
      console.log(`SSE Connection Status: ${sseResponse.status()}`);
    } else {
      console.log('SSE Connection: Failed (timeout or error)');
    }
  });

  test('should navigate to runpipelines page and check for infinite loading', async ({ page }) => {
    console.log('=== Testing Infinite Loading Issue ===');
    
    const frontendUrl = 'http://localhost:4200';
    const runPageUrl = `${frontendUrl}/runpipelines?pipelineId=4&projectId=1`;
    
    await page.goto(runPageUrl);
    await page.waitForLoadState('networkidle');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({ path: path.join(screenshotsDir, `${timestamp}-infinite-loading-test.png`) });
    
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: path.join(screenshotsDir, `${timestamp}-infinite-loading-5s-later.png`) });
    
    const consoleOutput: string[] = [];
    page.on('console', msg => consoleOutput.push(msg.text()));
    
    await page.waitForTimeout(2000);
    
    console.log('Console output after 7 seconds:');
    consoleOutput.forEach(msg => console.log(msg));
    
    console.log('\n=== Checking for infinite loading ===');
    const spinner = page.locator('.spinning, .running-indicator');
    const spinnerCount = await spinner.count();
    console.log(`Spinner elements found: ${spinnerCount}`);
  });
});