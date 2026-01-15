import { type Page } from '@playwright/test'

/**
 * Test credentials - update these with valid test account
 */
export const TEST_USER = {
    email: 'efraincabrera35@gmail.com',
    password: '22115511',
}

/**
 * Helper: Login to the application
 */
export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
    await page.goto('/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    // Wait for redirect to dashboard
    await page.waitForURL(/\/(dashboard|create-organization)/, { timeout: 10000 })
}

/**
 * Helper: Check if user needs to create organization
 */
export async function skipIfNoOrganization(page: Page) {
    return page.url().includes('create-organization')
}
