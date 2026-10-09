<script setup lang="ts">
import type { SeriesPoint, Session } from '#shared/types'

// fill: 부모 높이에 맞춰 그린다 (한 화면에 들어가게 할 때)
const props = defineProps<{ series: SeriesPoint[], metric: 'sys' | 'dia', fill?: boolean }>()

// 실제 폭에 맞춰 그려서 휴대폰에서도 글자가 작아지지 않게 한다
const root = ref<HTMLElement | null>(null)
const W = ref(640)
const boxH = ref(0)
const H = computed(() => (props.fill && boxH.value ? Math.max(160, boxH.value) : W.value < 480 ? 210 : 240))
const today = kstToday()
const PAD = { top: 14, right: 12, bottom: 28, left: 34 }
let observer: ResizeObserver | undefined
onMounted(() => {
  if (!root.value) return
  observer = new ResizeObserver(([entry]) => {
    if (!entry) return
    W.value = Math.max(280, Math.round(entry.contentRect.width))
    boxH.value = Math.round(entry.contentRect.height)
  })
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

// 최고·최저 라벨 색 (저녁은 선보다 진하게 해서 흰 글씨가 읽히게)
const MARK: Record<Session, string> = { morning: '#1f5f55', evening: '#2e6399' }

// 점과 라벨 사이 거리(px). 점선으로 이어서 어느 점인지 보이게 한다
const LABEL_GAP = 40

const LINES = {
  sys: [{ v: 140, label: '140 고혈압', strong: true }, { v: 130, label: '130', strong: false }],
  dia: [{ v: 90, label: '90 고혈압', strong: true }, { v: 80, label: '80', strong: false }],
} as const

const chart = computed(() => {
  const m = props.metric
  const values = props.series.flatMap(p => [p.morning?.[m], p.evening?.[m]]).filter((v): v is number => v != null)
  const refs = LINES[m].map(l => l.v)
  // 최고·최저 라벨이 들어갈 자리(점선 + 라벨, 위아래 약 LABEL_GAP + 22px)만큼 범위를 넓힌다
  const rawLo = Math.min(...values, ...refs)
  const rawHi = Math.max(...values, ...refs)
  const room = LABEL_GAP + 22
  const extra = Math.max(6, (rawHi - rawLo) * room / Math.max(60, H.value - PAD.top - PAD.bottom - room * 2))
  const lo = Math.floor((rawLo - extra) / 10) * 10
  const hi = Math.ceil((rawHi + extra) / 10) * 10
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

  // 아침·저녁 선마다 최고·최저 점에 숫자 라벨 (겹치면 위/아래로 비켜 놓는다)
  const boxes: { x: number, y: number, w: number, h: number }[] = []
  const overlaps = (b: { x: number, y: number, w: number, h: number }) =>
    boxes.some(o => b.x < o.x + o.w + 2 && o.x < b.x + b.w + 2 && b.y < o.y + o.h + 2 && o.y < b.y + b.h + 2)
  const marks: { key: string, session: Session, kind: 'max' | 'min', cx: number, cy: number, bx: number, by: number, w: number, h: number, text: string, date: string }[] = []
  for (const session of ['morning', 'evening'] as const) {
    const pts = props.series.map((p, i) => ({ i, date: p.date, v: p[session]?.[m] })).filter((q): q is { i: number, date: string, v: number } => q.v != null)
    if (!pts.length) continue
    const max = pts.reduce((a, b) => (b.v >= a.v ? b : a))
    const min = pts.reduce((a, b) => (b.v <= a.v ? b : a))
    for (const [kind, q] of [['max', max], ['min', min]] as const) {
      if (kind === 'min' && min.v === max.v) continue
      const text = `${kind === 'max' ? '최고' : '최저'} ${q.v}`
      const w = 34 + String(q.v).length * 8
      const h = 20
      const cx = x(q.i)
      const cy = y(q.v)
      const bx = Math.min(Math.max(cx - w / 2, PAD.left), W.value - PAD.right - w)
      let by = kind === 'max' ? cy - LABEL_GAP - h : cy + LABEL_GAP
      for (let tries = 0; tries < 4 && overlaps({ x: bx, y: by, w, h }); tries++) by += kind === 'max' ? -(h + 4) : h + 4
      boxes.push({ x: bx, y: by, w, h })
      marks.push({ key: `${session}-${kind}`, session, kind, cx, cy, bx, by, w, h, text, date: q.date })
    }
  }

  const step = hi - lo > 60 ? 20 : 10
  const ticks: { v: number, y: number }[] = []
  for (let v = lo; v <= hi; v += step) ticks.push({ v, y: y(v) })

  const labelEvery = n > 20 ? 7 : n > 10 ? (W.value < 480 ? 4 : 3) : (W.value < 480 && n > 7 ? 2 : 1)
  const xLabels = props.series
    .map((p, i) => ({ i, x: x(i), label: p.date === today ? '오늘' : formatShort(p.date) }))
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
    marks,
    empty: values.length === 0,
  }
})
</script>

<template>
  <figure ref="root" class="chart" :class="{ fill }">
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
      <g v-for="mk in chart.marks" :key="mk.key" class="mark">
        <line :x1="mk.cx" :y1="mk.cy" :x2="mk.bx + mk.w / 2" :y2="mk.kind === 'max' ? mk.by + mk.h : mk.by" :stroke="MARK[mk.session]" stroke-width="1.5" stroke-dasharray="3 3" />
        <circle :cx="mk.cx" :cy="mk.cy" r="6" fill="#fff" :stroke="MARK[mk.session]" stroke-width="3" />
        <rect :x="mk.bx" :y="mk.by" :width="mk.w" :height="mk.h" rx="6" :fill="MARK[mk.session]" />
        <text :x="mk.bx + mk.w / 2" :y="mk.by + 14" text-anchor="middle" class="mark-text">{{ mk.text }}</text>
        <title>{{ formatShort(mk.date) }} {{ SESSION_LABEL[mk.session] }} {{ mk.text }}</title>
      </g>
      <text v-for="l in chart.xLabels" :key="l.i" :x="l.x" :y="H - 8" :text-anchor="l.i === 0 ? 'start' : 'middle'" class="tick">{{ l.label }}</text>
      <text v-if="chart.empty" :x="W / 2" :y="H / 2" text-anchor="middle" class="empty">이 기간에 기록이 없어요</text>
    </svg>
  </figure>
</template>

<style scoped>
.chart { margin: 0; }
.chart.fill { position: relative; min-height: 160px; }
.chart.fill svg { position: absolute; inset: 0; height: 100%; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
.tick { font-size: 12px; fill: var(--sub); font-family: var(--font); }
.ref { font-size: 12px; fill: #8a3510; font-weight: 600; font-family: var(--font); }
.mark-text { font-size: 12px; font-weight: 700; fill: #fff; font-family: var(--font); }
.empty { font-size: 15px; fill: var(--sub); font-family: var(--font); }
</style>
