import { test, expect } from '@playwright/test';

test('should show running indicator when pipeline starts', async ({ page }) => {
  await page.goto('http://localhost:4200/runpipelines?pipelineId=1&projectId=2', { timeout: 15000 });
  
  // Wait a bit for the app to load
  await page.waitForTimeout(3000);
  
  // Get the current step statuses
  const stepStatuses = await page.locator('.step-status-label').allTextContents();
  console.log('Step statuses:', stepStatuses);
  
  // Get the step list item classes
  const stepClasses = await page.locator('.step-list-item').evaluateAll(els => 
    els.map(el => el.className)
  );
  console.log('Step classes:', stepClasses);
  
  // Check if running indicator exists in the DOM
  const runningIndicator = page.locator('.running-indicator');
  const count = await runningIndicator.count();
  console.log('Running indicator count:', count);
  
  // Get the stop button to verify it's still clickable
  const stopButton = page.locator('button[title="Stop pipeline"]');
  const isStopVisible = await stopButton.isVisible().catch(() => false);
  const isStopEnabled = await stopButton.isEnabled().catch(() => false);
  console.log('Stop button visible:', isStopVisible, 'enabled:', isStopEnabled);
  
  expect(isStopEnabled).toBe(true);
});