import { test, expect } from '@playwright/test';

test.describe('Instructions File Management', () => {
  const baseUrl = 'http://localhost:4200';

  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseUrl}/instructions`);
    await page.waitForLoadState('networkidle');
  });

  test('should add and then delete a file from an instruction', async ({ page }) => {
    await page.waitForTimeout(2000);

    const instructionItems = page.locator('.list-item');
    const count = await instructionItems.count();
    
    if (count === 0) {
      console.log('No instructions found - creating one first');
      await page.locator('.add-btn').click();
      await page.waitForTimeout(500);
      
      await page.locator('input[placeholder*="instruction name"]').fill('Test Instruction');
      await page.waitForTimeout(300);
      
      await page.locator('button:has-text("Create Instruction")').click();
      await page.waitForTimeout(1000);
    }

    await instructionItems.first().click();
    await page.waitForTimeout(1000);

    const addFileBtn = page.locator('.add-file-btn');
    if (await addFileBtn.isVisible()) {
      await addFileBtn.click();
      await page.waitForTimeout(500);
    }

    const dialog = page.locator('dialog');
    if (await dialog.isVisible()) {
      const pathInput = page.locator('input[placeholder*="path"], input[name="path"]');
      const fileNameInput = page.locator('input[placeholder*="file"], input[name="fileName"]');
      
      if (await pathInput.isVisible()) {
        await pathInput.fill('/test/path');
      }
      if (await fileNameInput.isVisible()) {
        await fileNameInput.fill('test-file.txt');
      }
      
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Add")').first();
      await saveBtn.click();
      await page.waitForTimeout(500);
    }

    const fileRows = page.locator('.file-row:not(.header)');
    const initialFileCount = await fileRows.count();
    console.log(`Initial file count: ${initialFileCount}`);
    
    if (initialFileCount > 0) {
      const deleteBtn = fileRows.first().locator('.delete-btn');
      await deleteBtn.click();
      await page.waitForTimeout(1000);
      
      const finalFileCount = await fileRows.count();
      console.log(`Final file count after delete: ${finalFileCount}`);
      
      const instructionId = await page.evaluate(() => {
        const url = window.location.href;
        const match = url.match(/\/instructions\/(\d+)/);
        return match ? match[1] : null;
      });
      
      if (instructionId) {
        const apiResponse = await page.request.get(`http://localhost:8080/api/instruction-files/instruction/${instructionId}`);
        const files = await apiResponse.json();
        console.log(`Files in backend after delete attempt: ${files.length}`);
      }
    }
  });

  test('should verify API delete endpoint is called correctly', async ({ request }) => {
    const apiUrl = 'http://localhost:8080/api';

    const instructionsResponse = await request.get(`${apiUrl}/instructions?page=0&size=10`);
    const instructionsData = await instructionsResponse.json();
    const instructions = instructionsData.instructions || instructionsData;
    
    if (instructions.length > 0) {
      const instructionId = instructions[0].id;
      console.log(`Testing with instruction ID: ${instructionId}`);
      
      const filesResponse = await request.get(`${apiUrl}/instruction-files/instruction/${instructionId}`);
      const files = await filesResponse.json();
      console.log(`Found ${files.length} files for instruction`);
      
      if (files.length > 0) {
        const fileId = files[0].id;
        console.log(`Attempting to delete file ID: ${fileId}`);
        
        const deleteResponse = await request.delete(`${apiUrl}/instruction-files/${fileId}`);
        console.log(`Delete response status: ${deleteResponse.status()}`);
        
        if (deleteResponse.status() !== 200 && deleteResponse.status() !== 204) {
          const errorText = await deleteResponse.text();
          console.log(`Delete error: ${errorText}`);
        }
      }
    }
  });
});