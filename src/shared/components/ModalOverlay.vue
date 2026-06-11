<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

withDefaults(
  defineProps<{
    modelValue: boolean;
    teleportTo?: string | HTMLElement | false;
  }>(),
  { teleportTo: "body" },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  afterLeave: [];
}>();

function onOverlayClick() {
  emit("update:modelValue", false);
}

function onModalClick(e: Event) {
  e.stopPropagation();
}

function onEsc(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    emit("update:modelValue", false);
  }
}

onMounted(() => {
  document.addEventListener("keydown", onEsc, true);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onEsc, true);
});
</script>

<template>
  <Teleport v-if="teleportTo" :to="teleportTo">
    <Transition
      name="ga-auth-ext-modal"
      appear
      @after-leave="emit('afterLeave')"
    >
      <div
        v-if="modelValue"
        class="ga-auth-ext-modal-overlay"
        @click="onOverlayClick"
      >
        <div class="ga-auth-ext-modal-overlay__window" @click="onModalClick">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
  <Transition
    v-else
    name="ga-auth-ext-modal"
    appear
    @after-leave="emit('afterLeave')"
  >
    <div
      v-if="modelValue"
      class="ga-auth-ext-modal-overlay"
      @click="onOverlayClick"
    >
      <div class="ga-auth-ext-modal-overlay__window" @click="onModalClick">
        <slot />
      </div>
    </div>
  </Transition>
</template>
