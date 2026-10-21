import fs from 'fs';
import { defineConfig } from '@playwright/test';
// Cloud dev boxes ship Chromium at /opt/pw-browsers; CI uses the browser from `playwright install`.
const executablePath = process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
export default defineConfig({
  testDir: 'e2e', timeout: 60_000, workers: 1, retries: 0,
  use: { baseURL: 'http://localhost:3100', launchOptions: { executablePath } },
  projects: [{ name: 'desktop', use: { viewport: { width: 1280, height: 800 } } }, { name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true } }],
  webServer: { command: 'rm -f /tmp/ccar-e2e.db* && CCAR_DB=/tmp/ccar-e2e.db npx next start -p 3100', url: 'http://localhost:3100', reuseExistingServer: false, timeout: 60_000 },
});
