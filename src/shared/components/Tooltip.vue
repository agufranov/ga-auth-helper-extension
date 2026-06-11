<script setup lang="ts">
import { nextTick, onUnmounted, ref, useTemplateRef } from "vue";

const SHOW_DELAY_MS = 300;

defineProps<{
  label: string;
  wrap?: boolean;
}>();

const visible = ref(false);
const placement = ref<"top" | "bottom">("bottom");
const rootRef = useTemplateRef<HTMLElement>("rootRef");
const bubbleRef = useTemplateRef<HTMLElement>("bubbleRef");
let showTimer: ReturnType<typeof setTimeout> | null = null;

function clearShowTimer() {
  if (showTimer == null) return;
  clearTimeout(showTimer);
  showTimer = null;
}

function show() {
  clearShowTimer();
  showTimer = setTimeout(() => {
    showTimer = null;
    void reveal();
  }, SHOW_DELAY_MS);
}

async function reveal() {
  visible.value = true;
  await nextTick();
  positionBubble();
}

function hide() {
  clearShowTimer();
  visible.value = false;
}

onUnmounted(clearShowTimer);

function positionBubble() {
  const root = rootRef.value;
  const bubble = bubbleRef.value;
  if (!root || !bubble) return;

  const trigger = root.getBoundingClientRect();
  const viewport = document.documentElement.getBoundingClientRect();
  const margin = 8;
  const gap = 6;

  const width = bubble.offsetWidth;
  const height = bubble.offsetHeight;

  let top = trigger.bottom + gap;
  let left = trigger.left + trigger.width / 2 - width / 2;
  placement.value = "bottom";

  left = Math.max(
    viewport.left + margin,
    Math.min(left, viewport.right - width - margin),
  );

  if (top + height > viewport.bottom - margin) {
    top = trigger.top - gap - height;
    placement.value = "top";
  }

  top = Math.max(viewport.top + margin, top);

  const triggerCenterX = trigger.left + trigger.width / 2;
  const tailLeft = Math.max(10, Math.min(triggerCenterX - left, width - 10));

  bubble.style.top = `${top}px`;
  bubble.style.left = `${left}px`;
  bubble.style.setProperty("--ga-tooltip-tail-left", `${tailLeft}px`);
}
</script>

<template>
  <span
    ref="rootRef"
    class="ga-auth-ext-tooltip"
    @pointerenter="show"
    @pointerleave="hide"
    @pointerdown="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
    <Teleport to="body">
      <Transition name="ga-auth-ext-tooltip">
        <span
          v-if="visible"
          ref="bubbleRef"
          class="ga-auth-ext-tooltip__bubble"
          :class="[
            `ga-auth-ext-tooltip__bubble--${placement}`,
            { 'ga-auth-ext-tooltip__bubble--wrap': wrap },
          ]"
          role="tooltip"
        >
          {{ label }}
        </span>
      </Transition>
    </Teleport>
  </span>
</template>
