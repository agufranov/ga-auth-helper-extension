<script setup lang="ts">
defineProps<{
  title: string;
  accent?: boolean;
  highlight?: boolean;
  small?: boolean;
  danger?: boolean;
  nativeTitle?: boolean;
}>();
</script>

<template>
  <button
    type="button"
    class="ga-auth-ext-icon-btn"
    :class="{
      'ga-auth-ext-icon-btn--accent': accent,
      'ga-auth-ext-icon-btn--highlight': highlight,
      'ga-auth-ext-icon-btn--small': small,
      'ga-auth-ext-icon-btn--danger': danger,
    }"
    :title="nativeTitle === false ? undefined : title"
    :aria-label="title"
  >
    <slot />
  </button>
</template>
