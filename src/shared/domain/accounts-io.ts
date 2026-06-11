import type { TestAccount } from "./entities";
import { normalizePhone } from "./phone";

export function exportAccounts(accounts: TestAccount[]): void {
  const blob = new Blob([JSON.stringify(accounts, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ga-auth-accounts.json";
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeAccount(item: unknown): TestAccount | null {
  if (!item || typeof item !== "object") return null;

  const record = item as Record<string, unknown>;
  const rawPhone =
    typeof record.phone === "string"
      ? record.phone
      : typeof record.id === "string"
        ? record.id
        : "";

  if (!rawPhone.trim()) return null;

  const phone = normalizePhone(rawPhone);
  if (!phone) return null;

  return {
    phone,
    comment: typeof record.comment === "string" ? record.comment.trim() : "",
    skipCode: Boolean(record.skipCode) || undefined,
  };
}

export function mergeImportedAccounts(
  current: TestAccount[],
  imported: TestAccount[],
): { merged: TestAccount[]; added: TestAccount[] } {
  const existingPhones = new Set(current.map((account) => account.phone));
  const added = imported.filter((account) => !existingPhones.has(account.phone));

  return {
    merged: [...current, ...added],
    added,
  };
}

export function parseAccountsJson(text: string): TestAccount[] {
  const data = JSON.parse(text) as unknown;

  if (!Array.isArray(data)) {
    throw new Error("EXPECTED_ARRAY");
  }

  return data
    .map((item) => normalizeAccount(item))
    .filter((item): item is TestAccount => item !== null);
}
