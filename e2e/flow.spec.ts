import { test, expect, Page } from '@playwright/test';
const email = () => `t${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`;
async function register(page: Page, e: string) {
  await page.goto('/login'); await page.getByRole('button', { name: '没有账号？注册' }).click();
  await page.getByLabel('邮箱').fill(e); await page.getByLabel(/密码/).fill('password123');
  await page.getByRole('button', { name: '创建账号' }).click(); await page.waitForURL('/');
}
test('anonymous users cannot read questions', async ({ request }) => {
  expect((await request.get('/api/questions/1')).status()).toBe(401);
  expect((await request.get('/api/practice/queue')).status()).toBe(401);
});
test('full learning loop persists across logout/login', async ({ page, request }) => {
  const e = email(); await register(page, e);
  await expect(page.getByText('从第 1 题开始')).toBeVisible();
  // API never leaks answers before submit
  const q = await (await page.request.get('/api/questions/1')).json();
  expect(Object.keys(q)).not.toContain('answer'); expect(JSON.stringify(q)).not.toContain('explanation_en');
  await page.goto('/practice/run?mode=seq');
  await expect(page.getByText('第 1 题').first()).toBeVisible();
  await expect(page.getByTestId('result')).toHaveCount(0);           // answer hidden
  await page.getByTestId('opt-B').click();                           // Q1 correct answer is A -> wrong
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('result')).toContainText('回答错误，正确答案：A');
  await expect(page.getByTestId('result')).toContainText('PDF 第');
  await page.getByRole('button', { name: /收藏/ }).click(); await expect(page.getByRole('button', { name: '★ 已收藏' })).toBeVisible();
  await page.getByTestId('next').click();
  // keyboard: press 1 then Enter to submit on Q2
  await expect(page.getByText('第 2 题').first()).toBeVisible();
  await page.keyboard.press('3'); await page.keyboard.press('Enter');
  await expect(page.getByTestId('result')).toBeVisible();
  // reload home -> resume
  await page.goto('/'); await expect(page.getByText('上次做到第 2 题')).toBeVisible();
  // mistakes mode contains Q1
  await page.goto('/practice/run?mode=mistakes'); await expect(page.getByText('第 1 题').first()).toBeVisible();
  // bookmarks mode
  await page.goto('/practice/run?mode=bookmarks'); await expect(page.getByText('第 1 题').first()).toBeVisible();
  // logout and login again: data still there
  await page.goto('/'); await page.getByRole('button', { name: '退出' }).click(); await expect(page.getByRole('link', { name: '登录 / 注册' })).toBeVisible();
  await page.goto('/login'); await page.getByLabel('邮箱').fill(e); await page.getByLabel(/密码/).fill('password123'); await page.getByRole('button', { name: '登录', exact: true }).click(); await page.waitForURL('/');
  await expect(page.getByText('上次做到第 2 题')).toBeVisible();
  await page.goto('/stats'); await expect(page.getByText(/正确率/).first()).toBeVisible();
});
test('wrong password is rejected', async ({ page }) => {
  await page.goto('/login'); await page.getByLabel('邮箱').fill('nobody@example.com'); await page.getByLabel(/密码/).fill('xxxxxxxx'); await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByText('邮箱或密码不正确')).toBeVisible();
});
test('syllabus: all 5 domains and 30 task statements are reachable', async ({ page }) => {
  await page.goto('/syllabus'); await expect(page.locator('a[href^="/syllabus/"]')).toHaveCount(30);
  for (const id of ['1.1', '2.5', '3.6', '4.6', '5.6']) { await page.goto(`/syllabus/${id}`); await expect(page.getByRole('heading', { level: 1 })).toContainText(id); }
});
test('no horizontal overflow on key pages', async ({ page }) => {
  await register(page, email());
  for (const p of ['/', '/practice', '/practice/run?mode=seq', '/syllabus', '/syllabus/1.2', '/questions', '/stats']) {
    await page.goto(p); await page.waitForLoadState('networkidle');
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over, p).toBeLessThanOrEqual(0);
  }
});
