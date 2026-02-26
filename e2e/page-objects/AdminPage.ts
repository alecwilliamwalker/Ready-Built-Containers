import { BasePage } from "./BasePage";
import type { Page, Locator } from "@playwright/test";

export class AdminPage extends BasePage {
  readonly path = "/admin";

  get emailInput(): Locator {
    return this.page.locator("input#admin-email");
  }

  get passwordInput(): Locator {
    return this.page.locator("input#admin-password");
  }

  get loginButton(): Locator {
    return this.submitButton;
  }

  get logoutButton(): Locator {
    return this.page.getByRole("button", { name: /log\s*out|sign\s*out/i });
  }

  get dashboardContent(): Locator {
    return this.page.locator("table").first();
  }

  tab(name: string): Locator {
    return this.page.getByRole("link", { name: new RegExp(name, "i") });
  }

  get table(): Locator {
    return this.page.locator("table").first();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
