<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from "vue";
import IconButton from "./IconButton.vue";
import KeyIcon from "./KeyIcon.vue";
import Tooltip from "./Tooltip.vue";
import type { TestAccount } from "../domain/entities";
import deleteIcon from "../assets/icons/delete.svg?raw";
import keyOffIcon from "../assets/icons/key-off.svg?raw";

const props = defineProps<{
  accounts: TestAccount[];
  compact?: boolean;
  showKeyIcons?: boolean;
  showActions?: boolean;
  activeIndex?: number;
  selectedPhone?: string | null;
  highlightedPhones?: string[];
}>();

const emit = defineEmits<{
  select: [account: TestAccount];
  selected: [account: TestAccount];
  highlightEnd: [];
  delete: [account: TestAccount];
}>();

function onCardClick(account: TestAccount) {
  if (props.selectedPhone) return;
  emit("select", account);
}

function onCardAnimationEnd(account: TestAccount, event: AnimationEvent) {
  if (props.selectedPhone === account.phone) {
    if (event.animationName !== "ga-auth-ext-account-select") return;
    emit("selected", account);
    return;
  }
  if (props.highlightedPhones?.includes(account.phone)) {
    if (event.animationName !== "ga-auth-ext-account-highlight") return;
    emit("highlightEnd");
  }
}

const listRef = useTemplateRef<HTMLUListElement>("listRef");

watch(
  () => props.activeIndex,
  async (index) => {
    if (index == null || index < 0) return;
    await nextTick();
    const items = listRef.value?.querySelectorAll(".ga-auth-ext-account-card");
    (items?.[index] as HTMLElement | undefined)?.scrollIntoView({
      block: "nearest",
    });
  },
);

watch(
  () => props.highlightedPhones,
  async (phones) => {
    if (!phones?.length) return;
    await nextTick();
    const indices = phones
      .map((phone) =>
        props.accounts.findIndex((account) => account.phone === phone),
      )
      .filter((index) => index >= 0);
    if (indices.length === 0) return;
    const index = Math.max(...indices);
    const items = listRef.value?.querySelectorAll(".ga-auth-ext-account-card");
    (items?.[index] as HTMLElement | undefined)?.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
  },
);

function shortcutLabel(index: number): string {
  if (index > 9) return "";
  return index === 9 ? "0" : String(index + 1);
}
</script>

<template>
  <ul
    ref="listRef"
    class="ga-auth-ext-account-list"
    :class="{
      'ga-auth-ext-account-list--compact': compact,
      'ga-auth-ext-account-list--selecting': !!selectedPhone,
    }"
  >
    <li
      v-for="(acc, index) in accounts"
      :key="acc.phone"
      class="ga-auth-ext-account-card"
      :class="{
        'ga-auth-ext-account-card--with-actions': showActions,
        'ga-auth-ext-account-card--active':
          activeIndex === index && !selectedPhone,
        'ga-auth-ext-account-card--selected': selectedPhone === acc.phone,
        'ga-auth-ext-account-card--highlighted':
          highlightedPhones?.includes(acc.phone),
      }"
      @animationend="onCardAnimationEnd(acc, $event)"
      @click="!showActions ? onCardClick(acc) : undefined"
    >
      <KeyIcon
        v-if="showKeyIcons"
        :symbol="shortcutLabel(index)"
        variant="default"
      />
      <div
        class="ga-auth-ext-account-card__body"
        :class="{ 'ga-auth-ext-account-card__body--clickable': showActions }"
        @click="showActions ? onCardClick(acc) : undefined"
      >
        <div class="ga-auth-ext-account-card__top">
          <div class="ga-auth-ext-account-card__header">
            <h3 class="ga-auth-ext-account-card__title">
              {{ acc.phone }}
            </h3>
            <span
              v-if="acc.skipCode"
              class="ga-auth-ext-account-card__skip-code"
              @click.stop
            >
              <Tooltip label="Код вводится вручную">
                <span
                  class="ga-auth-ext-account-card__skip-code-icon"
                  aria-label="Код вводится вручную"
                  v-html="keyOffIcon"
                />
              </Tooltip>
            </span>
          </div>

          <div
            v-if="showActions"
            class="ga-auth-ext-account-card__actions"
            @click.stop
          >
            <Tooltip label="Удалить">
              <IconButton
                title="Удалить"
                :native-title="false"
                small
                danger
                @click.stop="emit('delete', acc)"
              >
                <span class="ga-auth-ext-icon-btn__icon" v-html="deleteIcon" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        <p class="ga-auth-ext-account-card__comment">
          {{ acc.comment || "—" }}
        </p>
      </div>
    </li>
  </ul>
</template>
