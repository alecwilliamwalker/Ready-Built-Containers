import type { Page, Locator } from "@playwright/test";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  abstract readonly path: string;

  async goto(queryParams?: Record<string, string>) {
    const url = queryParams
      ? `${this.path}?${new URLSearchParams(queryParams)}`
      : this.path;
    await this.page.goto(url);
    await this.page.waitForLoadState("domcontentloaded");
  }

  get heading(): Locator {
    return this.page.locator("h1").first();
  }

  get submitButton(): Locator {
    return this.page.locator("button[type='submit']");
  }

  errorMessages(): Locator {
    return this.page.locator(".text-red-600");
  }
}
