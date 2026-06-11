<script setup lang="ts">
import HotkeyBadge from "./HotkeyBadge.vue";
import type { AuthHotkey } from "../domain/hotkey";

defineProps<{
  hotkey: AuthHotkey;
  editable?: boolean;
  recording?: boolean;
}>();

defineEmits<{
  record: [];
}>();
</script>

<template>
  <p class="ga-auth-ext-auth-hotkey-hint">
    Нажмите
    <HotkeyBadge
      :hotkey="hotkey"
      :recording="recording"
      :clickable="editable"
      :title="editable ? 'Нажмите, чтобы изменить сочетание' : undefined"
      @click="editable && $emit('record')"
    />
    для авторизации
  </p>
</template>
