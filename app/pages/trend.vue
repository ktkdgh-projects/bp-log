<script setup lang="ts">
import type { SummaryResponse } from '#shared/types'

useHead({ title: '추이 · bp-log' })

const PERIODS = [7, 14, 30, 90] as const
const days = ref<(typeof PERIODS)[number]>(14)
const metric = ref<'sys' | 'dia'>('sys')

const { data: summary, pending } = await useFetch<SummaryResponse>('/api/summary', {
  query: { days },
  key: 'summary-trend',
})

const stats = computed(() => {
  const s = summary.value
  if (!s) return []
  const points = s.series
  const avgOf = (session: 'morning' | 'evening') => {
    const v = points.map(p => p[session]).filter((x): x is NonNullable<typeof x> => !!x)
    if (!v.length) return null
    return `${Math.round(v.reduce((a, b) => a + b.sys, 0) / v.length)}/${Math.round(v.reduce((a, b) => a + b.dia, 0) / v.length)}`
  }
  const count = points.reduce((n, p) => n + (p.morning ? 1 : 0) + (p.evening ? 1 : 0), 0)
  return [
    { label: `아침 ${s.days}일 평균`, value: avgOf('morning') ?? '–' },
    { label: `저녁 ${s.days}일 평균`, value: avgOf('evening') ?? '–' },
    { label: s.peak ? `최고 (${formatShort(s.peak.date)} ${SESSION_LABEL[s.peak.session]})` : '최고', value: s.peak ? `${s.peak.sys}/${s.peak.dia}` : '–' },
    { label: '기록', value: `${count}/${points.length * 2}회` },
  ]
})
</script>

<template>
  <div class="trend">
    <header class="head">
      <h1 class="title">추이</h1>
      <div class="seg" role="radiogroup" aria-label="기간">
        <button v-for="p in PERIODS" :key="p" type="button" role="radio" :aria-checked="days === p" :class="{ on: days === p }" @click="days = p">{{ p }}일</button>
      </div>
    </header>

    <div class="layout">
      <section class="card chart-card" aria-label="혈압 추이 그래프" :aria-busy="pending">
        <div class="chart-head">
          <div class="seg small" role="radiogroup" aria-label="보기">
            <button type="button" role="radio" :aria-checked="metric === 'sys'" :class="{ on: metric === 'sys' }" @click="metric = 'sys'">수축기</button>
            <button type="button" role="radio" :aria-checked="metric === 'dia'" :class="{ on: metric === 'dia' }" @click="metric = 'dia'">이완기</button>
          </div>
          <span class="keys">
            <span><i class="line morning" />아침</span>
            <span><i class="line evening" />저녁</span>
          </span>
        </div>
        <TrendChart v-if="summary" :series="summary.series" :metric="metric" />
        <div v-else class="chart-skel" />
      </section>

      <div class="side">
        <section v-if="summary" class="card headline">
          <InsightIcon :tone="summary.headline.tone" />
          <div>
            <b class="hl-title">{{ summary.headline.title }}</b>
            <p class="hl-body">{{ summary.headline.body }}</p>
          </div>
        </section>
        <InsightList v-if="summary?.insights.length" :items="summary.insights" />
      </div>
    </div>

    <section class="stats" aria-label="숫자 요약">
      <div v-for="s in stats" :key="s.label" class="card stat">
        <span class="stat-label">{{ s.label }}</span>
        <b class="stat-value">{{ s.value }}</b>
      </div>
    </section>

    <section class="card grades" aria-label="혈압 분류">
      <h2 class="g-title">혈압 분류 (대한고혈압학회)</h2>
      <GradeLegend ranges />
      <p class="g-note">수축기·이완기 중 높은 쪽 기준이에요. 화면 표시용이며 진단을 대신하지 않아요.</p>
    </section>
  </div>
</template>

<style scoped>
.trend { display: flex; flex-direction: column; gap: 12px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 4px; }
.title { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
.seg { display: flex; gap: 2px; padding: 3px; border-radius: 12px; background: #e6e9e4; }
.seg button { height: 36px; padding: 0 12px; border: 0; border-radius: 9px; background: transparent; color: var(--sub); font-size: 13px; font-weight: 500; }
.seg button.on { background: var(--card); color: var(--text); font-weight: 700; }
.seg.small button { height: 32px; }
.layout { display: flex; flex-direction: column; gap: 12px; }
.chart-card { display: flex; flex-direction: column; gap: 10px; padding: 14px 12px 10px; }
.chart-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.keys { display: flex; gap: 12px; font-size: 12px; color: var(--sub); }
.keys span { display: inline-flex; align-items: center; gap: 5px; }
.line { display: inline-block; width: 14px; height: 3px; border-radius: 2px; }
.line.morning { background: #1f5f55; }
.line.evening { background: #7fa8d6; }
.chart-skel { aspect-ratio: 640 / 240; border-radius: 12px; background: var(--soft); }
.side { display: flex; flex-direction: column; gap: 8px; }
.headline { display: flex; gap: 12px; align-items: flex-start; padding: 16px; }
.hl-title { font-size: 16px; }
.hl-body { font-size: 14px; line-height: 1.55; color: var(--text-2); }
.stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.stat { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border-radius: 14px; }
.stat-label { font-size: 12px; color: var(--sub); }
.stat-value { font-size: 18px; }
.grades { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.g-title { font-size: 14px; font-weight: 700; }
.grades :deep(.legend) { justify-content: flex-start; flex-direction: column; align-items: flex-start; font-size: 13px; }
.g-note { font-size: 12px; color: var(--mute); }

@media (min-width: 900px) {
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
  .chart-card { padding: 20px; }
  .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
</style>
