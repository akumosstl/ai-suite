import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

interface ScreenshotConfig {
  name: string;
  route: string;
  waitFor?: string;
  action?: string;
}

const SCREENSHOTS: ScreenshotConfig[] = [
  { name: 'menu', route: '/menu', waitFor: 'app-menu' },
  { name: 'agents', route: '/agents', waitFor: 'app-agents' },
  { name: 'scripts', route: '/scripts', waitFor: 'app-scripts' },
  { name: 'skills', route: '/skills', waitFor: 'app-skills' },
  { name: 'commands', route: '/commands', waitFor: 'app-commands' },
  { name: 'instructions', route: '/instructions', waitFor: 'app-instructions' },
  { name: 'plugins', route: '/plugins', waitFor: 'app-plugins' },
  { name: 'tools', route: '/tools', waitFor: 'app-tools' },
  { name: 'config', route: '/config', waitFor: 'app-config' },
  { name: 'templates', route: '/templates', waitFor: 'app-templates' },
  { name: 'namespaces', route: '/namespaces', waitFor: 'app-namespaces' },
  { name: 'project', route: '/project', waitFor: 'app-project' },
  { name: 'pipelines', route: '/pipelines', waitFor: 'app-pipelines' },
  { name: 'runpipelines', route: '/runpipelines', waitFor: 'app-runpipelines' },
  { name: 'pipeline-run-history', route: '/pipeline-run-history', waitFor: 'app-pipeline-run-history' },
];

const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'screenshots');
const BASE_URL = process.env.SCREENSHOT_URL || 'http://localhost:4200';

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function waitForElement(page: Page, selector: string, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
  } catch {
    console.log(`Warning: Element ${selector} not found, taking screenshot anyway`);
  }
}

async function captureScreenshot(page: Page, name: string, route: string, waitFor?: string) {
  const url = `${BASE_URL}${route}`;
  console.log(`Capturing: ${name} (${url})`);
  
  await page.goto(url, { waitUntil: 'networkidle' });
  
  if (waitFor) {
    await waitForElement(page, waitFor);
  }
  
  await page.waitForTimeout(1000);
  
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Saved: ${filePath}`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npx tsx scripts/capture-screenshots.ts [options]

Options:
  --help, -h       Show this help
  --url URL        Base URL (default: http://localhost:4200)
  --out DIR        Output directory (default: docs/screenshots)
  --name NAME      Capture only specific screenshot by name

Examples:
  npx tsx scripts/capture-screenshots.ts
  npx tsx scripts/capture-screenshots.ts --url http://localhost:8080
  npx tsx scripts/capture-screenshots.ts --name agents
`);
    return;
  }
  
  const urlArg = args.findIndex(a => a === '--url');
  const outArg = args.findIndex(a => a === '--out');
  const nameArg = args.findIndex(a => a === '--name');
  
  const customUrl = urlArg !== -1 ? args[urlArg + 1] : null;
  const customOut = outArg !== -1 ? args[outArg + 1] : null;
  const captureName = nameArg !== -1 ? args[nameArg + 1] : null;
  
  const outputDir = customOut || OUTPUT_DIR;
  ensureDir(outputDir);
  
  if (customUrl) {
    process.env.SCREENSHOT_URL = customUrl;
  }
  
  console.log(`Starting browser...`);
  console.log(`Output: ${outputDir}`);
  console.log(`URL: ${customUrl || BASE_URL}`);
  console.log('');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  
  try {
    const toCapture = captureName 
      ? SCREENSHOTS.filter(s => s.name === captureName)
      : SCREENSHOTS;
    
    for (const screenshot of toCapture) {
      await captureScreenshot(page, screenshot.name, screenshot.route, screenshot.waitFor);
    }
    
    console.log('');
    console.log('Done!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);