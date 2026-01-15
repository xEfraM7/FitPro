import { test, expect } from '@playwright/test'
import { login, TEST_USER } from './fixtures'

test.describe('Authentication', () => {
    test('should show login page', async ({ page }) => {
        await page.goto('/login')

        await expect(page).toHaveURL('/login')
        await expect(page.locator('input[type="email"]')).toBeVisible()
        await expect(page.locator('input[type="password"]')).toBeVisible()
        await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/login')

        await page.fill('input[type="email"]', 'invalid@test.com')
        await page.fill('input[type="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')

        // Should show some error indication (toast or inline error)
        await expect(page.locator('text=/error|inválid|incorrect/i').first()).toBeVisible({ timeout: 5000 })
    })

    test('should redirect to dashboard after login', async ({ page }) => {
        await login(page)

        // Should be on dashboard or create-organization
        await expect(page).toHaveURL(/\/(dashboard|create-organization)/)
    })

    test('should have forgot password link', async ({ page }) => {
        await page.goto('/login')

        const forgotLink = page.locator('a[href*="forgot-password"]')
        await expect(forgotLink).toBeVisible()
    })
})
