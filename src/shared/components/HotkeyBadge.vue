<script setup lang="ts">
import { computed } from "vue";
import {
  formatAuthHotkeyParts,
  type AuthHotkey,
} from "../domain/hotkey";

const props = defineProps<{
  hotkey: AuthHotkey;
  recording?: boolean;
  clickable?: boolean;
}>();

defineEmits<{
  click: [];
}>();

const parts = computed(() => formatAuthHotkeyParts(props.hotkey));
</script>

<template>
  <span
    class="ga-auth-ext-hotkey"
    :class="{
      'ga-auth-ext-hotkey--clickable': clickable,
      'ga-auth-ext-hotkey--recording': recording,
    }"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="clickable && $emit('click')"
    @keydown.enter.prevent="clickable && $emit('click')"
    @keydown.space.prevent="clickable && $emit('click')"
  >
    <template v-if="recording">
      <kbd class="ga-auth-ext-hotkey__key">…</kbd>
    </template>
    <template v-else>
      <kbd
        v-for="(part, index) in parts"
        :key="`${part}-${index}`"
        class="ga-auth-ext-hotkey__key"
      >{{ part }}</kbd>
    </template>
  </span>
</template>
