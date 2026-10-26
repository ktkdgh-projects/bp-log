<script setup lang="ts">
import type { InsightTone } from '#shared/types'

const props = defineProps<{ tone: InsightTone, size?: number }>()

const v = computed(() => INSIGHT_TONE[props.tone])
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
