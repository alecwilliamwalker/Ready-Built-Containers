import { BasePage } from "./BasePage";
import type { Locator } from "@playwright/test";

export class FAQPage extends BasePage {
  readonly path = "/faq";

  get accordionButtons(): Locator {
    return this.page.locator("button").filter({ hasText: /\?$/ });
  }

  /** All FAQ question buttons */
  get questions(): Locator {
    return this.page.locator("[data-faq-question], button.text-left, button").filter({ hasText: /\?/ });
  }

  /** FAQ answer panels (visible ones) */
  get visibleAnswers(): Locator {
    return this.page.locator("[data-faq-answer]:visible, .overflow-hidden:not(.max-h-0)");
  }
}
