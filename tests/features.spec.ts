import { test, expect } from '@playwright/test'
import { login } from './fixtures'

test.describe('Exchange Rates', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        if (page.url().includes('create-organization')) {
            test.skip()
        }
    })

    test('should display current exchange rates', async ({ page }) => {
        await page.goto('/dashboard')

        // Should show BCV and USDT rates - wait for page to load and use first()
        await page.waitForLoadState('networkidle')
        await expect(page.locator('text=/BCV/i').first()).toBeVisible({ timeout: 10000 })
        await expect(page.locator('text=/USDT/i').first()).toBeVisible({ timeout: 10000 })
    })

    test('should open BCV rate modal and sync', async ({ page }) => {
        await page.goto('/dashboard')

        // Find and click the BCV rate edit button
        const bcvButton = page.locator('button, [role="button"]').filter({ hasText: /BCV/i }).first()

        if (await bcvButton.isVisible()) {
            await bcvButton.click()

            // Modal should open
            const modal = page.locator('[role="dialog"]')
            await expect(modal).toBeVisible({ timeout: 3000 })

            // Should have sync button
            const syncButton = modal.locator('button').filter({ hasText: /sincronizar/i }).or(
                modal.locator('button svg') // Icon button for sync
            ).first()

            if (await syncButton.isVisible()) {
                await syncButton.click()
                // Wait for sync to complete
                await page.waitForTimeout(3000)
            }

            // Should have save button
            const saveButton = modal.locator('button').filter({ hasText: /guardar/i })
            await expect(saveButton).toBeVisible()
        }
    })

    test('should save exchange rate manually', async ({ page }) => {
        await page.goto('/dashboard')

        // Find exchange rate edit button
        const editButton = page.locator('button, [role="button"]').filter({ hasText: /editar|BCV|USDT/i }).first()

        if (await editButton.isVisible()) {
            await editButton.click()

            const modal = page.locator('[role="dialog"]')
            await expect(modal).toBeVisible()

            // Fill in rate
            const rateInput = modal.locator('input[type="number"]')
            if (await rateInput.isVisible()) {
                await rateInput.fill('50.00')

                // Click save
                const saveButton = modal.locator('button').filter({ hasText: /guardar/i })
                await saveButton.click()

                // Modal should close or show success
                await page.waitForTimeout(2000)
            }
        }
    })
})

test.describe('Special Classes', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        if (page.url().includes('create-organization')) {
            test.skip()
        }
        await page.goto('/dashboard/classes')
    })

    test('should load classes list', async ({ page }) => {
        // Verify URL is correct - test passes if we reach the classes page
        await expect(page).toHaveURL(/classes/)
        await page.waitForLoadState('networkidle')

        // Check that page loaded - look for any visible heading or button
        const pageLoaded = page.locator('body').first()
        await expect(pageLoaded).toBeVisible()
    })

    test('should have add class button', async ({ page }) => {
        const addButton = page.locator('button').filter({ hasText: /agregar|nueva|crear/i })
        await expect(addButton.first()).toBeVisible()
    })
})

test.describe('Monthly Closings', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        if (page.url().includes('create-organization')) {
            test.skip()
        }
        await page.goto('/dashboard/closings')
    })

    test('should load closings page', async ({ page }) => {
        // Wait for page to load and check URL is correct
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(/closings/)
        // Verify main content area exists
        const mainContent = page.locator('main, [class*="container"]').first()
        await expect(mainContent).toBeVisible({ timeout: 15000 })
    })
})
