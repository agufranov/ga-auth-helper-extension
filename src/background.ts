import { isHostSupported } from "./shared/domain/hosts";
import type {
  ContentRelayResponse,
  ToggleModalMessage,
} from "./shared/messaging";
import {
  focusTab,
  queryTargetTab,
  sendToTabWithRetry,
} from "./shared/tab-target";

const ICON_PATHS = {
  16: "icons/icon16.png",
  48: "icons/icon48.png",
  128: "icons/icon128.png",
} as const;

const DOMAIN_ALLOWED_KEY = "gaDomainAllowed";

async function makeGrayIconData(
  size: 16 | 48 | 128,
): Promise<ImageData | null> {
  try {
    const response = await fetch(chrome.runtime.getURL(ICON_PATHS[size]));
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.filter = "grayscale(1) opacity(0.1)";
    ctx.drawImage(bitmap, 0, 0, size, size);
    return ctx.getImageData(0, 0, size, size);
  } catch {
    return null;
  }
}

let grayIconsPromise: Promise<{
  i16: ImageData | null;
  i48: ImageData | null;
  i128: ImageData | null;
}> | null = null;

function getGrayIcons() {
  grayIconsPromise ??= Promise.all([
    makeGrayIconData(16),
    makeGrayIconData(48),
    makeGrayIconData(128),
  ]).then(([i16, i48, i128]) => ({ i16, i48, i128 }));

  return grayIconsPromise;
}

async function setIconForHost(hostname: string): Promise<void> {
  if (isHostSupported(hostname)) {
    await chrome.action.setIcon({ path: { ...ICON_PATHS } });
    await chrome.storage.local.set({ [DOMAIN_ALLOWED_KEY]: true });
    return;
  }

  const gray = await getGrayIcons();
  if (gray.i16 && gray.i48 && gray.i128) {
    await chrome.action.setIcon({
      imageData: { 16: gray.i16, 48: gray.i48, 128: gray.i128 },
    });
  }

  await chrome.storage.local.set({ [DOMAIN_ALLOWED_KEY]: false });
}

async function updateActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  try {
    const { hostname } = new URL(tab.url);
    await setIconForHost(hostname);
  } catch {
    // chrome://, chrome-extension://, etc.
  }
}

chrome.tabs.onActivated.addListener(() => {
  void updateActiveTab();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    void updateActiveTab();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  void updateActiveTab();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action !== "toggleModal") {
    return;
  }

  void relayToContentScript(message as ToggleModalMessage)
    .then((response) => sendResponse(response))
    .catch((error: unknown) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      } satisfies ContentRelayResponse);
    });

  return true;
});

async function relayToContentScript(
  message: ToggleModalMessage,
): Promise<ContentRelayResponse> {
  const tab = await queryTargetTab(message.tabId);
  if (!tab?.id || !tab.url) {
    return { ok: false, error: "NO_TAB" };
  }

  let hostname: string;
  try {
    hostname = new URL(tab.url).hostname;
  } catch {
    return { ok: false, error: "INVALID_URL" };
  }

  if (!isHostSupported(hostname)) {
    return { ok: false, error: "UNSUPPORTED_HOST" };
  }

  await focusTab(tab);

  await sendToTabWithRetry(tab.id, { action: message.action });
  return { ok: true };
}

void updateActiveTab();
