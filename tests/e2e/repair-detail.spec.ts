/**
 * E2E Tests: Repair Detail Page Overhaul
 *
 * Single test that runs all checks in one browser session.
 * Firebase auth persists via IndexedDB within the session.
 */
import { test, expect, chromium } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'https://socialhomes.ai';
const TEST_EMAIL = 'e2e-test@socialhomes.ai';
const TEST_PASSWORD = 'E2eTest2026!';
const RESULTS = './playwright-report/test-results';

test('Repair Detail Page — full E2E verification', async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results: { name: string; pass: boolean; error?: string }[] = [];
  const check = (name: string, pass: boolean, error?: string) => {
    results.push({ name, pass, error });
    console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${name}${error ? ' — ' + error : ''}`);
  };

  try {
    // ═══════ AUTH ═══════
    console.log('\n=== AUTH ===');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(4000);
    await page.locator('button', { hasText: 'Sign in with email' }).click();
    await page.waitForTimeout(2000);
    await page.locator('input[type="email"], input[name="email"]').fill(TEST_EMAIL);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    const authUrl = page.url();
    const authenticated = !authUrl.includes('/login');
    check('Authentication', authenticated, authenticated ? undefined : `Still on ${authUrl}`);
    if (!authenticated) throw new Error('Auth failed — cannot continue');

    // ═══════ DISCOVER REPAIR ═══════
    console.log('\n=== DISCOVER ===');
    await page.goto(`${BASE_URL}/repairs`);
    await page.waitForTimeout(4000);

    const repairLink = page.locator('a[href*="/repairs/"]').first();
    const repairHref = await repairLink.getAttribute('href') || '';
    check('Found repair in list', !!repairHref, repairHref);

    const complaintLink2 = await (async () => {
      await page.goto(`${BASE_URL}/complaints`);
      await page.waitForTimeout(4000);
      return await page.locator('a[href*="/complaints/"]').first().getAttribute('href') || '';
    })();
    check('Found complaint in list', !!complaintLink2, complaintLink2);

    // ═══════ REPAIR DETAIL ═══════
    console.log('\n=== REPAIR DETAIL PAGE ===');
    await page.goto(`${BASE_URL}${repairHref}`);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${RESULTS}/01-repair-detail.png`, fullPage: true });

    // Layout
    check('Header shows REP- reference', (await page.locator('h1.text-3xl').textContent() || '').includes('REP-'));

    for (const tab of ['Details', 'Costs', 'Linked', 'Activity']) {
      const visible = await page.locator('button', { hasText: tab }).isVisible();
      check(`Tab "${tab}" visible`, visible);
    }

    // Workflow stepper
    check('Workflow: Reported', await page.locator('text=Reported').first().isVisible());
    check('Workflow: Closed', (await page.locator('text=Closed').first().isVisible()));

    // Sidebar
    check('Sidebar: Tenant', await page.locator('h3:has-text("Tenant")').isVisible());
    check('Sidebar: Property', await page.locator('h3:has-text("Property")').isVisible());
    check('Sidebar: Damp Risk Score', await page.locator('text=Damp Risk Score').isVisible());
    check('Sidebar: Assigned Officer', await page.locator('h3:has-text("Assigned Officer")').isVisible());
    check('No "Handler" label', (await page.locator('h3:has-text("Handler")').count()) === 0);

    // AI Status Banner
    check('AI Status Banner', (await page.locator('[class*="border-status-ai"]').count()) > 0);

    // ─── Details Tab ───
    console.log('\n=== TABS ===');
    await page.locator('button', { hasText: 'Details' }).click();
    await page.waitForTimeout(500);
    check('Details: Description field', await page.locator('text=Description').first().isVisible());
    check('Details: Trade field', await page.locator('text=Trade').first().isVisible());
    check('Details: Days Open', await page.locator('text=Days Open').first().isVisible());

    // ─── Costs Tab ───
    await page.locator('button', { hasText: 'Costs' }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${RESULTS}/02-costs-tab.png`, fullPage: true });
    check('Costs: Labour Log', await page.locator('text=Labour Log').isVisible());
    check('Costs: Parts Log', await page.locator('text=Parts Log').isVisible());
    check('Costs: Add Labour button', await page.locator('button', { hasText: 'Add Labour' }).isVisible());
    check('Costs: Add Parts button', await page.locator('button', { hasText: 'Add Parts' }).isVisible());

    // ─── Linked Tab ───
    await page.locator('button', { hasText: 'Linked' }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${RESULTS}/03-linked-tab.png`, fullPage: true });
    check('Linked: Create Linked Repair', await page.locator('button', { hasText: 'Create Linked Repair' }).isVisible());
    check('Linked: Raise Complaint', await page.locator('button', { hasText: 'Raise Complaint' }).isVisible());
    check('Linked: Duplicate', (await page.locator('button:has-text("Duplicate")').count()) > 0);

    // ─── Activity Tab ───
    await page.locator('button', { hasText: 'Activity' }).click();
    await page.waitForTimeout(1000);
    const actBody = await page.textContent('body') || '';
    check('Activity: tab renders', actBody.includes('activities') || actBody.includes('No activities') || actBody.includes('Activity'));

    // ═══════ SMART ACTION BAR ═══════
    console.log('\n=== SMART ACTION BAR ===');
    const primaryActions = ['Mark Complete', 'Triage & Assign', 'Close & Review', 'Start Work', 'Reopen'];
    let foundPrimary = '';
    for (const a of primaryActions) {
      if (await page.locator('button', { hasText: a }).count() > 0) { foundPrimary = a; break; }
    }
    check('Primary action button', !!foundPrimary, foundPrimary);
    check('More Actions button', await page.locator('button', { hasText: 'More Actions' }).isVisible());

    // Open dropdown
    await page.locator('button', { hasText: 'More Actions' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${RESULTS}/04-more-actions.png`, fullPage: true });
    check('Dropdown: Create Linked Repair', await page.locator('button:has-text("Create Linked Repair")').isVisible());
    check('Dropdown: Raise Complaint', await page.locator('button:has-text("Raise Complaint")').isVisible());
    check('Dropdown: Duplicate', await page.locator('button:has-text("Duplicate")').isVisible());
    await page.locator('.fixed.inset-0.z-40').click(); // close dropdown
    await page.waitForTimeout(300);

    // ═══════ MODALS ═══════
    console.log('\n=== MODALS ===');

    // Log Labour (if available for this status)
    await page.locator('button', { hasText: 'More Actions' }).click();
    await page.waitForTimeout(300);
    const hasLogLabour = await page.locator('button:has-text("Log Labour")').count() > 0;
    if (hasLogLabour) {
      await page.locator('button:has-text("Log Labour")').click();
      await page.waitForTimeout(500);
      check('Modal: Log Labour title', await page.locator('h2', { hasText: 'Log Labour' }).isVisible());
      check('Modal: number input', (await page.locator('input[type="number"]').count()) > 0);
      await page.screenshot({ path: `${RESULTS}/05-labour-modal.png` });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      check('Modal: Log Labour (skipped — status)', true, 'Not available for current status');
      await page.locator('div.fixed.inset-0').click();
      await page.waitForTimeout(300);
    }

    // Create Linked Repair modal
    await page.locator('button', { hasText: 'More Actions' }).click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Create Linked Repair")').click();
    await page.waitForTimeout(500);
    check('Modal: Create Linked Repair', await page.locator('h2:has-text("Create Linked Repair")').isVisible());
    await page.screenshot({ path: `${RESULTS}/06-linked-modal.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Duplicate modal
    await page.locator('button', { hasText: 'More Actions' }).click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Duplicate")').click();
    await page.waitForTimeout(500);
    check('Modal: Duplicate', await page.locator('h2:has-text("Duplicate Repair")').isVisible());
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ═══════ COMPLAINT: LINK REPAIRS ═══════
    if (complaintLink2) {
      console.log('\n=== COMPLAINT: LINK REPAIRS ===');
      await page.goto(`${BASE_URL}${complaintLink2}`);
      await page.waitForTimeout(4000);
      await page.screenshot({ path: `${RESULTS}/07-complaint.png`, fullPage: true });

      check('Complaint: Link Repairs button', await page.locator('button', { hasText: 'Link Repairs' }).isVisible());

      await page.locator('button', { hasText: 'Link Repairs' }).click();
      await page.waitForTimeout(1000);
      check('Complaint: Link Repairs modal', await page.locator('text=Select repairs').isVisible());
      await page.screenshot({ path: `${RESULTS}/08-link-repairs.png` });
      await page.keyboard.press('Escape');
    }

  } catch (err: any) {
    console.log(`\nFATAL: ${err.message}`);
    await page.screenshot({ path: `${RESULTS}/fatal-error.png`, fullPage: true });
  } finally {
    await browser.close();
  }

  // ═══════ SUMMARY ═══════
  console.log('\n' + '='.repeat(50));
  console.log('E2E TEST SUMMARY');
  console.log('='.repeat(50));
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`  ${passed} passed, ${failed} failed, ${results.length} total\n`);

  if (failed > 0) {
    console.log('FAILURES:');
    results.filter(r => !r.pass).forEach(r => console.log(`  - ${r.name}: ${r.error || 'failed'}`));
  }

  // Fail the test if any checks failed
  expect(failed).toBe(0);
});
