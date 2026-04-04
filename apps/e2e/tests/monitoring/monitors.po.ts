import { Page } from '@playwright/test';

export class MonitorsPageObject {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goToMonitors() {
    await this.page.goto('/home/monitors', { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('table, [data-test="monitors-table"]', { timeout: 10000 });
  }

  async goToCreateMonitor() {
    await this.page.goto('/home/monitors/new', { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('input[name="name"]', { timeout: 10000 });
  }

  async createMonitor(params: {
    name: string;
    url: string;
    type: 'http' | 'https' | 'tcp';
    interval?: number;
    timeout?: number;
  }) {
    await this.goToCreateMonitor();

    // Fill form
    await this.page.fill('input[name="name"]', params.name);
    await this.page.fill('input[name="url"]', params.url);
    
    // Select type
    await this.page.click('[data-test="monitor-type-select"]');
    await this.page.click(`[data-test="monitor-type-${params.type}"]`);

    // Set interval if provided
    if (params.interval) {
      await this.page.fill('input[name="interval"]', params.interval.toString());
    }

    // Set timeout if provided
    if (params.timeout) {
      await this.page.fill('input[name="timeout"]', params.timeout.toString());
    }

    // Submit form
    await this.page.click('button[type="submit"]');

    // Wait for redirect to monitors list
    await this.page.waitForURL('**/home/monitors', { timeout: 10000 });
  }

  async getMonitorCount(): Promise<number> {
    const rows = await this.page.locator('table tbody tr').count();
    return rows;
  }

  async getMonitorStatus(name: string): Promise<string | null> {
    const row = this.page.locator('table tbody tr', { hasText: name });
    const statusBadge = row.locator('td:first-child [class*="badge"], td:first-child span');
    return statusBadge.textContent();
  }

  async deleteMonitor(name: string) {
    const row = this.page.locator('table tbody tr', { hasText: name });
    await row.locator('button[aria-haspopup="menu"]').click();
    await this.page.click('text=Delete');
    await this.page.click('text=Delete'); // Confirm dialog
  }

  async clickViewDetails(name: string) {
    const row = this.page.locator('table tbody tr', { hasText: name });
    await row.locator('button[aria-haspopup="menu"]').click();
    await this.page.click('text=View Details');
  }

  async getResponseTime(name: string): Promise<string | null> {
    const row = this.page.locator('table tbody tr', { hasText: name });
    const responseTimeCell = row.locator('td:nth-child(4)');
    return responseTimeCell.textContent();
  }
}
