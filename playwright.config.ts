import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация реального browser smoke-набора.
 *
 * Vite запускается только на loopback-интерфейсе, поэтому проверка не открывает
 * dev-сервер в локальную сеть. Повторы в CI исключают случайный успех при
 * неинициализированных canvas/Web Audio API.
 */
export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'dot',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
