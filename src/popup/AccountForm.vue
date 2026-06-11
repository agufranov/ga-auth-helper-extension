<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import Tooltip from "../shared/components/Tooltip.vue";
import type { TestAccount } from "../shared/domain/entities";
import { normalizePhone } from "../shared/domain/phone";
import helpIcon from "../shared/assets/icons/help.svg?raw";

const props = defineProps<{
  open: boolean;
  account?: TestAccount | null;
}>();

const emit = defineEmits<{
  close: [];
  submit: [account: TestAccount, done: () => void];
}>();

const phone = ref("");
const comment = ref("");
const skipCode = ref(false);
const phoneInput = useTemplateRef<HTMLInputElement>("phoneInput");

const isEdit = computed(() => Boolean(props.account));

watch(
  () => [props.open, props.account] as const,
  async ([open, account]) => {
    if (!open) return;

    if (account) {
      phone.value = account.phone;
      comment.value = account.comment;
      skipCode.value = Boolean(account.skipCode);
    } else {
      phone.value = "";
      comment.value = "";
      skipCode.value = false;
    }
  },
);

function focusPhone() {
  phoneInput.value?.focus();
}

function reset() {
  phone.value = "";
  comment.value = "";
  skipCode.value = false;
}

function onClose() {
  reset();
  emit("close");
}

function onSubmit() {
  const value = normalizePhone(phone.value);
  if (!value) return;

  emit(
    "submit",
    {
      phone: value,
      comment: comment.value.trim(),
      skipCode: skipCode.value || undefined,
    },
    () => {
      reset();
      emit("close");
    },
  );
}
</script>

<template>
  <Transition
    name="ga-auth-ext-form-drawer"
    :duration="300"
    @after-enter="focusPhone"
  >
    <div v-if="open" class="ga-auth-ext-account-form">
      <button
        type="button"
        class="ga-auth-ext-account-form__backdrop"
        aria-label="Закрыть форму"
        @click="onClose"
      />
      <form class="ga-auth-ext-account-form__panel" @submit.prevent="onSubmit">
        <h2 class="ga-auth-ext-account-form__title">
          {{ isEdit ? "Редактировать аккаунт" : "Добавить аккаунт" }}
        </h2>

        <label class="ga-auth-ext-account-form__field">
          <input
            ref="phoneInput"
            v-model="phone"
            class="ga-auth-ext-input"
            type="text"
            placeholder="Телефон"
            required
            autocomplete="off"
          />
        </label>

        <label class="ga-auth-ext-account-form__field">
          <textarea
            v-model="comment"
            class="ga-auth-ext-input ga-auth-ext-input--textarea"
            placeholder="Комментарий"
            rows="3"
            autocomplete="off"
          />
        </label>

        <label class="ga-auth-ext-checkbox">
          <input v-model="skipCode" type="checkbox" />
          <span class="ga-auth-ext-checkbox__text">
            Вводить код вручную
            <Tooltip
              label="При авторизации вы будете каждый раз вводить код вручную"
              wrap
            >
              <button
                type="button"
                class="ga-auth-ext-checkbox__help"
                aria-label="Подсказка"
                @click.prevent
              >
                <span
                  class="ga-auth-ext-checkbox__help-icon"
                  v-html="helpIcon"
                />
              </button>
            </Tooltip>
          </span>
        </label>

        <div class="ga-auth-ext-account-form__actions">
          <button
            type="submit"
            class="ga-auth-ext-button ga-auth-ext-button--primary ga-auth-ext-button--grow"
          >
            {{ isEdit ? "Сохранить" : "Добавить" }}
          </button>
        </div>
      </form>
    </div>
  </Transition>
</template>
