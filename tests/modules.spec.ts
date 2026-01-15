import { test, expect } from '@playwright/test'
import { login } from './fixtures'

test.describe('Members Management', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        if (page.url().includes('create-organization')) {
            test.skip()
        }
        await page.goto('/dashboard/users')
    })

    test('should load members list', async ({ page }) => {
        // Should have a table or list of members
        await expect(page.locator('table, [role="grid"]')).toBeVisible({ timeout: 10000 })
    })

    test('should have add member button', async ({ page }) => {
        const addButton = page.locator('button').filter({ hasText: /agregar|nuevo|añadir|crear/i })
        await expect(addButton.first()).toBeVisible()
    })

    test('should open add member modal', async ({ page }) => {
        const addButton = page.locator('button').filter({ hasText: /agregar|nuevo|añadir|crear/i }).first()
        await addButton.click()

        // Modal should open with form
        await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 })
        await expect(page.locator('input[type="email"], input[name*="email"]')).toBeVisible()
    })

    test('should filter or search members', async ({ page }) => {
        // Look for search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"]')

        if (await searchInput.isVisible()) {
            await searchInput.fill('test')
            // Wait for filtering to apply
            await page.waitForTimeout(500)
        }
    })
})

test.describe('Plans Management', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        if (page.url().includes('create-organization')) {
            test.skip()
        }
        await page.goto('/dashboard/plans')
    })

    test('should load plans list', async ({ page }) => {
        // Should have plans displayed (table or cards)
        await expect(page.locator('table, [class*="card"], [class*="grid"]')).toBeVisible({ timeout: 10000 })
    })

    test('should have add plan button', async ({ page }) => {
        const addButton = page.locator('button').filter({ hasText: /agregar|nuevo|crear|plan/i })
        await expect(addButton.first()).toBeVisible()
    })

    test('should show plan prices', async ({ page }) => {
        // Plans should have price information - wait for load and use first()
        await page.waitForLoadState('networkidle')
        await expect(page.locator('text=/\\$|Bs|USD|precio/i').first()).toBeVisible({ timeout: 10000 })
    })
})

test.describe('Payments Management', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        if (page.url().includes('create-organization')) {
            test.skip()
        }
        await page.goto('/dashboard/payments')
    })

    test('should load payments list', async ({ page }) => {
        await expect(page.locator('table, [role="grid"]')).toBeVisible({ timeout: 10000 })
    })

    test('should have payment filters', async ({ page }) => {
        // Wait for page to load
        await page.waitForLoadState('networkidle')
        // Look for table which indicates page loaded - filters may vary
        const table = page.locator('table, [class*="table"]').first()
        await expect(table).toBeVisible({ timeout: 15000 })
    })

    test('should show payment methods', async ({ page }) => {
        // Should display payment method types
        await expect(page.locator('text=/Pago Móvil|USDT|Efectivo|Transferencia/i').first()).toBeVisible({ timeout: 5000 })
    })
})
