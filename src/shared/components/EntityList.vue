<script setup lang="ts">
import type { HelperEntity } from '../domain/entities';

defineProps<{
  entities: HelperEntity[];
  compact?: boolean;
}>();
</script>

<template>
  <ul class="entity-list" :class="{ 'entity-list--compact': compact }">
    <li v-for="entity in entities" :key="entity.id" class="entity-card">
      <div class="entity-card__header">
        <h3 class="entity-card__title">{{ entity.title }}</h3>
        <span class="entity-card__status" :class="`entity-card__status--${entity.status}`">
          {{ entity.status === 'ready' ? 'готово' : 'черновик' }}
        </span>
      </div>
      <p class="entity-card__description">{{ entity.description }}</p>
    </li>
  </ul>
</template>
