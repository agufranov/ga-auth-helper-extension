const HOTKEY_STORAGE_KEY = "authHotkey";

export type HotkeyModifiers = {
  alt: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
};

export type AuthHotkey = {
  code: string;
  modifiers: HotkeyModifiers;
};

export const DEFAULT_AUTH_HOTKEY: AuthHotkey = {
  code: "KeyE",
  modifiers: { alt: true, ctrl: false, shift: false, meta: false },
};

function cloneHotkey(hotkey: AuthHotkey): AuthHotkey {
  return {
    code: hotkey.code,
    modifiers: { ...hotkey.modifiers },
  };
}

function normalizeModifiers(value: unknown): HotkeyModifiers {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_AUTH_HOTKEY.modifiers };
  }

  const record = value as Record<string, unknown>;
  return {
    alt: Boolean(record.alt),
    ctrl: Boolean(record.ctrl),
    shift: Boolean(record.shift),
    meta: Boolean(record.meta),
  };
}

export function normalizeAuthHotkey(value: unknown): AuthHotkey {
  if (!value || typeof value !== "object") {
    return cloneHotkey(DEFAULT_AUTH_HOTKEY);
  }

  const record = value as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : DEFAULT_AUTH_HOTKEY.code;

  return {
    code,
    modifiers: normalizeModifiers(record.modifiers),
  };
}

export function matchesAuthHotkey(
  event: KeyboardEvent,
  hotkey: AuthHotkey,
): boolean {
  return (
    event.code === hotkey.code &&
    event.altKey === hotkey.modifiers.alt &&
    event.ctrlKey === hotkey.modifiers.ctrl &&
    event.shiftKey === hotkey.modifiers.shift &&
    event.metaKey === hotkey.modifiers.meta
  );
}

export function isMacPlatform(): boolean {
  const uaData = (
    navigator as Navigator & { userAgentData?: { platform: string } }
  ).userAgentData;

  if (uaData?.platform) {
    return uaData.platform === "macOS";
  }

  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function formatKeyLabel(code: string): string {
  const special: Record<string, string> = {
    Space: "Space",
    Enter: "Enter",
    Escape: "Esc",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
  };

  if (special[code]) return special[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code;
}

export function formatAuthHotkeyParts(hotkey: AuthHotkey): string[] {
  const mac = isMacPlatform();
  const labels: string[] = [];

  if (mac) {
    if (hotkey.modifiers.ctrl) labels.push("⌃");
    if (hotkey.modifiers.alt) labels.push("⌥");
    if (hotkey.modifiers.shift) labels.push("⇧");
    if (hotkey.modifiers.meta) labels.push("⌘");
  } else {
    if (hotkey.modifiers.ctrl) labels.push("Ctrl");
    if (hotkey.modifiers.alt) labels.push("Alt");
    if (hotkey.modifiers.shift) labels.push("Shift");
    if (hotkey.modifiers.meta) labels.push("Win");
  }

  labels.push(formatKeyLabel(hotkey.code));
  return labels;
}

const MODIFIER_ONLY_KEYS = new Set([
  "Alt",
  "Control",
  "Shift",
  "Meta",
  "AltGraph",
]);

export function eventToAuthHotkey(event: KeyboardEvent): AuthHotkey | null {
  if (!event.code || MODIFIER_ONLY_KEYS.has(event.key)) return null;

  return {
    code: event.code,
    modifiers: {
      alt: event.altKey,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    },
  };
}

export async function loadAuthHotkey(): Promise<AuthHotkey> {
  const result = await chrome.storage.local.get(HOTKEY_STORAGE_KEY);
  return normalizeAuthHotkey(result[HOTKEY_STORAGE_KEY]);
}

export async function saveAuthHotkey(hotkey: AuthHotkey): Promise<void> {
  await chrome.storage.local.set({
    [HOTKEY_STORAGE_KEY]: normalizeAuthHotkey(hotkey),
  });
}
