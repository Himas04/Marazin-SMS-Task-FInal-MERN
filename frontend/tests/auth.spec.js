import { expect, test } from '@playwright/test';

test('admin can sign in and reach the dashboard', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === '/api/auth/me') {
      await route.fulfill({
        status: 401,
        json: { message: 'Not authenticated' },
      });
      return;
    }

    if (pathname === '/api/auth/login' && request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({
        email: 'admin@school.edu',
        password: 'admin123',
      });
      await route.fulfill({
        status: 200,
        json: {
          user: {
            _id: 'admin-test',
            name: 'Test Admin',
            email: 'admin@school.edu',
            role: 'admin',
          },
        },
      });
      return;
    }

    await route.fulfill({ status: 200, json: {} });
  });

  await page.goto('/');
  await page.getByRole('button', { name: /Fill Demo Admin/ }).click();
  await page.getByRole('button', { name: 'Sign In to Portal' }).click();

  await expect(
    page.getByRole('heading', { name: 'Welcome, Test Admin!' })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Faculty & Staff' })).toBeVisible();
});
