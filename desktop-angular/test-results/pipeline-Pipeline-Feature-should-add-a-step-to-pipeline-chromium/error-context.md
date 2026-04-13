# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pipeline.spec.ts >> Pipeline Feature >> should add a step to pipeline
- Location: e2e\pipeline.spec.ts:40:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('.pipeline-section, .step-item') to be visible

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img [ref=e7]:
      - generic [ref=e9]: </>
    - heading "Agentic" [level=1] [ref=e10]
  - paragraph [ref=e11]: Build and manage AI agents for code flow
  - generic [ref=e12]:
    - button "Project" [ref=e14] [cursor=pointer]:
      - img [ref=e15]: folder
      - generic [ref=e16]: Project
      - img [ref=e17]: arrow_drop_down
    - button "Agents" [ref=e18] [cursor=pointer]:
      - img [ref=e19]: smart_toy
      - generic [ref=e20]: Agents
    - button "Config" [ref=e21] [cursor=pointer]:
      - img [ref=e22]: build
      - generic [ref=e23]: Config
    - button "Exit" [ref=e24] [cursor=pointer]:
      - img [ref=e25]: exit_to_app
      - generic [ref=e26]: Exit
  - generic [ref=e27]:
    - paragraph [ref=e28]: Version 1.0.0
    - generic [ref=e29]:
      - generic [ref=e30] [cursor=pointer]: Documentation
      - generic [ref=e31]: ·
      - generic [ref=e32] [cursor=pointer]: Help
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Pipeline Feature', () => {
  4   |   const baseUrl = 'http://localhost:4200';
  5   | 
  6   |   test.beforeEach(async ({ page }) => {
  7   |     await page.goto(baseUrl);
  8   |   });
  9   | 
  10  |   test('should load the application and navigate to project', async ({ page }) => {
  11  |     await expect(page).toHaveTitle(/agentic/i);
  12  |   });
  13  | 
  14  |   test('should display pipelines section in sidebar', async ({ page }) => {
  15  |     await page.waitForSelector('.pipelines-list, .sidebar', { timeout: 10000 });
  16  |     const pipelinesSection = await page.locator('.pipelines-list, text=Pipelines').first();
  17  |     await expect(pipelinesSection).toBeVisible({ timeout: 5000 }).catch(() => {
  18  |       console.log('Pipelines section not found - may need to login first');
  19  |     });
  20  |   });
  21  | 
  22  |   test('should create a new pipeline', async ({ page }) => {
  23  |     await page.waitForSelector('.add-btn, button[title*="Create pipeline"]', { timeout: 10000 });
  24  |     
  25  |     const createButton = page.locator('button[title*="Create pipeline"], button.add-btn').first();
  26  |     await createButton.click().catch(() => {
  27  |       console.log('Create pipeline button not found');
  28  |     });
  29  |     
  30  |     const dialog = page.locator('dialog, .dialog, .modal').first();
  31  |     const nameInput = page.locator('input[name="pipelineName"], #pipelineName').first();
  32  |     
  33  |     if (await nameInput.isVisible()) {
  34  |       await nameInput.fill('Test Pipeline');
  35  |       const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
  36  |       await submitButton.click();
  37  |     }
  38  |   });
  39  | 
  40  |   test('should add a step to pipeline', async ({ page }) => {
> 41  |     await page.waitForSelector('.pipeline-section, .step-item', { timeout: 10000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  42  |     
  43  |     const addStepButton = page.locator('button[title*="Add Step"], button:has-text("Add Step")').first();
  44  |     await addStepButton.click().catch(() => {
  45  |       console.log('Add Step button not found');
  46  |     });
  47  |   });
  48  | 
  49  |   test('should display pipeline status correctly', async ({ page }) => {
  50  |     const statusElements = page.locator('.pipeline-status, .step-status');
  51  |     const count = await statusElements.count();
  52  |     
  53  |     if (count > 0) {
  54  |       for (let i = 0; i < count; i++) {
  55  |         const status = statusElements.nth(i);
  56  |         const text = await status.textContent();
  57  |         console.log(`Pipeline status: ${text}`);
  58  |       }
  59  |     }
  60  |   });
  61  | 
  62  |   test('should display step-by-step pipeline controls', async ({ page }) => {
  63  |     const continueButton = page.locator('button:has-text("Continue")');
  64  |     const stopButton = page.locator('button:has-text("Stop")');
  65  |     
  66  |     const hasContinue = await continueButton.count() > 0;
  67  |     const hasStop = await stopButton.count() > 0;
  68  |     
  69  |     console.log(`Continue button present: ${hasContinue}`);
  70  |     console.log(`Stop button present: ${hasStop}`);
  71  |   });
  72  | });
  73  | 
  74  | test.describe('Project File Creation', () => {
  75  |   const apiUrl = 'http://localhost:8080/api';
  76  | 
  77  |   test('should create a file in project path via API', async ({ request }) => {
  78  |     const response = await request.post(`${apiUrl}/projects/1/files`, {
  79  |       data: {
  80  |         fileName: 'opencode.json',
  81  |         content: '{"name": "test", "version": "1.0.0"}'
  82  |       }
  83  |     });
  84  |     
  85  |     console.log(`Create file API status: ${response.status()}`);
  86  |     
  87  |     if (response.status() === 200) {
  88  |       const data = await response.json();
  89  |       console.log(`File created: ${data.fileName}`);
  90  |     }
  91  |   });
  92  | });
  93  | 
  94  | test.describe('Pipeline API Backend', () => {
  95  |   const apiUrl = 'http://localhost:8080/api';
  96  | 
  97  |   test('should fetch pipelines list', async ({ request }) => {
  98  |     const response = await request.get(`${apiUrl}/projects/1/pipelines`);
  99  |     console.log(`Pipelines API status: ${response.status()}`);
  100 |     
  101 |     if (response.status() === 200) {
  102 |       const data = await response.json();
  103 |       console.log(`Found ${data.pipelines?.length || 0} pipelines`);
  104 |     }
  105 |   });
  106 | 
  107 |   test('should create a new pipeline via API', async ({ request }) => {
  108 |     const response = await request.post(`${apiUrl}/projects/1/pipelines`, {
  109 |       data: {
  110 |         name: 'Test Pipeline',
  111 |         description: 'Test description',
  112 |         type: 'sequential',
  113 |         outputExtension: 'txt'
  114 |       }
  115 |     });
  116 |     
  117 |     console.log(`Create pipeline API status: ${response.status()}`);
  118 |     
  119 |     if (response.status() === 201 || response.status() === 200) {
  120 |       const pipeline = await response.json();
  121 |       console.log(`Created pipeline: ${pipeline.name} with ID: ${pipeline.id}`);
  122 |     }
  123 |   });
  124 | 
  125 |   test('should add a step to pipeline via API', async ({ request }) => {
  126 |     const pipelinesResponse = await request.get(`${apiUrl}/projects/1/pipelines`);
  127 |     const data = await pipelinesResponse.json();
  128 |     const pipelineId = data.pipelines?.[0]?.id;
  129 |     
  130 |     if (pipelineId) {
  131 |       const agentsResponse = await request.get(`${apiUrl}/projects/1/agents`);
  132 |       const agentsData = await agentsResponse.json();
  133 |       const agentId = agentsData.agents?.[0]?.id;
  134 |       
  135 |       if (agentId) {
  136 |         const stepResponse = await request.post(
  137 |           `${apiUrl}/pipelines/${pipelineId}/steps?agentId=${agentId}`
  138 |         );
  139 |         console.log(`Add step API status: ${stepResponse.status()}`);
  140 |       }
  141 |     }
```