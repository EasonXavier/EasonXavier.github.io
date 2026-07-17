const { defineConfig, devices } = require('@playwright/test');

const edgeDevice = (name, deviceName) => ({
  name,
  use: {
    ...devices[deviceName],
    browserName: 'chromium',
    channel: 'msedge',
  },
});

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
  projects: [
    edgeDevice('Desktop Edge', 'Desktop Chrome'),
    edgeDevice('iPhone 17 Pro', 'iPhone 17 Pro'),
    edgeDevice('iPhone 17 Pro - Landscape', 'iPhone 17 Pro landscape'),
    edgeDevice('iPhone 17 Pro Max', 'iPhone 17 Pro Max'),
    edgeDevice('iPhone 17 Pro Max - Landscape', 'iPhone 17 Pro Max landscape'),
    edgeDevice('iPad Pro 11', 'iPad Pro 11'),
    edgeDevice('iPad Pro 11 - Landscape', 'iPad Pro 11 landscape'),
    edgeDevice('iPad 11th Gen', 'iPad (gen 11)'),
    edgeDevice('iPad 11th Gen - Landscape', 'iPad (gen 11) landscape'),
    edgeDevice('iPad mini', 'iPad Mini'),
    edgeDevice('iPad mini - Landscape', 'iPad Mini landscape'),
  ],
});
