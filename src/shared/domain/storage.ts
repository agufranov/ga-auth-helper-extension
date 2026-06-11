import type { TestAccount } from "./entities";
import { normalizePhone } from "./phone";

const STORAGE_KEY = "testAccounts";
const AUTH_CODE_KEY = "authCode";

export const AUTH_CODE_MAX_LENGTH = 6;

export function normalizeAuthCode(code: string): string {
  return code.replace(/\s/g, "").slice(0, AUTH_CODE_MAX_LENGTH);
}

function normalizeStoredAccount(item: unknown): TestAccount | null {
  if (!item || typeof item !== "object") return null;

  const record = item as Record<string, unknown>;
  const rawPhone =
    typeof record.phone === "string"
      ? record.phone
      : typeof record.id === "string"
        ? record.id
        : "";

  const phone = normalizePhone(rawPhone);
  if (!phone) return null;

  return {
    phone,
    comment: typeof record.comment === "string" ? record.comment.trim() : "",
    skipCode: Boolean(record.skipCode) || undefined,
  };
}

export async function loadAccounts(): Promise<TestAccount[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];

  if (stored === undefined || !Array.isArray(stored)) {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
    return [];
  }

  return stored
    .map(normalizeStoredAccount)
    .filter((item): item is TestAccount => item !== null);
}

export async function saveAccounts(accounts: TestAccount[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: accounts });
}

export async function loadAuthCode(): Promise<string> {
  const result = await chrome.storage.local.get(AUTH_CODE_KEY);
  const stored = result[AUTH_CODE_KEY];

  if (typeof stored === "string") {
    const normalized = normalizeAuthCode(stored);
    if (normalized !== stored) {
      await saveAuthCode(normalized);
    }
    return normalized;
  }

  return "";
}

export async function saveAuthCode(code: string): Promise<void> {
  const value = normalizeAuthCode(code);
  await chrome.storage.local.set({ [AUTH_CODE_KEY]: value });
}
