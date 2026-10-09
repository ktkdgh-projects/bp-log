<script setup lang="ts">
import type { Grade, PeriodStat, Session } from '#shared/types'

// 아침/저녁 평균 + 그 기간 최저·최고 (수축기 기준)
defineProps<{ session: Session, label: string, stat: (PeriodStat & { grade: Grade }) | null, compact?: boolean }>()
</script>

<template>
  <div class="stat" :class="{ compact }">
    <span class="label">
      <AppIcon :name="session === 'morning' ? 'sun' : 'moon'" :size="14" />
      {{ label }}
    </span>
    <template v-if="stat">
      <span class="avg">
        <b>{{ stat.sys }}/{{ stat.dia }}</b>
        <GradeChip :grade="stat.grade" size="sm" />
      </span>
      <span class="range">
        <span>최저 <b>{{ stat.min.sys }}/{{ stat.min.dia }}</b> <small>{{ formatShort(stat.min.date) }}</small></span>
        <span>최고 <b>{{ stat.max.sys }}/{{ stat.max.dia }}</b> <small>{{ formatShort(stat.max.date) }}</small></span>
      </span>
    </template>
    <span v-else class="none">기록 없음</span>
  </div>
</template>

<style scoped>
.stat { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 14px 16px; border-radius: 16px; background: var(--card); }
.label { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; color: var(--sub); }
.avg { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.avg b { font-size: 24px; letter-spacing: -0.02em; }
.range { display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: var(--sub); }
.range b { color: var(--text); font-weight: 600; }
.range small { font-size: 11px; color: var(--mute); }
.none { font-size: 14px; color: var(--mute); padding: 6px 0; }
.compact { gap: 4px; padding: 10px 12px; border-radius: 14px; }
.compact .avg b { font-size: 18px; }
.compact .range { font-size: 12px; }
</style>
