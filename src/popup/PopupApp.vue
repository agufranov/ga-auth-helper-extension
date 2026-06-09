<script setup lang="ts">
import EntityList from '../shared/components/EntityList.vue';
import { helperEntities } from '../shared/domain/entities';
</script>

<template>
  <main class="app-shell">
    <header class="app-shell__header">
      <div>
        <h1 class="app-shell__title">GA Auth Helper</h1>
        <p class="app-shell__subtitle">Быстрый доступ к dev/QA сущностям.</p>
      </div>
      <span class="app-shell__badge">popup</span>
    </header>

    <EntityList :entities="helperEntities" />
  </main>
</template>
