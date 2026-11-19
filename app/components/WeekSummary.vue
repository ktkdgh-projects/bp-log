<script setup lang="ts">
import type { Average, Session, WeekStats } from '#shared/types'

// 최근 7일 한눈에: 기록 칸(7일 × 아침·저녁) · 목표 범위 비율 · 가장 높았던·낮았던 기록
const props = defineProps<{ stats: WeekStats, rows: { date: string, morning: Average | null, evening: Average | null }[] }>()

const s = computed(() => props.stats)
const when = (p: { date: string, session: Session }) => `${formatShort(p.date)} ${WEEKDAYS[weekday(p.date)]} ${SESSION_LABEL[p.session]}`
const targetTone = computed(() => (s.value.inTarget == null ? '' : s.value.inTarget >= 70 ? 'good' : s.value.inTarget >= 40 ? 'mid' : 'low'))
</script>

<template>
  <section class="sum" aria-label="최근 7일 한눈에">
    <div class="card cell habit">
      <span class="label">기록 <small>아침·저녁</small></span>
      <b class="value">{{ s.recorded }}<small>/{{ s.expected }}회</small></b>
      <!-- 7일 × 아침·저녁 칸: 잰 칸만 채운다 -->
      <span class="dots" aria-hidden="true">
        <template v-for="r in rows" :key="r.date">
          <i :class="{ on: r.morning }" /><i :class="{ on: r.evening }" />
        </template>
      </span>
      <span v-if="s.streak >= 2" class="streak">{{ s.streak }}일째 이어서 기록 중</span>
    </div>

    <div class="card cell">
      <span class="label">목표 범위 <small>130/80 미만</small></span>
      <template v-if="s.inTarget != null">
        <b class="value" :class="targetTone">{{ s.inTarget }}<small>%</small></b>
        <span class="bar"><span :class="targetTone" :style="{ width: `${s.inTarget}%` }" /></span>
      </template>
      <span v-else class="none">기록 없음</span>
    </div>

    <div class="card cell">
      <span class="label"><AppIcon name="up" :size="12" :stroke="2.4" />가장 높았던</span>
      <template v-if="s.high">
        <b class="value" :style="{ color: gradeVar(gradeOf(s.high.sys, s.high.dia), 'fg') }">{{ s.high.sys }}<i>/</i>{{ s.high.dia }}</b>
        <small class="when">{{ when(s.high) }}</small>
      </template>
      <span v-else class="none">기록 없음</span>
    </div>

    <div class="card cell">
      <span class="label"><AppIcon name="down" :size="12" :stroke="2.4" />가장 낮았던</span>
      <template v-if="s.low">
        <b class="value" :style="{ color: gradeVar(gradeOf(s.low.sys, s.low.dia), 'fg') }">{{ s.low.sys }}<i>/</i>{{ s.low.dia }}</b>
        <small class="when">{{ when(s.low) }}</small>
      </template>
      <span v-else class="none">기록이 더 필요해요</span>
    </div>
  </section>
</template>

<style scoped>
.sum { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.cell { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: 12px 13px; border: 1px solid var(--line); border-radius: 16px; }
.label { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; color: var(--sub); white-space: nowrap; }
.label small { margin-left: 2px; font-weight: 400; color: var(--mute); }
.value { font-size: 22px; line-height: 1.15; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.value small { font-size: 13px; font-weight: 500; color: var(--sub); }
.value i { margin: 0 1px; font-style: normal; font-weight: 500; opacity: 0.45; }
.value.good { color: var(--accent); }
.value.mid { color: var(--g-prehigh-fg); }
.value.low { color: var(--g-stage1-fg); }
.when, .none { font-size: 11px; color: var(--mute); white-space: nowrap; }
.none { margin-top: 4px; font-size: 13px; }
/* 날짜 순서대로 아침·저녁 두 칸씩 */
.dots { display: grid; grid-template-columns: repeat(14, minmax(0, 1fr)); gap: 2px; margin-top: 2px; }
.dots i { height: 6px; border-radius: 2px; background: var(--soft-2); }
.dots i.on { background: var(--accent); }
.streak { font-size: 11px; font-weight: 600; color: var(--accent); }
.bar { display: block; height: 6px; margin-top: 2px; border-radius: 3px; background: var(--soft-2); overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.bar .good { background: var(--accent); }
.bar .mid { background: var(--g-prehigh); }
.bar .low { background: var(--g-stage1); }
</style>
