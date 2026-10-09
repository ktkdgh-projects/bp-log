<script setup lang="ts">
import type { SeriesPoint } from '#shared/types'

const props = defineProps<{ series: SeriesPoint[], metric: 'sys' | 'dia' }>()

// 실제 폭에 맞춰 그려서 휴대폰에서도 글자가 작아지지 않게 한다
const root = ref<HTMLElement | null>(null)
const W = ref(640)
const H = computed(() => (W.value < 480 ? 210 : 240))
const PAD = { top: 14, right: 12, bottom: 28, left: 34 }
let observer: ResizeObserver | undefined
onMounted(() => {
  if (!root.value) return
  observer = new ResizeObserver(([entry]) => {
    if (entry) W.value = Math.max(280, Math.round(entry.contentRect.width))
  })
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

const LINES = {
  sys: [{ v: 140, label: '140 고혈압', strong: true }, { v: 130, label: '130', strong: false }],
  dia: [{ v: 90, label: '90 고혈압', strong: true }, { v: 80, label: '80', strong: false }],
} as const

const chart = computed(() => {
  const m = props.metric
  const values = props.series.flatMap(p => [p.morning?.[m], p.evening?.[m]]).filter((v): v is number => v != null)
  const refs = LINES[m].map(l => l.v)
  const lo = Math.floor((Math.min(...values, ...refs) - 6) / 10) * 10
  const hi = Math.ceil((Math.max(...values, ...refs) + 6) / 10) * 10
  const n = props.series.length
  const x = (i: number) => PAD.left + (n <= 1 ? 0 : i * (W.value - PAD.left - PAD.right) / (n - 1))
  const y = (v: number) => PAD.top + (hi - v) / (hi - lo) * (H.value - PAD.top - PAD.bottom)

  // 빠진 날은 선을 끊지 않고 이어 그리되 점은 찍지 않는다
  const line = (session: 'morning' | 'evening') => props.series
    .map((p, i) => (p[session] ? `${x(i).toFixed(1)},${y(p[session]![m]).toFixed(1)}` : null))
    .filter(Boolean)
    .join(' ')
  const dots = (session: 'morning' | 'evening') => props.series
    .map((p, i) => (p[session] ? { key: `${session}${i}`, cx: x(i), cy: y(p[session]![m]), v: p[session]![m], date: p.date } : null))
    .filter((d): d is NonNullable<typeof d> => !!d)

  const step = hi - lo > 60 ? 20 : 10
  const ticks: { v: number, y: number }[] = []
  for (let v = lo; v <= hi; v += step) ticks.push({ v, y: y(v) })

  const labelEvery = n > 20 ? 7 : n > 10 ? (W.value < 480 ? 4 : 3) : (W.value < 480 && n > 7 ? 2 : 1)
  const xLabels = props.series
    .map((p, i) => ({ i, x: x(i), label: i === n - 1 ? '오늘' : formatShort(p.date) }))
    .filter(l => l.i === n - 1 || (n - 1 - l.i) % labelEvery === 0)

  return {
    morning: line('morning'),
    evening: line('evening'),
    morningDots: dots('morning'),
    eveningDots: dots('evening'),
    refs: LINES[m].map(l => ({ ...l, y: y(l.v) })),
    bandBottom: y(LINES[m][0].v),
    ticks,
    xLabels,
    empty: values.length === 0,
  }
})
</script>

<template>
  <figure ref="root" class="chart">
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="`아침·저녁 ${metric === 'sys' ? '수축기' : '이완기'} 추이`">
      <rect :x="PAD.left" :y="PAD.top" :width="W - PAD.left - PAD.right" :height="Math.max(0, chart.bandBottom - PAD.top)" fill="#fbede4" />
      <g v-for="t in chart.ticks" :key="t.v">
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="t.y" :y2="t.y" stroke="#edefec" />
        <text :x="PAD.left - 8" :y="t.y + 4" text-anchor="end" class="tick">{{ t.v }}</text>
      </g>
      <g v-for="r in chart.refs" :key="r.v">
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="r.y" :y2="r.y" :stroke="r.strong ? '#d2602a' : '#e39a3b'" stroke-dasharray="5 5" :stroke-opacity="r.strong ? 1 : 0.6" />
        <text v-if="r.strong" :x="W - PAD.right - 4" :y="r.y - 6" text-anchor="end" class="ref">{{ r.label }}</text>
      </g>
      <polyline :points="chart.evening" fill="none" stroke="#7fa8d6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
      <polyline :points="chart.morning" fill="none" stroke="#1f5f55" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
      <circle v-for="d in chart.eveningDots" :key="d.key" :cx="d.cx" :cy="d.cy" r="4" fill="#7fa8d6" stroke="#fff" stroke-width="2"><title>{{ formatShort(d.date) }} 저녁 {{ d.v }}</title></circle>
      <circle v-for="d in chart.morningDots" :key="d.key" :cx="d.cx" :cy="d.cy" r="4" fill="#1f5f55" stroke="#fff" stroke-width="2"><title>{{ formatShort(d.date) }} 아침 {{ d.v }}</title></circle>
      <text v-for="l in chart.xLabels" :key="l.i" :x="l.x" :y="H - 8" :text-anchor="l.i === 0 ? 'start' : 'middle'" class="tick">{{ l.label }}</text>
      <text v-if="chart.empty" :x="W / 2" :y="H / 2" text-anchor="middle" class="empty">이 기간에 기록이 없어요</text>
    </svg>
  </figure>
</template>

<style scoped>
.chart { margin: 0; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
.tick { font-size: 12px; fill: var(--sub); font-family: var(--font); }
.ref { font-size: 12px; fill: #8a3510; font-weight: 600; font-family: var(--font); }
.empty { font-size: 15px; fill: var(--sub); font-family: var(--font); }
</style>
