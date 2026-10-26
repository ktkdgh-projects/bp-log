<script setup lang="ts">
// 운영 페이지 그래프. line: 누적 값(부드러운 곡선+그라데이션), bars: 날마다 값(막대)
// 둘 다 주면 막대는 아래쪽에 작게 깔고 곡선이 위에 온다. 누르거나 마우스를 올리면 그날 값
interface AdminPoint { date: string, line?: number, bar?: number }
const props = defineProps<{
  points: AdminPoint[]
  lineLabel?: string
  barLabel?: string
  color: string
  barColor?: string
  unit: string
  height?: number
}>()

const H = computed(() => props.height ?? 200)
const PAD = { top: 14, right: 12, bottom: 24, left: 36 }
const today = kstToday()
// 폭 재기 · 짚은 날 · 말풍선 위치 (추이 그래프와 같이 쓴다)
const { root, svg, W, active, handlers, tipEl, tipW, place } = useChartPointer({ pad: PAD, count: () => chart.value.n })

const hasLine = computed(() => props.points.some(p => p.line != null))
const hasBar = computed(() => props.points.some(p => p.bar != null))

// 눈금 간격(1·2·5 단위)과 그 간격으로 올림한 최댓값. 눈금은 0부터 같은 간격으로 4–5개
function niceScale(v: number) {
  if (v <= 4) return { max: 4, step: 1 }
  const p = 10 ** Math.floor(Math.log10(v))
  const step = [1, 2, 5, 10].find(s => s * p >= v / 4)! * p
  return { max: Math.ceil(v / step) * step, step }
}

const chart = computed(() => {
  const n = props.points.length
  const plotW = W.value - PAD.left - PAD.right
  const bottom = H.value - PAD.bottom
  const plotH = bottom - PAD.top
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : i * plotW / (n - 1))
  const lineScale = niceScale(Math.max(0, ...props.points.map(p => p.line ?? 0)))
  const barScale = niceScale(Math.max(0, ...props.points.map(p => p.bar ?? 0)))
  // 곡선이 있으면 그 눈금을, 막대만 있으면 막대 눈금을 왼쪽에 쓴다. 같이 그릴 땐 막대는 아래 40%만
  const axis = hasLine.value ? lineScale : barScale
  const yLine = (v: number) => bottom - v / lineScale.max * plotH
  const barArea = hasLine.value ? plotH * 0.4 : plotH
  const barW = Math.max(2, Math.min(14, plotW / Math.max(1, n) * 0.6))
  const bars = hasBar.value
    ? props.points.map((p, i) => {
        const h = (p.bar ?? 0) / barScale.max * barArea
        return { i, x: x(i) - barW / 2, y: bottom - h, w: barW, h }
      }).filter(b => b.h > 0)
    : []
  const pts = props.points.map((p, i) => (p.line != null ? { i, cx: x(i), cy: yLine(p.line) } : null)).filter((p): p is { i: number, cx: number, cy: number } => !!p)
  const line = smoothPath(pts)
  const area = pts.length > 1 ? `${line} L${pts[pts.length - 1]!.cx.toFixed(1)},${bottom} L${pts[0]!.cx.toFixed(1)},${bottom} Z` : ''
  const ticks: { v: number, y: number }[] = []
  for (let v = 0; v <= axis.max; v += axis.step) ticks.push({ v, y: bottom - v / axis.max * plotH })
  const every = n > 60 ? 14 : n > 14 ? 7 : 1
  const xLabels = props.points
    .map((p, i) => ({ i, x: x(i), label: p.date === today ? '오늘' : formatShort(p.date) }))
    .filter(l => (n - 1 - l.i) % every === 0)
  return { n, x, bottom, bars, pts, line, area, ticks, xLabels }
})

watch(() => props.points, () => { active.value = null })

const tip = computed(() => {
  const i = active.value
  if (i == null) return null
  const p = props.points[i]
  if (!p) return null
  const x = chart.value.x(i)
  return {
    i,
    x,
    ...place(x),
    date: `${formatShort(p.date)} ${WEEKDAYS[weekday(p.date)]}`,
    line: p.line,
    bar: p.bar,
  }
})
const gradId = useId()
</script>

<template>
  <figure ref="root" class="admin-chart">
    <svg ref="svg" class="plot" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="lineLabel ?? barLabel" v-on="handlers">
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" :stop-color="color" stop-opacity="0.22" />
          <stop offset="1" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g v-for="t in chart.ticks" :key="t.y">
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="t.y" :y2="t.y" class="grid" />
        <text :x="PAD.left - 8" :y="t.y + 4" text-anchor="end" class="tick">{{ t.v }}</text>
      </g>
      <line v-if="tip" :x1="tip.x" :x2="tip.x" :y1="PAD.top" :y2="chart.bottom" class="cursor" />
      <rect v-for="b in chart.bars" :key="b.i" :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="2" :fill="barColor ?? color" :opacity="tip && tip.i !== b.i ? 0.45 : 1" />
      <path v-if="chart.area" :d="chart.area" :fill="`url(#${gradId})`" />
      <path v-if="chart.line" :d="chart.line" fill="none" :stroke="color" class="line" />
      <template v-for="p in chart.pts" :key="p.i">
        <circle v-if="tip?.i === p.i || (p.i === chart.n - 1 && !tip)" :cx="p.cx" :cy="p.cy" r="5" :fill="color" stroke="#fff" stroke-width="2" />
      </template>
      <text v-for="l in chart.xLabels" :key="l.i" :x="l.x" :y="chart.bottom + 18" :text-anchor="l.i === 0 ? 'start' : l.i === chart.n - 1 ? 'end' : 'middle'" class="tick" :class="{ now: l.label === '오늘' }">{{ l.label }}</text>
    </svg>
    <Transition name="tip">
      <div v-if="tip" ref="tipEl" class="tip" :style="{ left: tip.left, '--caret': tip.caret, visibility: tipW ? 'visible' : 'hidden' }" aria-live="polite">
        <b class="tip-date">{{ tip.date }}</b>
        <span v-if="tip.line != null" class="tip-row"><i :style="{ background: color }" />{{ lineLabel }} <b>{{ tip.line.toLocaleString() }}{{ unit }}</b></span>
        <span v-if="tip.bar != null" class="tip-row"><i :style="{ background: barColor ?? color }" />{{ barLabel }} <b>{{ tip.bar.toLocaleString() }}{{ unit }}</b></span>
      </div>
    </Transition>
  </figure>
</template>

<style scoped>
.admin-chart { position: relative; margin: 0; }
.plot { display: block; width: 100%; height: auto; overflow: visible; touch-action: pan-y; cursor: crosshair; user-select: none; }
.grid { stroke: rgb(23 32 29 / 0.08); stroke-dasharray: 1 6; stroke-linecap: round; stroke-width: 1.5; }
.tick { font-size: 11px; fill: var(--mute); font-family: var(--font); font-variant-numeric: tabular-nums; }
.tick.now { fill: var(--accent); font-weight: 700; }
.line { stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
.cursor { stroke: rgb(23 32 29 / 0.18); stroke-width: 1.5; stroke-dasharray: 2 4; }
.tip {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 9px 12px;
  border: 1px solid rgb(23 32 29 / 0.08);
  border-radius: 14px;
  background: #fff;
  font-size: 12px;
  color: var(--sub);
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
  box-shadow: 0 2px 6px rgb(23 32 29 / 0.06), 0 12px 28px rgb(23 32 29 / 0.14);
}
.tip::after { content: ""; position: absolute; left: var(--caret, 50%); bottom: -6px; width: 11px; height: 11px; margin-left: -5.5px; border-right: 1px solid rgb(23 32 29 / 0.08); border-bottom: 1px solid rgb(23 32 29 / 0.08); background: #fff; transform: rotate(45deg); }
.tip-date { font-size: 13px; color: var(--text); }
.tip-row { display: flex; align-items: center; gap: 6px; }
.tip-row i { width: 8px; height: 8px; border-radius: 50%; }
.tip-row b { margin-left: auto; padding-left: 10px; font-size: 14px; color: var(--text); font-variant-numeric: tabular-nums; }
.tip-enter-active, .tip-leave-active { transition: opacity 140ms ease, transform 160ms var(--ease); }
.tip-enter-from, .tip-leave-to { opacity: 0; transform: translateX(-50%) translateY(4px); }
</style>
