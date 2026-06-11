<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import ModalOverlay from "../shared/components/ModalOverlay.vue";
import AccountList from "../shared/components/AccountList.vue";
import { loadAccounts } from "../shared/domain/storage";
import { isUserAuthorized, logout, startFromEntry } from "./auth-flow";
import type { TestAccount } from "../shared/domain/entities";

const accounts = ref<TestAccount[]>([]);
const authorized = ref(false);
const focusedIndex = ref(0);
const selectedAccountPhone = ref<string | null>(null);
const visible = ref(true);
let afterCloseAction: (() => void) | null = null;

onMounted(async () => {
  document.addEventListener("keydown", onListKeydown, true);

  authorized.value = isUserAuthorized();
  if (!authorized.value) {
    accounts.value = await loadAccounts();
  }
});

watch(accounts, (list) => {
  if (focusedIndex.value >= list.length) {
    focusedIndex.value = Math.max(0, list.length - 1);
  }
});

const emit = defineEmits<{
  close: [];
}>();

function requestClose(action?: () => void) {
  if (!visible.value) return;
  afterCloseAction = action ?? null;
  visible.value = false;
}

function onClosed() {
  const action = afterCloseAction;
  afterCloseAction = null;
  action?.();
  emit("close");
}

function onSelect(account: TestAccount) {
  if (selectedAccountPhone.value) return;
  selectedAccountPhone.value = account.phone;
  focusedIndex.value = accounts.value.findIndex(
    (item) => item.phone === account.phone,
  );
}

function onAccountSelected(account: TestAccount) {
  selectedAccountPhone.value = null;
  requestClose(() => startFromEntry(account));
}

function onLogout() {
  logout();
}

defineExpose({ requestClose });

function onListKeydown(event: KeyboardEvent) {
  if (
    authorized.value ||
    accounts.value.length === 0 ||
    selectedAccountPhone.value
  )
    return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    event.stopPropagation();
    focusedIndex.value = Math.min(
      focusedIndex.value + 1,
      accounts.value.length - 1,
    );
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    event.stopPropagation();
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
    return;
  }

  if (event.key === "Enter") {
    const account = accounts.value[focusedIndex.value];
    if (!account) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(account);
    return;
  }

  const digit = Number(event.key);
  if (digit >= 1 && digit <= 9 && digit <= accounts.value.length) {
    event.preventDefault();
    event.stopPropagation();
    onSelect(accounts.value[digit - 1]);
    return;
  }

  if (event.key === "0" && accounts.value.length >= 10) {
    event.preventDefault();
    event.stopPropagation();
    onSelect(accounts.value[9]);
  }
}

onUnmounted(() => {
  document.removeEventListener("keydown", onListKeydown, true);
});
</script>

<template>
  <ModalOverlay
    :model-value="visible"
    :teleport-to="false"
    @update:model-value="
      (value) => {
        if (!value && !selectedAccountPhone) requestClose();
      }
    "
    @after-leave="onClosed"
  >
    <!-- Состояние: авторизован — показать кнопку разлогина -->
    <template v-if="authorized">
      <h2 class="ga-auth-ext-modal__title">Разлогиниться?</h2>
      <p class="ga-auth-ext-modal__text">
        Вы авторизованы. Очистить сессию и перезагрузить страницу?
      </p>
      <div class="ga-auth-ext-modal-actions">
        <button
          class="ga-auth-ext-button ga-auth-ext-button--grow"
          @click="requestClose()"
        >
          Отмена
        </button>
        <button
          class="ga-auth-ext-button ga-auth-ext-button--grow ga-auth-ext-button--danger"
          @click="onLogout"
        >
          Разлогиниться
        </button>
      </div>
    </template>

    <!-- Состояние: не авторизован — список аккаунтов -->
    <div v-else class="ga-auth-ext-modal__body">
      <h2 class="ga-auth-ext-modal__title">Тестовые аккаунты</h2>
      <div class="ga-auth-ext-scroll-area">
        <p v-if="accounts.length === 0" class="ga-auth-ext-empty-state">
          Нет сохранённых записей.
          <br/>
          Добавьте аккаунт в расширении.
        </p>
        <AccountList
          v-else
          :accounts="accounts"
          :active-index="focusedIndex"
          :selected-phone="selectedAccountPhone"
          compact
          show-key-icons
          @select="onSelect"
          @selected="onAccountSelected"
        />
      </div>
    </div>
  </ModalOverlay>
</template>
