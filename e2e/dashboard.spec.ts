import { test, expect, Page } from '@playwright/test';

/**
 * US-059 — Tests E2E : Dashboard & navigation
 */

const USER_EMAIL    = process.env.E2E_USER_EMAIL    ?? 'admin@nsia-transport.test';
const USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'Password@123';

// Helper — login avant chaque test
async function login(page: Page) {
    await page.goto('/login');
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.fill('input[type="password"]', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10_000 });
}

test.describe('Dashboard principal', () => {

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('le dashboard charge avec les 4 KPI cards', async ({ page }) => {
        await expect(page.locator('.kpi-card')).toHaveCount(4);
    });

    test('le graphique mensuel est visible', async ({ page }) => {
        await expect(page.locator('.chart-card').first()).toBeVisible();
        await expect(page.locator('.bars')).toBeVisible();
    });

    test('la table des certificats récents est visible', async ({ page }) => {
        await expect(page.locator('.tbl-card')).toBeVisible();
    });

    test('le lien "KPIs détaillés" navigue vers /admin/dashboard/kpi', async ({ page }) => {
        await page.click('a[href*="/admin/dashboard/kpi"]');
        await expect(page).toHaveURL(/\/admin\/dashboard\/kpi/);
    });
});

test.describe('Dashboard KPIs filiale', () => {

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('la page KPIs charge avec les sections principales', async ({ page }) => {
        await page.goto('/admin/dashboard/kpi');

        await expect(page).toHaveURL(/\/admin\/dashboard\/kpi/);
        // Vérifier qu'il y a bien des KPI cards
        await expect(page.locator('.kpi-panel').first()).toBeVisible();
    });

    test('le bar chart SVG est rendu', async ({ page }) => {
        await page.goto('/admin/dashboard/kpi');
        await expect(page.locator('svg rect').first()).toBeVisible();
    });
});

test.describe('Navigation sidebar', () => {

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('la sidebar est visible', async ({ page }) => {
        await expect(page.locator('[data-slot="sidebar"]')).toBeVisible();
    });

    test('le lien Certificats navigue correctement', async ({ page }) => {
        await page.click('a[href*="/admin/certificates"]');
        await expect(page).toHaveURL(/\/admin\/certificates/);
        await expect(page.locator('h1, h2')).toContainText(/certificat/i);
    });

    test('la recherche avancée est accessible depuis la sidebar', async ({ page }) => {
        await page.goto('/admin/certificates/search');
        await expect(page).toHaveURL(/\/admin\/certificates\/search/);
        await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible();
    });
});
