export async function queryTargetTab(
  preferredTabId?: number | null,
): Promise<chrome.tabs.Tab | null> {
  if (preferredTabId != null) {
    try {
      return await chrome.tabs.get(preferredTabId);
    } catch {
      // Tab was closed or id is stale.
    }
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab ?? null;
}

export async function focusTab(tab: chrome.tabs.Tab): Promise<void> {
  if (tab.id == null) return;

  await chrome.tabs.update(tab.id, { active: true });
  if (tab.windowId != null) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
}

export async function sendToTabWithRetry(
  tabId: number,
  message: Record<string, unknown>,
  attempts = 20,
  delayMs = 150,
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}
