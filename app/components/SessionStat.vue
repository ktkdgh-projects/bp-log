<script setup lang="ts">
import type { Grade, PeriodStat, Session } from '#shared/types'

// 아침/저녁 평균 + 그 기간 최저·최고 (수축기 기준). 최근 7일 카드(WeekCompare)와 같은 모양
const props = defineProps<{ session: Session, label: string, stat: (PeriodStat & { grade: Grade }) | null, compact?: boolean }>()
const tint = computed(() => (props.stat ? { '--g-bg': gradeVar(props.stat.grade, 'bg'), '--g-fg': gradeVar(props.stat.grade, 'fg') } : undefined))
</script>

<template>
  <div class="stat" :class="[session, { compact }]" :style="tint">
    <span class="label">
      <span class="badge"><AppIcon :name="session === 'morning' ? 'sun' : 'moon'" :size="12" :stroke="2.4" /></span>
      {{ label }}
    </span>
    <template v-if="stat">
      <b class="value">{{ stat.sys }}<i>/</i>{{ stat.dia }}</b>
      <GradeChip :grade="stat.grade" size="sm" class="chip" />
      <span class="range">
        <span><em>최저</em><b>{{ stat.min.sys }}/{{ stat.min.dia }}</b><small>{{ formatShort(stat.min.date) }}</small></span>
        <span><em>최고</em><b>{{ stat.max.sys }}/{{ stat.max.dia }}</b><small>{{ formatShort(stat.max.date) }}</small></span>
      </span>
    </template>
    <span v-else class="none">기록 없음</span>
  </div>
</template>

<style scoped>
.stat {
  --g-bg: var(--card);
  --g-fg: var(--text);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  min-width: 0;
  padding: 13px 15px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: linear-gradient(150deg, var(--g-bg) 0%, var(--card) 75%);
}
.label { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: var(--sub); }
.badge { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 6px; }
.morning .badge { background: #fdf0d8; color: #9a5b0b; }
.evening .badge { background: #e3eef8; color: #2e6399; }
.value { font-size: 26px; line-height: 1.15; letter-spacing: -0.03em; color: var(--g-fg); font-variant-numeric: tabular-nums; }
.value i { margin: 0 1px; font-style: normal; font-weight: 500; opacity: 0.45; }
.range { align-self: stretch; display: flex; flex-direction: column; gap: 3px; margin-top: 3px; padding-top: 7px; border-top: 1px dashed var(--line-strong); font-size: 12px; color: var(--sub); }
.range > span { display: flex; align-items: baseline; gap: 6px; }
.range em { width: 24px; font-style: normal; color: var(--mute); }
.range b { color: var(--text); font-weight: 700; font-variant-numeric: tabular-nums; }
.range small { margin-left: auto; font-size: 11px; color: var(--mute); }
.none { padding: 10px 0; font-size: 14px; color: var(--mute); }

.compact { gap: 4px; padding: 11px 12px; border-radius: 16px; }
.compact .value { font-size: 22px; }
.compact .range { font-size: 11.5px; }
</style>
