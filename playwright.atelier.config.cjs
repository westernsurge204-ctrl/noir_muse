const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
 testDir: './tests/atelier',
 timeout: 30000,
 use: { ...devices['Desktop Chrome'], headless: true },
 projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
            { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }],
 reporter: 'list'
});
