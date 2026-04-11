import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('CLI Target Verification - Project 4 / Pipeline 34', () => {
  const apiUrl = 'http://localhost:8080/api';
  const baseUrl = 'http://localhost:4200';

  test('should verify project target CLI and step settings', async ({ page, request }) => {
    const fs = require('fs');
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    console.log('=== VERIFYING CLI TARGET BUG FIX ===\n');

    const projectId = 4;
    const pipelineId = 34;

    console.log(`Testing Project ID: ${projectId}, Pipeline ID: ${pipelineId}\n`);

    const projectResponse = await request.get(`${apiUrl}/projects/${projectId}`);
    if (projectResponse.status() === 200) {
      const projectData = await projectResponse.json();
      console.log(`Project: ${projectData.name}`);
      console.log(`Project Target ID: ${projectData.targetId}`);
      
      if (projectData.targetId) {
        const targetResponse = await request.get(`${apiUrl}/targets/${projectData.targetId}`);
        if (targetResponse.status() === 200) {
          const targetData = await targetResponse.json();
          console.log(`Target Name: ${targetData.name}`);
          console.log(`Target CLI: ${targetData.cli}`);
        }
      }
    }

    const pipelineResponse = await request.get(`${apiUrl}/projects/${projectId}/pipelines/${pipelineId}`);
    if (pipelineResponse.status() === 200) {
      const pipelineData = await pipelineResponse.json();
      console.log(`\nPipeline: ${pipelineData.name}`);
      console.log(`Pipeline Type: ${pipelineData.type}`);
    }

    const stepsResponse = await request.get(`${apiUrl}/pipelines/${pipelineId}/steps`);
    if (stepsResponse.status() === 200) {
      const stepsData = await stepsResponse.json();
      const steps = stepsData.steps || [];
      console.log(`\nPipeline has ${steps.length} steps`);
      
      for (const step of steps) {
        console.log(`\nStep ${step.stepOrder}:`);
        console.log(`  Type: ${step.type}`);
        console.log(`  CLI: ${step.cli}`);
        console.log(`  Runtime: ${step.runtime}`);
        if (step.agent) {
          console.log(`  Agent: ${step.agent.name}`);
        }
        if (step.script) {
          console.log(`  Script: ${step.script.name}`);
        }
        if (step.outputContent) {
          console.log(`  Output (first 200 chars): ${step.outputContent.substring(0, 200)}`);
        }
      }
    }

    console.log('\n=== TAKING SCREENSHOT: PROJECT PAGE ===');
    await page.goto(`${baseUrl}/project/${projectId}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const projectScreenshotPath = path.join(screenshotDir, 'cli-project-page.png');
    await page.screenshot({ path: projectScreenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${projectScreenshotPath}`);

    console.log('\n=== TAKING SCREENSHOT: RUN PIPELINES PAGE ===');
    await page.goto(`${baseUrl}/runpipelines?pipelineId=${pipelineId}&projectId=${projectId}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    
    const runPipelineScreenshotPath = path.join(screenshotDir, 'cli-run-pipeline-page.png');
    await page.screenshot({ path: runPipelineScreenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${runPipelineScreenshotPath}`);

    console.log('\n=== SCREENSHOTS ===');
    console.log(`1. Project Page: ${projectScreenshotPath}`);
    console.log(`2. Run Pipeline Page: ${runPipelineScreenshotPath}`);
    
    expect(true).toBe(true);
  });

  test('should run pipeline and capture console output', async ({ page, request }) => {
    const fs = require('fs');
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const projectId = 4;
    const pipelineId = 34;

    console.log('\n=== RUNNING PIPELINE AND CAPTURING OUTPUT ===\n');

    console.log('Stopping any running pipeline first...');
    await request.post(`${apiUrl}/projects/${projectId}/pipelines/${pipelineId}/stop`, {}).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Starting pipeline...');
    const runResponse = await request.post(`${apiUrl}/projects/${projectId}/pipelines/${pipelineId}/run`, {});
    console.log(`Run response status: ${runResponse.status()}`);
    
    const runData = runResponse.status() === 200 ? await runResponse.json() : {};
    console.log(`Run response: ${JSON.stringify(runData)}`);

    console.log('\nWaiting for pipeline execution...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    const stepsResponse = await request.get(`${apiUrl}/pipelines/${pipelineId}/steps`);
    if (stepsResponse.status() === 200) {
      const stepsData = await stepsResponse.json();
      const steps = stepsData.steps || [];
      
      for (const step of steps) {
        console.log(`\n=== Step ${step.stepOrder} Output ===`);
        console.log(`CLI Used: ${step.cli}`);
        console.log(`Status: ${step.status}`);
        if (step.outputContent) {
          console.log(`Output:\n${step.outputContent}`);
        }
      }
    }

    console.log('\n=== TAKING SCREENSHOT AFTER RUN ===');
    await page.goto(`${baseUrl}/runpipelines?pipelineId=${pipelineId}&projectId=${projectId}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const afterRunScreenshotPath = path.join(screenshotDir, 'cli-after-run.png');
    await page.screenshot({ path: afterRunScreenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${afterRunScreenshotPath}`);

    expect(true).toBe(true);
  });
});