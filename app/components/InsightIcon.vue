<script setup lang="ts">
import type { InsightTone } from '#shared/types'

const props = defineProps<{ tone: InsightTone, size?: number }>()

const MAP: Record<InsightTone, { icon: string, bg: string, fg: string }> = {
  good: { icon: 'down', bg: 'var(--g-normal-bg)', fg: 'var(--g-normal-fg)' },
  steady: { icon: 'check', bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  caution: { icon: 'info', bg: 'var(--g-prehigh-bg)', fg: 'var(--g-prehigh-fg)' },
  up: { icon: 'up', bg: 'var(--g-stage1-bg)', fg: 'var(--g-stage1-fg)' },
  warn: { icon: 'alert', bg: 'var(--g-stage2-bg)', fg: 'var(--g-stage2-fg)' },
  info: { icon: 'pulse', bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  empty: { icon: 'plus', bg: 'var(--soft-2)', fg: 'var(--sub)' },
}
const v = computed(() => MAP[props.tone])
</script>

<template>
  <span class="ii" :style="{ background: v.bg, color: v.fg, width: `${size ?? 36}px`, height: `${size ?? 36}px` }">
    <AppIcon :name="v.icon" :size="Math.round((size ?? 36) / 2)" :stroke="2.4" />
  </span>
</template>

<style scoped>
.ii {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
</style>
