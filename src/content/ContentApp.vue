<script setup lang="ts">
import EntityList from '../shared/components/EntityList.vue';
import { helperEntities } from '../shared/domain/entities';
</script>

<template>
  <aside class="app-shell app-shell--content" aria-label="GA Auth Helper">
    <header class="app-shell__header">
      <div>
        <h2 class="app-shell__title">Auth Helper</h2>
        <p class="app-shell__subtitle">Сущности на текущей странице.</p>
      </div>
      <span class="app-shell__badge">content</span>
    </header>

    <EntityList :entities="helperEntities" compact />
  </aside>
</template>
