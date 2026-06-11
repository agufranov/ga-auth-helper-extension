<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
} from "vue";
import AccountList from "../shared/components/AccountList.vue";
import AccountForm from "./AccountForm.vue";
import AuthHotkeyHint from "../shared/components/AuthHotkeyHint.vue";
import IconButton from "../shared/components/IconButton.vue";
import Tooltip from "../shared/components/Tooltip.vue";
import { createAuthHotkeyListener } from "../shared/domain/auth-hotkey-listener";
import {
  DEFAULT_AUTH_HOTKEY,
  eventToAuthHotkey,
  loadAuthHotkey,
  normalizeAuthHotkey,
  saveAuthHotkey,
  type AuthHotkey,
} from "../shared/domain/hotkey";
import {
  exportAccounts,
  mergeImportedAccounts,
  parseAccountsJson,
} from "../shared/domain/accounts-io";
import {
  loadAccounts,
  loadAuthCode,
  normalizeAuthCode,
  saveAccounts,
  saveAuthCode,
} from "../shared/domain/storage";
import type { TestAccount } from "../shared/domain/entities";
import importIcon from "../shared/assets/icons/import.svg?raw";
import exportIcon from "../shared/assets/icons/export.svg?raw";
import addIcon from "../shared/assets/icons/add.svg?raw";
import editIcon from "../shared/assets/icons/edit.svg?raw";

const accounts = ref<TestAccount[]>([]);
const authHotkey = ref<AuthHotkey>({ ...DEFAULT_AUTH_HOTKEY });
const hotkeyRecording = ref(false);
const authCode = ref("");
const authCodeEditing = ref(false);
const authCodeFieldRef = useTemplateRef<HTMLSpanElement>("authCodeField");
const formOpen = ref(false);
const editingAccount = ref<TestAccount | null>(null);
const highlightedPhones = ref<string[]>([]);
let highlightEndPending = 0;
const targetTabId = ref<number | null>(null);
const importInput = useTemplateRef<HTMLInputElement>("importInput");
const importLabelRef = useTemplateRef<HTMLLabelElement>("importLabel");
let accountsLoadSeq = 0;

const isAccountsEmpty = computed(() => accounts.value.length === 0);
const isAuthCodeEmpty = computed(
  () => !authCode.value && !authCodeEditing.value,
);

async function refreshAccounts() {
  const seq = ++accountsLoadSeq;
  const loaded = await loadAccounts();
  if (seq !== accountsLoadSeq) return;
  accounts.value = loaded;
}

const onAuthHotkey = createAuthHotkeyListener(() => {
  void relayToContent().finally(() => window.close());
});

function onHotkeyStorageChange(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) {
  if (area !== "local" || !changes.authHotkey) return;
  authHotkey.value = normalizeAuthHotkey(changes.authHotkey.newValue);
}

function startHotkeyRecording() {
  hotkeyRecording.value = true;
}

function onHotkeyRecord(event: KeyboardEvent) {
  if (!hotkeyRecording.value) return;

  const next = eventToAuthHotkey(event);
  if (!next) return;

  event.preventDefault();
  event.stopPropagation();
  authHotkey.value = next;
  hotkeyRecording.value = false;
  void saveAuthHotkey(next);
}

function onHotkeyRecordCancel(event: KeyboardEvent) {
  if (!hotkeyRecording.value || event.key !== "Escape") return;
  event.preventDefault();
  hotkeyRecording.value = false;
}

onMounted(async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  targetTabId.value = tab?.id ?? null;

  const [, loadedAuthCode, loadedAuthHotkey] = await Promise.all([
    refreshAccounts(),
    loadAuthCode(),
    loadAuthHotkey(),
  ]);

  authCode.value = loadedAuthCode;
  authHotkey.value = loadedAuthHotkey;

  chrome.storage.onChanged.addListener(onHotkeyStorageChange);
  document.addEventListener("keydown", onAuthHotkey);
  document.addEventListener("keydown", onHotkeyRecord, true);
  document.addEventListener("keydown", onHotkeyRecordCancel, true);
});

onUnmounted(() => {
  chrome.storage.onChanged.removeListener(onHotkeyStorageChange);
  document.removeEventListener("keydown", onAuthHotkey);
  document.removeEventListener("keydown", onHotkeyRecord, true);
  document.removeEventListener("keydown", onHotkeyRecordCancel, true);
});

async function relayToContent() {
  const response = await chrome.runtime.sendMessage({
    action: "toggleModal",
    tabId: targetTabId.value ?? undefined,
  });

  if (!response?.ok) {
    throw new Error(response?.error ?? "MESSAGE_FAILED");
  }
}

function openCreateForm() {
  editingAccount.value = null;
  formOpen.value = true;
}

function openEditForm(account: TestAccount) {
  editingAccount.value = account;
  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
  editingAccount.value = null;
}

function onExport() {
  exportAccounts(accounts.value);
}

function resetImportTriggerState() {
  const label = importLabelRef.value;
  label?.blur();
  if (!label) return;
  label.style.pointerEvents = "none";
  requestAnimationFrame(() => {
    label.style.pointerEvents = "";
  });
}

function armImportTriggerReset() {
  window.addEventListener("focus", resetImportTriggerState, { once: true });
}

async function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const parsed = parseAccountsJson(await file.text());
    if (parsed.length === 0) {
      alert("В файле нет валидных записей");
      return;
    }

    const { merged, added } = mergeImportedAccounts(accounts.value, parsed);
    if (added.length === 0) {
      alert("Все записи из файла уже есть в списке");
      return;
    }

    accountsLoadSeq += 1;
    await saveAccounts(merged);
    accounts.value = merged;
    highlightAccounts(added.map((account) => account.phone));
    closeForm();
  } catch (error) {
    if (error instanceof Error && error.message === "EXPECTED_ARRAY") {
      alert("Неверный формат: ожидается массив записей");
    } else {
      alert("Ошибка чтения файла. Убедитесь, что это JSON.");
    }
  }

  input.value = "";
  resetImportTriggerState();
}

function onImportCancel() {
  resetImportTriggerState();
}

async function onFormSubmit(data: TestAccount, done: () => void) {
  accountsLoadSeq += 1;

  try {
    const current = await loadAccounts();

    let next: TestAccount[];
    let highlight: string[] = [];

    if (editingAccount.value) {
      const previousPhone = editingAccount.value.phone;
      const duplicate = current.some(
        (account) =>
          account.phone === data.phone && account.phone !== previousPhone,
      );
      if (duplicate) {
        alert("Такой номер уже есть в списке");
        return;
      }
      next = current.filter(
        (account) =>
          account.phone !== previousPhone && account.phone !== data.phone,
      );
      next.push(data);
    } else {
      if (current.some((account) => account.phone === data.phone)) {
        alert("Такой номер уже есть в списке");
        return;
      }
      next = [...current, data];
      highlight = [data.phone];
    }

    await saveAccounts(next);
    accounts.value = next;
    highlightAccounts(highlight);
  } finally {
    done();
  }
}

function highlightAccounts(phones: string[]) {
  if (phones.length === 0) return;
  highlightedPhones.value = phones;
  highlightEndPending = phones.length;
}

function onHighlightEnd() {
  highlightEndPending -= 1;
  if (highlightEndPending <= 0) {
    highlightedPhones.value = [];
    highlightEndPending = 0;
  }
}

function selectAuthCodeField(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function syncAuthCodeField(el: HTMLSpanElement) {
  const next = normalizeAuthCode(el.textContent ?? "");
  if (el.textContent !== next) {
    el.textContent = next;
    placeCaretAtEnd(el);
  }
  authCode.value = next;
}

function onAuthCodeContentInput(event: Event) {
  syncAuthCodeField(event.target as HTMLSpanElement);
}

function onAuthCodePaste(event: ClipboardEvent) {
  event.preventDefault();
  const el = authCodeFieldRef.value;
  if (!el) return;

  const pasted = event.clipboardData?.getData("text") ?? "";
  const selection = window.getSelection();
  if (!selection?.rangeCount) {
    el.textContent = normalizeAuthCode(pasted);
    authCode.value = el.textContent;
    placeCaretAtEnd(el);
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(pasted));
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  syncAuthCodeField(el);
}

function onAuthCodeKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    void finishAuthCodeEdit();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    void cancelAuthCodeEdit();
  }
}

async function onAuthCodeBlur() {
  if (!authCodeEditing.value) return;
  await finishAuthCodeEdit();
}

async function onAuthCodeSave() {
  const value = normalizeAuthCode(authCode.value);
  authCode.value = value;
  await saveAuthCode(value);
}

async function startAuthCodeEdit() {
  authCode.value = normalizeAuthCode(authCode.value);
  authCodeEditing.value = true;
  await nextTick();
  const el = authCodeFieldRef.value;
  if (!el) return;
  el.textContent = authCode.value;
  el.focus();
  selectAuthCodeField(el);
}

async function finishAuthCodeEdit() {
  const el = authCodeFieldRef.value;
  if (el) {
    authCode.value = normalizeAuthCode(el.textContent ?? "");
  }
  await onAuthCodeSave();
  authCodeEditing.value = false;
}

async function cancelAuthCodeEdit() {
  authCode.value = await loadAuthCode();
  authCodeEditing.value = false;
}

async function onDeleteAccount(account: TestAccount) {
  const label = account.phone || "эту запись";
  if (!confirm(`Удалить ${label}?`)) return;

  accountsLoadSeq += 1;
  const next = accounts.value.filter((item) => item.phone !== account.phone);
  await saveAccounts(next);
  accounts.value = next;

  if (editingAccount.value?.phone === account.phone) {
    closeForm();
  }
}
</script>

<template>
  <main class="ga-auth-ext ga-auth-ext-popup-shell">
    <header class="ga-auth-ext-popup-shell__header">
      <div class="ga-auth-ext-popup-shell__head">
        <h1 class="ga-auth-ext-popup-shell__title">GA Auth Helper</h1>
        <div class="ga-auth-ext-popup-shell__auth-code">
          <span class="ga-auth-ext-popup-shell__auth-code-label">Код:</span>
          <span
            ref="authCodeField"
            class="ga-auth-ext-popup-shell__auth-code-value"
            :class="{
              'ga-auth-ext-popup-shell__auth-code-value--empty': isAuthCodeEmpty,
            }"
            data-placeholder="не задан"
            :contenteditable="authCodeEditing"
            spellcheck="false"
            @input="onAuthCodeContentInput"
            @paste="onAuthCodePaste"
            @keydown="onAuthCodeKeydown"
            @blur="onAuthCodeBlur"
          >{{ authCodeEditing ? "" : authCode }}</span>
          <button
            type="button"
            class="ga-auth-ext-popup-shell__auth-code-edit"
            :class="{
              'ga-auth-ext-popup-shell__auth-code-edit--hidden': authCodeEditing,
              'ga-auth-ext-popup-shell__auth-code-edit--highlight':
                isAuthCodeEmpty,
            }"
            title="Изменить код"
            aria-label="Изменить код"
            @click="startAuthCodeEdit"
          >
            <span
              class="ga-auth-ext-popup-shell__auth-code-edit-icon"
              v-html="editIcon"
            />
          </button>
        </div>
      </div>

      <div class="ga-auth-ext-popup-shell__actions">
        <Tooltip label="Добавить из JSON">
          <label
            ref="importLabel"
            class="ga-auth-ext-icon-btn"
            for="ga-auth-ext-import-input"
            aria-label="Добавить из JSON"
            @pointerdown="armImportTriggerReset"
          >
            <span class="ga-auth-ext-icon-btn__icon" v-html="importIcon" />
          </label>
        </Tooltip>
        <Tooltip label="Выгрузить в JSON">
          <IconButton
            title="Выгрузить в JSON"
            :native-title="false"
            @click="onExport"
          >
            <span class="ga-auth-ext-icon-btn__icon" v-html="exportIcon" />
          </IconButton>
        </Tooltip>
        <IconButton
          title="Добавить запись"
          accent
          :highlight="isAccountsEmpty"
          @click="openCreateForm"
        >
          <span class="ga-auth-ext-icon-btn__icon" v-html="addIcon" />
        </IconButton>
        <input
          id="ga-auth-ext-import-input"
          ref="importInput"
          type="file"
          accept=".json,application/json"
          hidden
          @change="onImportFile"
          @cancel="onImportCancel"
        />
      </div>
    </header>

    <div class="ga-auth-ext-scroll-area">
      <p v-if="isAccountsEmpty" class="ga-auth-ext-empty-state">
        Нет сохранённых записей. Добавьте первую.
      </p>
      <AccountList
        v-else
        :accounts="accounts"
        :highlighted-phones="highlightedPhones"
        show-actions
        @select="openEditForm"
        @delete="onDeleteAccount"
        @highlight-end="onHighlightEnd"
      />
    </div>

    <footer class="ga-auth-ext-popup-shell__footer">
      <AuthHotkeyHint
        :hotkey="authHotkey"
        editable
        :recording="hotkeyRecording"
        @record="startHotkeyRecording"
      />
    </footer>

    <AccountForm
      :open="formOpen"
      :account="editingAccount"
      @close="closeForm"
      @submit="onFormSubmit"
    />
  </main>
</template>
