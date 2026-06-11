import type { TestAccount } from "../shared/domain/entities";
import { loadAuthCode } from "../shared/domain/storage";

const SELECTORS = {
  authModal: '[class*="_ga-auth-modal_"]',
  profileTab: '[class*="ga-header__tab_type_profile"]',
  phoneInput: 'input[name="auth-phone"]',
  codeInput: 'input[name="code"]',
  authTypeButton: '[class*="ga-auth-modal-auth-types__button"]',
  startFooter: '[class*="ga-auth-modal-start-form__footer"]',
  confirmForm: '[class*="ga-auth-modal-confirm-form"]',
  confirmFooter: '[class*="ga-auth-modal-confirm-form__footer"]',
  overlay: '[class*="overlay"]',
  closeButton:
    '[class*="close"], [aria-label*="закрыт" i], [aria-label*="close" i], [class*="cross"]',
} as const;

function getAuthModal(): Element | null {
  return document.querySelector(SELECTORS.authModal);
}

function isAuthModalOpen(): boolean {
  return !!getAuthModal();
}

function getProfileTab(): HTMLElement | null {
  return document.querySelector(SELECTORS.profileTab);
}

function openAuthModal(): boolean {
  const tab = getProfileTab();
  if (!tab) return false;
  tab.click();
  return true;
}

function getPhoneInput(): HTMLInputElement | null {
  return document.querySelector(SELECTORS.phoneInput);
}

function getCodeInput(): HTMLInputElement | null {
  return document.querySelector(SELECTORS.codeInput);
}

function getStartSubmitButton(): HTMLButtonElement | null {
  const footer = document.querySelector(SELECTORS.startFooter);
  if (!footer) return null;
  const btn = footer.querySelector(
    'button[type="submit"], button',
  ) as HTMLButtonElement | null;
  return btn && !btn.disabled ? btn : null;
}

function getConfirmSubmitButton(): HTMLButtonElement | null {
  const footer = document.querySelector(SELECTORS.confirmFooter);
  if (!footer) return null;
  const btn = footer.querySelector("button") as HTMLButtonElement | null;
  return btn && !btn.disabled ? btn : null;
}

function isConfirmFormOpen(): boolean {
  return !!document.querySelector(SELECTORS.confirmForm);
}

function getAuthTypeButton(): HTMLElement | null {
  const modal = getAuthModal();
  if (!modal) return null;
  const btns = modal.querySelectorAll(SELECTORS.authTypeButton);
  return (btns[0] as HTMLElement) || null;
}

function closeAuthModal(): void {
  const modal = getAuthModal();
  if (!modal) return;

  const overlay = modal.querySelector(SELECTORS.overlay);
  if (overlay) {
    overlay.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
    );
  }

  const escEvent = new KeyboardEvent("keydown", {
    key: "Escape",
    code: "Escape",
    keyCode: 27,
    bubbles: true,
    cancelable: true,
  });
  modal.dispatchEvent(escEvent);
  document.dispatchEvent(escEvent);

  const closeBtn = modal.querySelector(
    SELECTORS.closeButton,
  ) as HTMLElement | null;
  if (closeBtn) closeBtn.click();
}

// --- Состояние ---
let pendingEntry: TestAccount | null = null;
let codeSeen = false;

function fillPhoneAndSubmit(): void {
  if (!pendingEntry) return;

  const input = getPhoneInput();
  if (!input) return;

  input.value = pendingEntry.phone;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  tryClickStartSubmit(15);
}

function waitForPhoneInputAndFill(retry: number): void {
  if (retry <= 0) {
    pendingEntry = null;
    return;
  }

  if (isConfirmFormOpen()) {
    codeSeen = true;
    fillCodeAndConfirm();
    return;
  }

  if (getPhoneInput()) {
    fillPhoneAndSubmit();
    return;
  }

  setTimeout(() => waitForPhoneInputAndFill(retry - 1), 200);
}

function waitForAuthTypeAndClick(retry: number): void {
  if (retry <= 0) {
    pendingEntry = null;
    return;
  }

  if (isConfirmFormOpen()) {
    codeSeen = true;
    fillCodeAndConfirm();
    return;
  }

  if (getPhoneInput()) {
    fillPhoneAndSubmit();
    return;
  }

  const btn = getAuthTypeButton();
  if (!btn) {
    setTimeout(() => waitForAuthTypeAndClick(retry - 1), 250);
    return;
  }

  btn.click();
  waitForPhoneInputAndFill(25);
}

function tryClickStartSubmit(attemptsLeft: number): void {
  if (attemptsLeft <= 0) return;

  const btn = getStartSubmitButton();
  if (!btn) {
    setTimeout(() => tryClickStartSubmit(attemptsLeft - 1), 200);
    return;
  }

  btn.click();
}

async function fillCodeAndConfirm(): Promise<void> {
  if (!pendingEntry) return;

  if (pendingEntry.skipCode) {
    // Ручной ввод — оставляем поле пустым, юзер вводит сам
    pendingEntry = null;
    return;
  }

  const input = getCodeInput();
  if (!input) return;

  input.value = await loadAuthCode();
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  pendingEntry = null;

  const btn = getConfirmSubmitButton();
  if (btn) btn.click();
}

function waitForModalContent(retry: number): void {
  if (retry <= 0 || !pendingEntry) {
    pendingEntry = null;
    return;
  }

  if (!isAuthModalOpen()) {
    tryOpenAuthModal(retry);
    return;
  }

  if (isConfirmFormOpen() || getPhoneInput() || getAuthTypeButton()) {
    resumeAuthFlow();
    return;
  }

  setTimeout(() => waitForModalContent(retry - 1), 250);
}

function tryOpenAuthModal(retry: number): void {
  if (!pendingEntry) return;

  if (retry <= 0) {
    pendingEntry = null;
    return;
  }

  if (isAuthModalOpen()) {
    waitForAuthTypeAndClick(30);
    return;
  }

  if (!openAuthModal()) {
    setTimeout(() => tryOpenAuthModal(retry - 1), 200);
    return;
  }

  setTimeout(() => waitForModalContent(30), 250);
}

function resumeAuthFlow(): void {
  if (!pendingEntry) return;

  if (isConfirmFormOpen()) {
    codeSeen = true;
    fillCodeAndConfirm();
    return;
  }

  if (getPhoneInput()) {
    fillPhoneAndSubmit();
    return;
  }

  if (isAuthModalOpen()) {
    waitForAuthTypeAndClick(30);
    return;
  }

  tryOpenAuthModal(30);
}

function startAuthFlow(): void {
  resumeAuthFlow();
}

function clearCookies(): void {
  document.cookie.split(";").forEach((cookie) => {
    const eqIdx = cookie.indexOf("=");
    const name = (eqIdx !== -1 ? cookie.substring(0, eqIdx) : cookie).trim();
    if (!name) return;

    ["", location.hostname, "." + location.hostname].forEach((domain) => {
      ["/", "/auth", "/api", "/checkout", "/customer", "/cart"].forEach(
        (path) => {
          document.cookie = domain
            ? name +
              "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=" +
              path +
              ";domain=" +
              domain
            : name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=" + path;
        },
      );
    });
  });
}

function clearIndexedDb(): void {
  if (!window.indexedDB || !window.indexedDB.databases) return;
  try {
    window.indexedDB
      .databases()
      .then((databases) => {
        for (const db of databases) {
          if (db.name) window.indexedDB.deleteDatabase(db.name);
        }
      })
      .catch(() => {});
  } catch {
    // best effort
  }
}

// --- Публичный API ---
export function isUserAuthorized(): boolean {
  const tab = getProfileTab();
  if (!tab) return false;
  if (tab.tagName === "A" || (tab as HTMLAnchorElement).href) return true;
  if (tab.querySelector("a[href]")) return true;
  return false;
}

export function logout(): void {
  clearCookies();
  localStorage.clear();
  sessionStorage.clear();
  clearIndexedDb();
  location.reload();
}

export function startFromEntry(entry: TestAccount): void {
  pendingEntry = entry;
  codeSeen = false;
  resumeAuthFlow();
}

export function observeCodeForm(): void {
  new MutationObserver(() => {
    if (codeSeen || !pendingEntry) return;
    if (!isConfirmFormOpen()) return;
    codeSeen = true;
    setTimeout(fillCodeAndConfirm, 0);
    setTimeout(() => {
      codeSeen = false;
    }, 30000);
  }).observe(document.body, { childList: true, subtree: true });
}
