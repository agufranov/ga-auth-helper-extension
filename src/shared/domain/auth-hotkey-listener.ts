import {
  DEFAULT_AUTH_HOTKEY,
  loadAuthHotkey,
  matchesAuthHotkey,
  normalizeAuthHotkey,
  type AuthHotkey,
} from "./hotkey";

export function createAuthHotkeyListener(onMatch: () => void) {
  let authHotkey: AuthHotkey = DEFAULT_AUTH_HOTKEY;

  void loadAuthHotkey().then((hotkey) => {
    authHotkey = hotkey;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.authHotkey) return;
    authHotkey = normalizeAuthHotkey(changes.authHotkey.newValue);
  });

  return (event: KeyboardEvent) => {
    if (!matchesAuthHotkey(event, authHotkey)) return;
    event.preventDefault();
    event.stopPropagation();
    onMatch();
  };
}
