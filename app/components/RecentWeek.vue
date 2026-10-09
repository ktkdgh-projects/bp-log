<script setup lang="ts">
import type { Average, Grade } from '#shared/types'

type Cell = (Average & { grade: Grade }) | null
// 최근 7일 아침·저녁 한눈에 (최신이 위)
defineProps<{ rows: { date: string, isToday: boolean, morning: Cell, evening: Cell }[] }>()
</script>

<template>
  <table class="week">
    <thead>
      <tr>
        <th scope="col">날짜</th>
        <th scope="col"><AppIcon name="sun" :size="13" /> 아침</th>
        <th scope="col"><AppIcon name="moon" :size="13" /> 저녁</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r.date" :class="{ today: r.isToday }">
        <th scope="row">{{ r.isToday ? '오늘' : formatShort(r.date) }}<small>{{ WEEKDAYS[weekday(r.date)] }}</small></th>
        <td v-for="(c, ci) in [r.morning, r.evening]" :key="ci">
          <template v-if="c"><span class="dot" :style="{ background: gradeVar(c.grade) }" />{{ c.sys }}/{{ c.dia }}</template>
          <span v-else class="none">–</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.week { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { height: 32px; padding: 0 8px; text-align: left; }
thead th { height: 28px; font-size: 12px; font-weight: 600; color: var(--sub); border-bottom: 1px solid var(--soft-2); }
thead th :deep(svg) { vertical-align: -2px; }
tbody th { font-weight: 600; white-space: nowrap; }
tbody th small { margin-left: 4px; font-size: 11px; font-weight: 400; color: var(--mute); }
tbody tr + tr { border-top: 1px solid var(--soft); }
tbody tr.today { background: var(--accent-soft); }
td { font-weight: 600; white-space: nowrap; }
.dot { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; vertical-align: 1px; }
.none { color: var(--mute); font-weight: 400; }
</style>
