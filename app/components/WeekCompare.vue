<script setup lang="ts">
import type { Grade, PeriodStat, Session } from '#shared/types'

// 최근 7일 아침·저녁 평균과 지난주보다 수축기가 얼마나 달라졌는지 (내려가면 초록 ↓, 올라가면 주황 ↑)
defineProps<{ items: { session: Session, now: (PeriodStat & { grade: Grade }) | null, delta: number | null }[] }>()
</script>

<template>
  <div class="compare">
    <div
      v-for="it in items"
      :key="it.session"
      class="tile"
      :class="it.session"
      :style="it.now ? { '--g-bg': gradeVar(it.now.grade, 'bg'), '--g-fg': gradeVar(it.now.grade, 'fg') } : undefined"
    >
      <span class="label"><span class="badge"><AppIcon :name="it.session === 'morning' ? 'sun' : 'moon'" :size="12" :stroke="2.4" /></span>{{ SESSION_LABEL[it.session] }} 7일 평균</span>
      <template v-if="it.now">
        <b class="value">{{ it.now.sys }}<i>/</i>{{ it.now.dia }}</b>
        <span class="foot">
          <GradeChip :grade="it.now.grade" size="sm" />
          <span v-if="it.delta == null" class="delta none">지난주 기록 없음</span>
          <span v-else-if="it.delta === 0" class="delta same">지난주와 같음</span>
          <span v-else class="delta" :class="it.delta < 0 ? 'down' : 'up'" :aria-label="`지난주보다 ${Math.abs(it.delta)} ${it.delta < 0 ? '낮아짐' : '높아짐'}`">
            <AppIcon :name="it.delta < 0 ? 'down' : 'up'" :size="12" :stroke="2.6" />{{ Math.abs(it.delta) }}<small>지난주 대비</small>
          </span>
        </span>
      </template>
      <span v-else class="empty">기록 없음</span>
    </div>
  </div>
</template>

<style scoped>
.compare { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.tile { --g-bg: var(--card); --g-fg: var(--text); display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: 13px 15px; border: 1px solid var(--line); border-radius: 18px; background: linear-gradient(150deg, var(--g-bg) 0%, var(--card) 75%); }
.label { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; color: var(--sub); }
.badge { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 6px; }
.morning .badge { background: #fdf0d8; color: #9a5b0b; }
.evening .badge { background: #e3eef8; color: #2e6399; }
.value { font-size: 26px; line-height: 1.15; letter-spacing: -0.03em; color: var(--g-fg); font-variant-numeric: tabular-nums; }
.value i { margin: 0 1px; font-style: normal; font-weight: 500; opacity: 0.45; }
/* 등급 칩과 지난주 대비를 위아래 두 줄로 (두 카드 높이가 늘 같게) */
.foot { display: flex; flex-direction: column; align-items: flex-start; gap: 5px; }
.delta { display: inline-flex; align-items: center; gap: 2px; padding: 2px 7px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.delta small { margin-left: 3px; font-size: 10px; font-weight: 500; opacity: 0.8; }
.delta.down { background: var(--accent-soft); color: var(--accent); }
.delta.up { background: var(--g-stage1-bg); color: var(--g-stage1-fg); }
.delta.same, .delta.none { padding: 0; font-weight: 500; color: var(--mute); }
.empty { padding: 8px 0; font-size: 14px; color: var(--mute); }
</style>
