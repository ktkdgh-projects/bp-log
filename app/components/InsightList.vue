<script setup lang="ts">
import type { Insight } from '#shared/types'

// compact: 제목은 크게, 설명은 한 줄만 (누르면 펼친다)
defineProps<{ items: Insight[], compact?: boolean }>()
const open = ref<number | null>(null)
</script>

<template>
  <ul class="list" :class="{ compact }">
    <li
      v-for="(it, i) in items"
      :key="i"
      class="card item"
      :style="{ '--tone-bg': INSIGHT_TONE[it.tone].bg }"
    >
      <InsightIcon :tone="it.tone" :size="compact ? 30 : 36" />
      <div class="text">
        <b class="title">{{ it.title }}</b>
        <button v-if="compact" type="button" class="body more" :class="{ open: open === i }" :aria-expanded="open === i" @click="open = open === i ? null : i">{{ it.body }}</button>
        <span v-else class="body">{{ it.body }}</span>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
.item { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 18px; }
.text { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.title { font-size: 15px; }
.body { font-size: 13px; line-height: 1.55; color: var(--text-2); }

.compact { gap: 6px; }
.compact .item { align-items: center; gap: 10px; padding: 9px 12px; border: 1px solid var(--line); border-radius: 14px; background: linear-gradient(90deg, var(--tone-bg) 0%, var(--card) 45%); }
.compact .title { font-size: 14px; letter-spacing: -0.01em; }
.more { overflow: hidden; padding: 0; border: 0; background: none; font-size: 12px; color: var(--sub); text-align: left; white-space: nowrap; text-overflow: ellipsis; }
.more.open { white-space: normal; }
</style>
