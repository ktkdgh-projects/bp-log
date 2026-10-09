<script setup lang="ts">
import type { PeriodStat, SummaryResponse } from '#shared/types'

const props = defineProps<{ summary: SummaryResponse | null, pending?: boolean }>()

const stats = computed(() => {
  const s = props.summary
  if (!s) return []
  return (['morning', 'evening'] as const).map((session) => {
    const now: PeriodStat | null = s.week[session]
    const before: PeriodStat | null = s.lastWeek[session]
    return {
      session,
      label: `${SESSION_LABEL[session]} 7일 평균`,
      now,
      before,
      grade: now ? gradeOf(now.sys, now.dia) : null,
    }
  })
})
</script>

<template>
  <section class="card trend" aria-label="최근 동향" :aria-busy="pending">
    <template v-if="summary">
      <div class="head">
        <InsightIcon :tone="summary.headline.tone" :size="32" />
        <h2 class="title">{{ summary.headline.title }}</h2>
      </div>
      <p class="body">{{ summary.headline.body }}</p>
      <div class="stats">
        <div v-for="s in stats" :key="s.session" class="stat">
          <span class="label">{{ s.label }}</span>
          <span v-if="s.now" class="value">{{ s.now.sys }}<span class="slash">/</span>{{ s.now.dia }}</span>
          <span v-else class="value none">–</span>
          <span class="meta">
            <GradeChip v-if="s.grade" :grade="s.grade" size="sm" />
            <span v-if="s.before" class="prev">지난주 {{ s.before.sys }}/{{ s.before.dia }}</span>
          </span>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="skeleton" style="width: 40%; height: 28px" />
      <div class="skeleton" style="width: 90%; height: 20px" />
      <div class="skeleton" style="height: 86px" />
    </template>
  </section>
</template>

<style scoped>
.trend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.head { display: flex; align-items: center; gap: 10px; }
.title { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.body { font-size: 15px; line-height: 1.55; font-weight: 500; color: var(--text-2); }
.stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: var(--radius-sm);
  background: var(--soft);
}
.label { font-size: 12px; font-weight: 500; color: var(--sub); }
.value { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
.value.none { color: var(--mute); }
.slash { color: var(--mute); font-weight: 500; }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
.prev { font-size: 11px; color: var(--sub); }
.skeleton { border-radius: 10px; background: var(--soft-2); animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: 0.5; } }
</style>
