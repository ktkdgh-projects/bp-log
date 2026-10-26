<script setup lang="ts">
import type { SeriesPoint, Session } from '#shared/types'

// 한 달 추이. 아침이나 저녁 하나를 골라 수축기·이완기 두 선을 그린다 (두 선은 40 넘게 떨어져 있어 겹치지 않는다)
// session='both'면 아침(초록 계열)·저녁(보라 계열)을 겹쳐 네 선을 그린다
// 부드러운 곡선 + 옅은 그라데이션, 점은 오늘·최고·최저·짚은 날만
// fill: 부모 높이에 맞춰 그린다 (한 화면에 들어가게 할 때)
const props = defineProps<{ series: SeriesPoint[], session: Session | 'both', fill?: boolean }>()
const sessions = computed<Session[]>(() => (props.session === 'both' ? ['morning', 'evening'] : [props.session]))
const both = computed(() => props.session === 'both')

const today = kstToday()
const PAD = { top: 16, right: 16, bottom: 26, left: 34 }
// 폭 재기 · 짚은 날 · 말풍선 위치 (운영 그래프와 같이 쓴다)
const { root, svg, W, boxH, active, handlers, tipEl, tipW, place } = useChartPointer({ pad: PAD, count: () => chart.value.n })
const H = computed(() => (props.fill && boxH.value ? Math.max(180, boxH.value) : W.value < 480 ? 230 : 260))

type Metric = 'sys' | 'dia'
const TREND_COLOR: Record<Metric, string> = { sys: '#2a8c7a', dia: '#7c8fe0' }
// 겹쳐 볼 때: 시간대마다 색 계열을 나누고, 수축기는 진하게 · 이완기는 옅게
const OVERLAY_COLOR: Record<Session, Record<Metric, string>> = {
  morning: { sys: '#1f8a72', dia: '#62bfa9' },
  evening: { sys: '#6e56cf', dia: '#a493ea' },
}
const LABEL: Record<Metric, string> = { sys: '수축기', dia: '이완기' }
// 고혈압 기준 (수축기 140 위로는 은은하게 물든다)
const HIGH: Record<Metric, number> = { sys: 140, dia: 90 }
// 최고·최저 꼬리표 크기와 점에서 떨어진 거리(px)
const PILL_H = 18
const PILL_GAP = 7

type Pt = { i: number, cx: number, cy: number, v: number, session: Session }


// 수축기 구간(위)과 이완기 구간(아래) 사이의 빈 값 구간은 이만큼(px)으로 접는다
const BREAK_PX = 18
// 각 구간 위아래 여유 (mmHg)
const REGION_PAD = 4

const chart = computed(() => {
  const recs = props.series.flatMap(p => sessions.value.flatMap(s => (p[s] ? [p[s]!] : [])))
  const sysVals = recs.map(r => r.sys)
  const diaVals = recs.map(r => r.dia)
  const room = PILL_H + PILL_GAP
  // 맨 위·맨 아래는 최고·최저 이름표 자리
  const top = PAD.top + room
  const bottom = H.value - PAD.bottom
  const floor = bottom - room
  // 기준선 140·90은 각 구간에 늘 들어간다
  const hiU = Math.max(...sysVals, HIGH.sys) + REGION_PAD
  const b = Math.min(...sysVals, HIGH.sys) - REGION_PAD
  const a = Math.max(...diaVals, HIGH.dia) + REGION_PAD
  const loL = Math.min(...diaVals, HIGH.dia) - REGION_PAD
  // 두 구간이 겹치지 않으면(보통) 사이를 접어 두 선을 붙인다. 구간 안의 눈금 간격(1mmHg당 px)은 위아래가 같다
  const broken = a < b
  const span = broken ? (hiU - b) + (a - loL) : hiU - loL
  const k = (floor - top - (broken ? BREAK_PX : 0)) / Math.max(1, span)
  const breakTop = top + (hiU - b) * k
  const y = (v: number) => {
    if (!broken || v >= b) return top + (hiU - v) * k
    if (v <= a) return breakTop + BREAK_PX + (a - v) * k
    return breakTop + (b - v) / (b - a) * BREAK_PX
  }
  const n = props.series.length
  const plotW = W.value - PAD.left - PAD.right
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : i * plotW / (n - 1))
  const f = (v: number) => v.toFixed(1)

  // 빠진 날은 건너뛰고 앞뒤 기록을 곡선 하나로 잇는다. 수축기 그라데이션은 접힌 곳까지만
  // 겹쳐 볼 때는 색으로 아침·저녁을 나누고, 선이 많아 그라데이션은 칠하지 않는다
  const lines = sessions.value.flatMap(s => (['dia', 'sys'] as const).map((m) => {
    const pts = props.series
      .map((p, i) => (p[s] ? { i, cx: x(i), cy: y(p[s]![m]), v: p[s]![m], session: s } : null))
      .filter((d): d is Pt => !!d)
    const line = smoothPath(pts)
    const base = m === 'sys' && broken ? breakTop : bottom
    const area = pts.length > 1 && !both.value ? `${line} L${f(pts[pts.length - 1]!.cx)},${f(base)} L${f(pts[0]!.cx)},${f(base)} Z` : ''
    const color = both.value ? OVERLAY_COLOR[s][m] : TREND_COLOR[m]
    return { key: `${s}-${m}`, metric: m, color, pts, line, area, last: pts[pts.length - 1] ?? null }
  }))

  // 기준선 이름표 (오른쪽 끝)
  const refs = (['sys', 'dia'] as const).map(m => ({ metric: m, v: HIGH[m], y: y(HIGH[m]), w: 74 }))

  // 최고·최저 이름표: 선마다 최고와 최저를 둘 다 단다 (겹쳐 볼 때는 아침·저녁 각각)
  // 최고는 점 위 → 아래 → 왼쪽 → 오른쪽, 최저는 점 아래 → 위 → 왼쪽 → 오른쪽 순서로 빈자리를 찾는다
  const boxes = refs.map(r => ({ x: W.value - PAD.right - r.w - 4, y: r.y - 10, w: r.w + 4, h: 20 }))
  const overlaps = (bx: { x: number, y: number, w: number, h: number }) =>
    boxes.some(o => bx.x < o.x + o.w + 3 && o.x < bx.x + bx.w + 3 && bx.y < o.y + o.h + 2 && o.y < bx.y + bx.h + 2)
  const marks: { key: string, kind: 'max' | 'min', color: string, cx: number, cy: number, bx: number, by: number, w: number, label: string, v: number }[] = []
  const place = (l: (typeof lines)[number], kind: 'max' | 'min', q: Pt) => {
    // 꼬리표는 ▲(최고)·▼(최저) + 숫자만. 아침·저녁은 색으로 구분한다 (화면 읽기용 이름은 따로)
    const label = `${both.value ? `${SESSION_LABEL[q.session]} ` : ''}${kind === 'max' ? '최고' : '최저'}`
    const w = 26 + String(q.v).length * 7.5
    const clampX = (v: number) => Math.min(Math.max(v, PAD.left), W.value - PAD.right - w)
    const above = { x: clampX(q.cx - w / 2), y: q.cy - PILL_GAP - PILL_H }
    const below = { x: clampX(q.cx - w / 2), y: q.cy + PILL_GAP }
    const left = { x: q.cx - 10 - w, y: q.cy - PILL_H / 2 }
    const right = { x: q.cx + 10, y: q.cy - PILL_H / 2 }
    const order = kind === 'max' ? [above, below, left, right] : [below, above, left, right]
    const spot = order.find(c => c.x >= PAD.left && c.x + w <= W.value - PAD.right && c.y >= PAD.top - 4 && c.y + PILL_H <= bottom + 2 && !overlaps({ ...c, w, h: PILL_H }))
    if (!spot) return
    boxes.push({ ...spot, w, h: PILL_H })
    marks.push({ key: `${l.key}-${kind}`, kind, color: l.color, cx: q.cx, cy: q.cy, bx: spot.x, by: spot.y, w, label, v: q.v })
  }
  // 수축기부터, 최고를 먼저 놓아 자리 다툼에서 앞서게 한다
  const ordered = [...lines].sort((a, b) => (a.metric === b.metric ? 0 : a.metric === 'sys' ? -1 : 1))
  const ext = ordered.filter(l => l.pts.length).map((l) => {
    const max = l.pts.reduce((p, q) => (q.v >= p.v ? q : p))
    const min = l.pts.reduce((p, q) => (q.v <= p.v ? q : p))
    return { l, max, min: min.v === max.v ? null : min }
  })
  for (const e of ext) place(e.l, 'max', e.max)
  for (const e of ext) if (e.min) place(e.l, 'min', e.min)

  // 가로 눈금: 구간마다 따로 (10 간격이 너무 촘촘하면 20)
  const ticksIn = (from: number, to: number) => {
    const step = k * 10 >= 20 ? 10 : 20
    const out: { v: number, y: number }[] = []
    for (let v = Math.ceil(from / step) * step; v <= to; v += step) out.push({ v, y: y(v) })
    return out
  }
  const ticks = broken ? [...ticksIn(b, hiU), ...ticksIn(loL, a)] : ticksIn(loL, hiU)

  // 접힌 자리 표시: 세로축의 ≈ 와 아주 옅은 물결선
  let wave = ''
  if (broken) {
    const wy = breakTop + BREAK_PX / 2
    wave = `M${PAD.left},${f(wy)}`
    for (let wx = PAD.left + 6, up = true; wx <= W.value - PAD.right; wx += 6, up = !up) wave += ` L${wx},${f(wy + (up ? -2 : 2))}`
  }

  // 날짜 눈금: 오늘(마지막 날)부터 거꾸로 7일마다. 짧은 기간은 더 촘촘히
  const every = n > 14 ? 7 : n > 7 ? (W.value < 480 ? 3 : 2) : 1
  const xLabels = props.series
    .map((p, i) => ({ i, x: x(i), label: p.date === today ? '오늘' : formatShort(p.date) }))
    .filter(l => (n - 1 - l.i) % every === 0)

  return { n, x, lines, refs, marks, ticks, xLabels, bottom, wave, breakY: broken ? breakTop + BREAK_PX / 2 : null, empty: recs.length === 0 }
})

// 데이터나 보기가 바뀌면 말풍선을 닫는다
watch(() => [props.series, props.session], () => { active.value = null })

// 오늘 · 어제 · N일 전
function agoLabel(date: string) {
  const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000)
  return days <= 0 ? '오늘' : days === 1 ? '어제' : `${days}일 전`
}

const tip = computed(() => {
  const i = active.value
  if (i == null) return null
  const p = props.series[i]
  if (!p) return null
  const x = chart.value.x(i)
  return {
    i,
    x,
    ...place(x),
    // 짚은 날 점 (선마다 그날 기록이 있으면)
    dots: chart.value.lines.flatMap(l => l.pts.filter(pt => pt.i === i).map(pt => ({ key: l.key, color: l.color, cx: pt.cx, cy: pt.cy }))),
    rows: sessions.value.map((s) => {
      const v = p[s]
      return { session: s, sys: v?.sys ?? null, dia: v?.dia ?? null, pulse: v?.pulse ?? null, grade: v ? gradeOf(v.sys, v.dia) : null }
    }),
    month: `${Number(p.date.slice(5, 7))}월`,
    day: Number(p.date.slice(8, 10)),
    dow: weekday(p.date),
    ago: agoLabel(p.date),
  }
})
watch(() => tip.value && `${tip.value.month}${tip.value.day}|${tip.value.rows.map(r => `${r.sys}/${r.dia}`).join(',')}`, async (key) => {
  if (!key) {
    tipW.value = 0
    return
  }
  await nextTick()
  tipW.value = tipEl.value?.offsetWidth ?? 0
})
</script>

<template>
  <figure ref="root" class="chart" :class="{ fill }">
    <svg
      ref="svg"
      class="plot"
      :viewBox="`0 0 ${W} ${H}`"
      role="img"
      :aria-label="`${both ? '아침·저녁' : SESSION_LABEL[session as Session]} 수축기·이완기 추이`"
      v-on="handlers"
    >
      <defs>
        <linearGradient v-for="(c, m) in TREND_COLOR" :id="`soft-${m}`" :key="m" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" :stop-color="c" :stop-opacity="m === 'sys' ? 0.2 : 0.16" />
          <stop offset="0.7" :stop-color="c" stop-opacity="0.02" />
          <stop offset="1" :stop-color="c" stop-opacity="0" />
        </linearGradient>
        <!-- 수축기 고혈압 기준 위쪽: 위로 갈수록 살짝 진해지는 따뜻한 색 -->
        <linearGradient id="soft-high" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f6c9b3" stop-opacity="0.5" />
          <stop offset="1" stop-color="#f6c9b3" stop-opacity="0.1" />
        </linearGradient>
      </defs>

      <rect v-if="chart.refs[0]!.y > PAD.top" :x="PAD.left" :y="PAD.top" :width="W - PAD.left - PAD.right" :height="chart.refs[0]!.y - PAD.top" rx="10" fill="url(#soft-high)" />
      <template v-if="chart.breakY != null">
        <path :d="chart.wave" class="wave" />
        <text :x="PAD.left - 10" :y="chart.breakY + 4" text-anchor="end" class="tick brk">≈</text>
      </template>

      <g v-for="t in chart.ticks" :key="t.v">
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="t.y" :y2="t.y" class="grid" />
        <text :x="PAD.left - 10" :y="t.y + 4" text-anchor="end" class="tick">{{ t.v }}</text>
      </g>

      <!-- 고혈압 기준선 (수축기 140 · 이완기 90) -->
      <line v-for="r in chart.refs" :key="r.metric" :x1="PAD.left" :x2="W - PAD.right" :y1="r.y" :y2="r.y" class="high-line" />

      <!-- 짚은 날 세로선 -->
      <line v-if="tip" :x1="tip.x" :x2="tip.x" :y1="PAD.top" :y2="chart.bottom" class="cursor" />

      <g v-for="l in chart.lines" :key="l.key">
        <path v-if="l.area" :d="l.area" :fill="`url(#soft-${l.metric})`" />
        <path v-if="l.line" :d="l.line" fill="none" :stroke="l.color" class="line" />
        <circle v-if="l.pts.length === 1" :cx="l.pts[0]!.cx" :cy="l.pts[0]!.cy" r="3.5" :fill="l.color" />
        <template v-if="l.last && series[l.last.i]?.date === today">
          <circle :cx="l.last.cx" :cy="l.last.cy" r="10" :fill="l.color" class="today-halo" />
          <circle :cx="l.last.cx" :cy="l.last.cy" r="4.5" :fill="l.color" stroke="#fff" stroke-width="2" />
        </template>
      </g>

      <!-- 기준선 이름표는 선 위에 (가려지지 않게) -->
      <g v-for="r in chart.refs" :key="`p-${r.metric}`" :transform="`translate(${W - PAD.right - 4}, ${r.y})`">
        <rect :x="-r.w" y="-10" :width="r.w" height="20" rx="10" class="high-pill" />
        <text :x="-r.w / 2" y="4" text-anchor="middle" class="high-text">{{ LABEL[r.metric] }} {{ r.v }}</text>
      </g>

      <!-- 최고·최저: 점 + 둥근 이름표 -->
      <g v-for="mk in chart.marks" :key="mk.key" class="mark" :class="{ dim: tip }">
        <circle :cx="mk.cx" :cy="mk.cy" r="4" fill="#fff" :stroke="mk.color" stroke-width="2.5" />
        <rect :x="mk.bx" :y="mk.by" :width="mk.w" :height="PILL_H" rx="9" class="tag" :fill="mk.color" />
        <text :x="mk.bx + mk.w / 2" :y="mk.by + 13" text-anchor="middle" class="tag-text"><tspan class="tag-arrow">{{ mk.kind === 'max' ? '▲' : '▼' }}</tspan> {{ mk.v }}</text>
        <title>{{ mk.label }} {{ mk.v }}</title>
      </g>

      <!-- 짚은 날 점 -->
      <circle v-for="d in tip?.dots ?? []" :key="d.key" :cx="d.cx" :cy="d.cy" r="6" :fill="d.color" stroke="#fff" stroke-width="2.5" class="pop" />

      <text v-for="l in chart.xLabels" :key="l.i" :x="l.x" :y="H - 6" :text-anchor="l.i === 0 && chart.n > 1 ? 'start' : l.i === chart.n - 1 && chart.n > 1 ? 'end' : 'middle'" class="tick" :class="{ now: l.label === '오늘' }">{{ l.label }}</text>
      <text v-if="chart.empty" :x="W / 2" :y="H / 2" text-anchor="middle" class="empty">이 기간에 기록이 없어요</text>
    </svg>

    <Transition name="tip">
      <div v-if="tip" ref="tipEl" class="tip" :class="{ both }" :style="{ left: tip.left, '--caret': tip.caret, visibility: tipW ? 'visible' : 'hidden' }" aria-live="polite">
        <!-- 날짜: 작은 달력 칸 + 요일 · 며칠 전 -->
        <span class="tip-head">
          <span class="cal" aria-hidden="true"><small>{{ tip.month }}</small><b>{{ tip.day }}</b></span>
          <span class="when">
            <b :class="{ sun: tip.dow === 0, sat: tip.dow === 6 }">{{ WEEKDAYS[tip.dow] }}요일</b>
            <small :class="{ now: tip.ago === '오늘' }">{{ tip.ago }}</small>
          </span>
          <span v-if="!both" class="tip-session-pill" :class="session">
            <AppIcon :name="session === 'morning' ? 'sun' : 'moon'" :size="12" :stroke="2.4" />{{ SESSION_LABEL[session as Session] }}
          </span>
        </span>

        <!-- 아침·저녁 하나: 수축기·이완기 칸 + 등급 띠 -->
        <template v-if="!both">
          <template v-if="tip.rows[0]!.sys != null">
            <span class="cells">
              <span class="cell" :style="{ '--c': TREND_COLOR.sys }"><small>수축기</small><b>{{ tip.rows[0]!.sys }}</b></span>
              <span class="cell" :style="{ '--c': TREND_COLOR.dia }"><small>이완기</small><b>{{ tip.rows[0]!.dia }}</b></span>
            </span>
            <span class="grade-bar" :style="{ background: gradeVar(tip.rows[0]!.grade!, 'bg'), color: gradeVar(tip.rows[0]!.grade!, 'fg') }">
              <i class="g-dot" :style="{ background: gradeVar(tip.rows[0]!.grade!) }" />{{ GRADE_LABEL[tip.rows[0]!.grade!] }}
              <span v-if="tip.rows[0]!.pulse" class="pulse">♥ {{ tip.rows[0]!.pulse }}</span>
            </span>
          </template>
          <span v-else class="empty-day">이날은 기록이 없어요</span>
        </template>

        <!-- 겹쳐 보기: 시간대마다 한 줄 -->
        <span v-else class="tip-grid">
          <span />
          <small class="col">수축기</small>
          <small class="col">이완기</small>
          <span />
          <template v-for="r in tip.rows" :key="r.session">
            <span class="g-session" :style="{ color: OVERLAY_COLOR[r.session].sys }">
              <AppIcon :name="r.session === 'morning' ? 'sun' : 'moon'" :size="13" :stroke="2.2" />{{ SESSION_LABEL[r.session] }}
            </span>
            <template v-if="r.sys != null">
              <b class="num" :style="{ color: OVERLAY_COLOR[r.session].sys }">{{ r.sys }}</b>
              <b class="num" :style="{ color: OVERLAY_COLOR[r.session].dia }">{{ r.dia }}</b>
              <span class="g-grade" :style="{ color: gradeVar(r.grade!, 'fg') }"><i class="g-dot" :style="{ background: gradeVar(r.grade!) }" />{{ GRADE_LABEL[r.grade!] }}</span>
            </template>
            <span v-else class="none-row">기록 없음</span>
          </template>
        </span>
        <small v-if="tip.rows.some(r => r.sys != null)" class="unit-note">단위 mmHg</small>
      </div>
    </Transition>
  </figure>
</template>

<style scoped>
.chart { position: relative; margin: 0; }
.chart.fill { min-height: 180px; }
.chart.fill .plot { position: absolute; inset: 0; height: 100%; }
.plot { display: block; width: 100%; height: auto; overflow: visible; touch-action: pan-y; cursor: crosshair; user-select: none; }
.grid { stroke: rgb(23 32 29 / 0.08); stroke-dasharray: 1 6; stroke-linecap: round; stroke-width: 1.5; }
.tick { font-size: 11px; fill: var(--mute); font-family: var(--font); font-variant-numeric: tabular-nums; }
.tick.now { fill: var(--accent); font-weight: 700; }
.high-line { stroke: #e7a184; stroke-width: 1.5; stroke-dasharray: 4 5; stroke-linecap: round; }
.high-pill { fill: rgb(255 255 255 / 0.85); }
.high-text { font-size: 10.5px; font-weight: 700; fill: #c0603a; font-family: var(--font); }
.line { stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
.wave { fill: none; stroke: rgb(23 32 29 / 0.1); stroke-width: 1.2; stroke-linejoin: round; }
.tick.brk { font-size: 13px; font-weight: 700; }
.cursor { stroke: rgb(23 32 29 / 0.18); stroke-width: 1.5; stroke-dasharray: 2 4; stroke-linecap: round; }
.today-halo { opacity: 0.18; animation: today-pulse 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes today-pulse { 50% { opacity: 0.05; transform: scale(1.4); } }
.pop { animation: pop 200ms var(--ease) both; transform-box: fill-box; transform-origin: center; }
@keyframes pop { from { transform: scale(0.4); } }
.mark { transition: opacity var(--fast) ease; }
.mark.dim { opacity: 0.25; }
/* 최고·최저 꼬리표: 선 색으로 꽉 찬 작은 알약 */
.tag { filter: drop-shadow(0 2px 3px rgb(23 32 29 / 0.18)); }
.tag-text { font-size: 11.5px; font-weight: 700; fill: #fff; font-family: var(--font); font-variant-numeric: tabular-nums; }
.tag-arrow { font-size: 8px; }
.empty { font-size: 15px; fill: var(--sub); font-family: var(--font); }

/* 말풍선: 날짜 머리줄 + 값 + 등급, 아래 꼬리가 짚은 날을 가리킨다 */
.tip {
  position: absolute;
  top: 2px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  min-width: 200px;
  padding: 12px 12px 10px;
  border: 1px solid rgb(23 32 29 / 0.08);
  border-radius: 18px;
  background: #fff;
  color: var(--text-2);
  font-size: 13px;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
  box-shadow: 0 2px 6px rgb(23 32 29 / 0.06), 0 14px 32px rgb(23 32 29 / 0.14);
}
.tip::after {
  content: "";
  position: absolute;
  left: var(--caret, 50%);
  bottom: -6px;
  width: 11px;
  height: 11px;
  margin-left: -5.5px;
  border-right: 1px solid rgb(23 32 29 / 0.08);
  border-bottom: 1px solid rgb(23 32 29 / 0.08);
  background: #fff;
  transform: rotate(45deg);
}

/* 날짜 머리줄 */
.tip-head { display: flex; align-items: center; gap: 10px; }
.cal { display: flex; flex-direction: column; align-items: center; width: 38px; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
.cal small { align-self: stretch; padding: 1px 0; background: var(--accent); color: #fff; font-size: 10px; font-weight: 700; text-align: center; }
.cal b { padding: 1px 0 2px; font-size: 17px; line-height: 1.2; color: var(--text); font-variant-numeric: tabular-nums; }
.when { display: flex; flex-direction: column; gap: 1px; }
.when b { font-size: 14px; color: var(--text); }
.when b.sun { color: #b4462a; }
.when b.sat { color: #3e6fa3; }
.when small { font-size: 12px; color: var(--mute); }
.when small.now { color: var(--accent); font-weight: 700; }
.tip-session-pill { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.tip-session-pill.morning { background: #fdf0d8; color: #9a5b0b; }
.tip-session-pill.evening { background: #e3eef8; color: #2e6399; }

/* 하나만 볼 때: 선 색으로 물든 칸 두 개 + 등급 띠 */
.cells { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 7px 10px 8px; border-radius: 12px; background: color-mix(in srgb, var(--c) 9%, #fff); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 18%, transparent); }
.cell small { font-size: 11px; font-weight: 700; color: var(--c); }
.cell b { font-size: 24px; line-height: 1.05; letter-spacing: -0.03em; color: var(--text); font-variant-numeric: tabular-nums; }
.grade-bar { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 10px; font-size: 12px; font-weight: 700; }
.g-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.pulse { margin-left: auto; font-weight: 600; color: #b03a32; }
.empty-day { padding: 14px 0; border-radius: 12px; background: var(--soft); font-size: 13px; color: var(--mute); text-align: center; }

/* 겹쳐 볼 때: 작은 표 */
.tip-grid { display: grid; grid-template-columns: auto auto auto 1fr; align-items: center; gap: 5px 12px; padding-top: 8px; border-top: 1px solid var(--soft-2); }
.col { font-size: 10px; font-weight: 700; color: var(--mute); text-align: center; }
.g-session { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; }
.num { font-size: 19px; letter-spacing: -0.02em; text-align: center; font-variant-numeric: tabular-nums; }
.g-grade { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; }
.none-row { grid-column: span 3; font-size: 12px; color: var(--mute); }
.unit-note { align-self: flex-end; margin-top: -4px; font-size: 10px; color: var(--mute); }
.tip-enter-active, .tip-leave-active { transition: opacity 140ms ease, transform 160ms var(--ease); }
.tip-enter-from, .tip-leave-to { opacity: 0; transform: translateX(-50%) translateY(4px); }
</style>
