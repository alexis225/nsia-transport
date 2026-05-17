import { test, expect } from '@playwright/test';

/**
 * US-059 — Tests E2E : Authentification
 * Prérequis : php artisan serve --port=8000
 *             Un compte test doit exister (email + password dans .env.testing ou seeder)
 */

const USER_EMAIL    = process.env.E2E_USER_EMAIL    ?? 'admin@nsia-transport.test';
const USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'Password@123';

test.describe('Authentification', () => {

    test('la page login s\'affiche correctement', async ({ page }) => {
        await page.goto('/login');

        await expect(page).toHaveTitle(/NSIA/i);
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('login réussi redirige vers le dashboard', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', USER_EMAIL);
        await page.fill('input[type="password"]', USER_PASSWORD);
        await page.click('button[type="submit"]');

        // Attend la redirection vers le dashboard
        await page.waitForURL('**/admin/dashboard', { timeout: 10_000 });
        await expect(page.url()).toContain('/admin/dashboard');
    });

    test('login avec mauvais mot de passe affiche une erreur', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', USER_EMAIL);
        await page.fill('input[type="password"]', 'wrong_password_xyz');
        await page.click('button[type="submit"]');

        // Doit rester sur la page login
        await expect(page).toHaveURL(/\/login/);
    });

    test('logout redirige vers la page login', async ({ page }) => {
        // Login d'abord
        await page.goto('/login');
        await page.fill('input[type="email"]', USER_EMAIL);
        await page.fill('input[type="password"]', USER_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin/dashboard');

        // Logout via POST /logout (Fortify)
        await page.evaluate(async () => {
            const csrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
            await fetch('/logout', {
                method: 'POST',
                headers: {
                    'X-XSRF-TOKEN': decodeURIComponent(csrf ?? ''),
                    'Content-Type': 'application/json',
                },
            });
        });
        await page.goto('/login');
        await expect(page).toHaveURL(/\/login/);
    });

    test('une page protégée redirige vers login si non authentifié', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await expect(page).toHaveURL(/\/login/);
    });
});
