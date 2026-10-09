<script setup lang="ts">
import type { Insight } from '#shared/types'

defineProps<{ items: Insight[] }>()
</script>

<template>
  <ul class="list">
    <li v-for="(it, i) in items" :key="i" class="card item">
      <InsightIcon :tone="it.tone" />
      <div class="text">
        <b class="title">{{ it.title }}</b>
        <span class="body">{{ it.body }}</span>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
.item { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 18px; }
.text { display: flex; flex-direction: column; gap: 2px; }
.title { font-size: 15px; }
.body { font-size: 13px; line-height: 1.55; color: var(--text-2); }
</style>
