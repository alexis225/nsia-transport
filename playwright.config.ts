import { defineConfig, devices } from '@playwright/test';

/**
 * US-059 — Configuration Playwright E2E
 * Lancer : npx playwright test
 * Lancer avec UI : npx playwright test --ui
 * Voir rapport : npx playwright show-report
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false, // séquentiel pour éviter les conflits DB
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
    ],

    use: {
        baseURL: process.env.APP_URL ?? 'http://localhost:8000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'off',
        // Ignorer les erreurs de certificat SSL en local
        ignoreHTTPSErrors: true,
        // Délai par défaut pour les assertions
        actionTimeout: 10_000,
        navigationTimeout: 30_000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Démarrage optionnel du serveur local (commenter si déjà lancé)
    // webServer: {
    //     command: 'php artisan serve --port=8000',
    //     port: 8000,
    //     reuseExistingServer: true,
    // },
});
