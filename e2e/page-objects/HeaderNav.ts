import type { Page, Locator } from "@playwright/test";

export class HeaderNav {
  constructor(private readonly page: Page) {}

  get header(): Locator {
    return this.page.locator("header");
  }

  get logo(): Locator {
    return this.header.locator("a").first();
  }

  get desktopNav(): Locator {
    return this.header.locator("nav");
  }

  get mobileMenuToggle(): Locator {
    return this.page.locator("button[aria-label='Toggle navigation']");
  }

  get ctaButton(): Locator {
    return this.header.getByRole("link", { name: /pricing/i });
  }

  desktopLink(label: string): Locator {
    return this.desktopNav.getByRole("link", { name: label });
  }

  mobileLink(label: string): Locator {
    return this.header.getByRole("link", { name: label });
  }

  /** The mobile menu container (hidden/shown via max-h classes) */
  get mobileMenu(): Locator {
    return this.header.locator(".md\\:hidden").last();
  }
}
