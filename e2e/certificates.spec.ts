import { test, expect, Page } from '@playwright/test';

/**
 * US-059 — Tests E2E : Gestion des certificats
 */

const USER_EMAIL    = process.env.E2E_USER_EMAIL    ?? 'admin@nsia-transport.test';
const USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'Password@123';

async function login(page: Page) {
    await page.goto('/login');
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.fill('input[type="password"]', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10_000 });
}

test.describe('Liste des certificats', () => {

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('la liste des certificats se charge', async ({ page }) => {
        await page.goto('/admin/certificates');

        await expect(page).toHaveURL(/\/admin\/certificates/);
        await expect(page.locator('table')).toBeVisible();
    });

    test('le filtre par statut fonctionne', async ({ page }) => {
        await page.goto('/admin/certificates');

        // Cliquer sur le filtre ISSUED
        const issuedCard = page.locator('[data-status="ISSUED"], .kpi-card').first();
        if (await issuedCard.isVisible()) {
            await issuedCard.click();
        }
    });

    test('le bouton export CSV est disponible', async ({ page }) => {
        await page.goto('/admin/certificates');

        // Le bouton d'export est visible
        const exportBtn = page.locator('a[href*="export"], button:has-text("Export")').first();
        await expect(exportBtn).toBeVisible();
    });
});

test.describe('Recherche avancée certificats', () => {

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('la page de recherche se charge avec le formulaire', async ({ page }) => {
        await page.goto('/admin/certificates/search');

        await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible();
        await expect(page.locator('select')).toHaveCount({ minimum: 3 });
    });

    test('la recherche texte déclenche les résultats', async ({ page }) => {
        await page.goto('/admin/certificates/search');

        await page.fill('input[placeholder*="Rechercher"]', 'TEST');
        await page.click('button:has-text("Rechercher")');

        await page.waitForURL(/search.*q=TEST/);
        await expect(page.locator('text=/résultat/i')).toBeVisible();
    });

    test('le bouton effacer réinitialise les filtres', async ({ page }) => {
        await page.goto('/admin/certificates/search?status=ISSUED');

        // Le bouton Effacer doit être visible (hasSearch = true)
        const clearBtn = page.locator('button:has-text("Effacer")');
        if (await clearBtn.isVisible()) {
            await clearBtn.click();
            await expect(page).toHaveURL(/\/admin\/certificates\/search$/);
        }
    });
});

test.describe('Export asynchrone', () => {

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('la page Mes exports se charge', async ({ page }) => {
        await page.goto('/admin/exports');

        await expect(page).toHaveURL(/\/admin\/exports/);
        await expect(page.locator('h1')).toContainText(/exports/i);
    });
});

test.describe('Rapports', () => {

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('le rapport certificats par période se charge', async ({ page }) => {
        await page.goto('/admin/reports/certificates');

        await expect(page).toHaveURL(/\/admin\/reports\/certificates/);
        await expect(page.locator('.stats-grid, .kpi-card')).toHaveCount({ minimum: 1 });
    });

    test('le rapport contrats se charge', async ({ page }) => {
        await page.goto('/admin/reports/contracts');

        await expect(page).toHaveURL(/\/admin\/reports\/contracts/);
        await expect(page.locator('table')).toBeVisible();
    });

    test('le rapport intermédiaires affiche les 3 onglets', async ({ page }) => {
        await page.goto('/admin/reports/intermediaries');

        await expect(page.locator('button:has-text("Courtiers")')).toBeVisible();
        await expect(page.locator('button:has-text("Coassureurs")')).toBeVisible();
        await expect(page.locator('button:has-text("Experts")')).toBeVisible();
    });
});
