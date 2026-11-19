<script setup lang="ts">
import type { MonthReport, ReportFactorKey } from '#shared/types'

// 월간 분석 리포트: 점수 → 핵심 지표 → 요일 · 생활 습관 → 분석 노트 (통계로 본 경향이며 진단이 아니다)
const props = defineProps<{ report: MonthReport }>()

const mon = computed(() => Number(props.report.month.slice(5, 7)))
const r = computed(() => props.report)

// 점수 고리
const RING_R = 42
const RING_C = 2 * Math.PI * RING_R
const toneColor = computed(() => INSIGHT_TONE[r.value.tone].fg)

const FACTOR_ICON: Record<ReportFactorKey, string> = { level: 'pulse', trend: 'trend', stability: 'check', habit: 'calendar' }
// 점수가 낮을수록 따뜻한 색
const scoreColor = (s: number) => (s >= 80 ? 'var(--accent)' : s >= 60 ? 'var(--g-elevated)' : s >= 40 ? 'var(--g-prehigh)' : 'var(--g-stage1)')

// 등급별 기록 수 막대 (적은 등급은 이름을 숨긴다)
const gradeBar = computed(() => GRADES.filter(g => r.value.grades[g] > 0).map(g => ({
  grade: g,
  count: r.value.grades[g],
  pct: Math.round(r.value.grades[g] / r.value.readings * 100),
})))

const prevDelta = computed(() => (r.value.prev && r.value.average ? r.value.average.sys - r.value.prev.sys : null))
const prevMon = computed(() => (r.value.prev ? Number(r.value.prev.month.slice(5, 7)) : 0))

// 요일 막대: 평균이 있는 요일만 높이를 그리고 가장 높은·낮은 요일을 표시한다
const dow = computed(() => {
  const vals = r.value.weekdays.flatMap(w => (w.sys == null ? [] : [w.sys]))
  if (vals.length < 4) return null
  const hi = Math.max(...vals)
  const lo = Math.min(...vals)
  // 막대 밑동을 넉넉히 잡아 몇 차이 안 나는 요일이 크게 달라 보이지 않게
  const floor = Math.min(lo - 15, hi - 30)
  // 4 이상 차이 날 때만 가장 높은·낮은 요일을 칠한다
  const marked = hi - lo >= 4
  // 월요일부터
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map((d) => {
    const w = r.value.weekdays[d]!
    return { ...w, h: w.sys == null ? 0 : Math.max(12, (w.sys - floor) / (hi - floor) * 100), hi: marked && w.sys === hi, lo: marked && w.sys === lo }
  })
})

// 생활 습관 영향: 가장 큰 차이를 막대 끝으로
const tagMax = computed(() => Math.max(6, ...r.value.tags.map(t => Math.abs(t.diff))))
const tagFromMon = computed(() => Number(r.value.tagFrom.slice(5, 7)))
</script>

<template>
  <div class="report">
    <!-- 기록이 모자라면 얼마나 더 필요한지만 -->
    <section v-if="!r.enough" class="card need">
      <InsightIcon tone="empty" :size="36" />
      <div>
        <b>{{ mon }}월 분석은 기록이 {{ r.need }}번 쌓이면 볼 수 있어요</b>
        <p>지금 {{ r.readings }}번 · {{ r.need - r.readings }}번 더 재면 추세·변동성·요일 패턴을 분석해 드려요.</p>
        <span class="need-bar"><span :style="{ width: `${r.readings / r.need * 100}%` }" /></span>
      </div>
    </section>

    <template v-else>
      <!-- 종합 점수 -->
      <section class="card score" :style="{ '--tone': toneColor, '--tone-bg': INSIGHT_TONE[r.tone].bg }" aria-label="종합 점수">
        <div class="score-top">
          <svg class="ring" viewBox="0 0 100 100" role="img" :aria-label="`${r.score}점`">
            <circle cx="50" cy="50" :r="RING_R" class="ring-bg" />
            <circle cx="50" cy="50" :r="RING_R" class="ring-fg" :stroke-dasharray="`${RING_C * r.score / 100} ${RING_C}`" />
            <text x="50" y="50" text-anchor="middle" dominant-baseline="central" class="ring-num">{{ r.score }}</text>
          </svg>
          <div class="score-text">
            <span class="eyebrow">{{ mon }}월 혈압 관리 점수</span>
            <b class="score-label">{{ r.label }}</b>
            <span class="score-sub">기록 {{ r.readings }}번을 분석했어요</span>
          </div>
        </div>
        <ul class="factors">
          <li v-for="f in r.factors" :key="f.key">
            <span class="f-name"><AppIcon :name="FACTOR_ICON[f.key]" :size="14" :stroke="2.2" />{{ f.label }}</span>
            <span class="f-bar"><span :style="{ width: `${f.score}%`, background: scoreColor(f.score) }" /></span>
            <b class="f-value">{{ f.value }}</b>
            <span class="f-note">{{ f.note }}</span>
          </li>
        </ul>
      </section>

      <!-- 핵심 지표 -->
      <section class="metrics" aria-label="핵심 지표">
        <div class="card metric">
          <span class="m-label">추세 <small>주당 수축기</small></span>
          <template v-if="r.trends.length">
            <span v-for="t in r.trends" :key="t.session" class="m-row">
              <AppIcon :name="t.session === 'morning' ? 'sun' : 'moon'" :size="13" :stroke="2.2" />
              <b :class="t.perWeek <= -1 ? 'down' : t.perWeek >= 1 ? 'up' : ''">{{ signed(t.perWeek) }}</b>
              <small>{{ t.from }}→{{ t.to }}</small>
            </span>
          </template>
          <span v-else class="m-empty">기록이 더 쌓이면 보여요</span>
        </div>

        <div class="card metric">
          <span class="m-label">목표 범위 <small>130/80 미만</small></span>
          <b class="m-value">{{ r.inTarget }}<small>%</small></b>
          <span class="grades" aria-hidden="true">
            <span v-for="g in gradeBar" :key="g.grade" :style="{ flex: g.count, background: gradeVar(g.grade) }" :title="`${GRADE_LABEL[g.grade]} ${g.count}번`" />
          </span>
        </div>

        <div class="card metric">
          <span class="m-label">{{ prevMon ? `${prevMon}월 대비` : '지난달 대비' }}</span>
          <template v-if="r.prev && prevDelta != null">
            <b class="m-value" :class="prevDelta <= -3 ? 'down' : prevDelta >= 3 ? 'up' : ''">{{ signed(prevDelta) }}</b>
            <small class="m-sub">{{ r.prev.sys }}/{{ r.prev.dia }} → {{ r.average!.sys }}/{{ r.average!.dia }}</small>
          </template>
          <span v-else class="m-empty">지난달 기록이 적어요</span>
        </div>

        <div class="card metric">
          <span class="m-label">맥압 · 맥박</span>
          <b class="m-value" :class="{ up: (r.pulse?.pressure ?? 0) >= 60 }">{{ r.pulse?.pressure }}<small> · {{ r.pulse?.rate ?? '–' }}회</small></b>
          <small class="m-sub">{{ r.gap != null ? `아침-저녁 차이 ${signed(r.gap)}` : '수축기-이완기 · 분당' }}</small>
        </div>
      </section>

      <!-- 등급 분포 -->
      <section class="card block" aria-label="등급별 기록">
        <h3 class="b-title">등급별 기록 <small>{{ r.readings }}번</small></h3>
        <ul class="dist">
          <li v-for="g in gradeBar" :key="g.grade">
            <span class="d-name"><i :style="{ background: gradeVar(g.grade) }" />{{ GRADE_LABEL[g.grade] }}</span>
            <span class="d-bar"><span :style="{ width: `${g.pct}%`, background: gradeVar(g.grade) }" /></span>
            <b class="d-pct">{{ g.pct }}%</b>
          </li>
        </ul>
      </section>

      <!-- 요일별 -->
      <section v-if="dow" class="card block" aria-label="요일별 평균">
        <h3 class="b-title">요일별 수축기 평균</h3>
        <div class="dow">
          <span v-for="d in dow" :key="d.dow" class="dow-col" :class="{ hi: d.hi, lo: d.lo }">
            <small class="dow-v">{{ d.sys ?? '' }}</small>
            <span class="dow-track"><span class="dow-bar" :style="{ height: `${d.h}%` }" /></span>
            <span class="dow-name" :class="{ sun: d.dow === 0, sat: d.dow === 6 }">{{ WEEKDAYS[d.dow] }}</span>
          </span>
        </div>
      </section>
    </template>

    <!-- 생활 습관 영향 (기록이 적은 달도 두 달 치 메모로 볼 수 있다) -->
    <section v-if="r.tags.length" class="card block" aria-label="생활 습관 영향">
      <h3 class="b-title">생활 습관과 다음 날 아침 <small>{{ tagFromMon }}월부터 메모 기준</small></h3>
      <ul class="tags">
        <li v-for="t in r.tags" :key="t.tag">
          <span class="t-name">{{ t.tag }}</span>
          <span class="t-axis">
            <span class="t-bar" :class="t.diff < 0 ? 'good' : 'bad'" :style="{ width: `${Math.abs(t.diff) / tagMax * 50}%` }" />
          </span>
          <b class="t-diff" :class="t.diff < 0 ? 'good' : t.diff > 0 ? 'bad' : ''">{{ signed(t.diff) }}</b>
          <small class="t-days">{{ t.days }}일</small>
        </li>
      </ul>
      <p class="hint">태그를 단 날과 안 단 날, 다음 날 아침 수축기 평균 차이예요</p>
    </section>

    <!-- 분석 노트 -->
    <section v-if="r.findings.length" class="card block" aria-label="분석 노트">
      <h3 class="b-title">분석 노트</h3>
      <ol class="notes">
        <li v-for="(n, i) in r.findings" :key="i" :style="{ '--tone-bg': INSIGHT_TONE[n.tone].bg, '--tone-fg': INSIGHT_TONE[n.tone].fg }">
          <span class="n-num">{{ i + 1 }}</span>
          <div>
            <b>{{ n.title }}</b>
            <p>{{ n.body }}</p>
          </div>
        </li>
      </ol>
    </section>

    <p class="disclaimer"><AppIcon name="info" :size="12" />통계로 본 경향일 뿐, 진단은 의사와 상의하세요</p>
  </div>
</template>

<style scoped>
.report { display: flex; flex-direction: column; gap: 10px; }
.card { border: 1px solid var(--line); }
.need { display: flex; gap: 12px; align-items: flex-start; padding: 16px; }
.need b { font-size: 15px; }
.need p { margin: 4px 0 10px; font-size: 13px; line-height: 1.5; color: var(--text-2); }
.need-bar, .f-bar, .d-bar { display: block; height: 6px; border-radius: 3px; background: var(--soft-2); overflow: hidden; }
.need-bar span, .f-bar span, .d-bar span { display: block; height: 100%; border-radius: 3px; background: var(--accent); transition: width 0.5s ease; }

/* 종합 점수 */
.score { display: flex; flex-direction: column; gap: 14px; padding: 16px; background: linear-gradient(150deg, var(--tone-bg) 0%, var(--card) 70%); }
.score-top { display: flex; align-items: center; gap: 14px; }
.ring { flex-shrink: 0; width: 84px; height: 84px; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: rgb(0 0 0 / 0.06); stroke-width: 9; }
.ring-fg { fill: none; stroke: var(--tone); stroke-width: 9; stroke-linecap: round; transition: stroke-dasharray 0.6s ease; }
.ring-num { transform: rotate(90deg); transform-origin: 50px 50px; font-size: 28px; font-weight: 800; fill: var(--text); font-family: var(--font); letter-spacing: -0.03em; }
.score-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.eyebrow { font-size: 12px; font-weight: 600; color: var(--sub); }
.score-label { font-size: 22px; letter-spacing: -0.02em; color: var(--tone); }
.score-sub { font-size: 12px; color: var(--mute); }
.factors { display: flex; flex-direction: column; gap: 9px; margin: 0; padding: 0; list-style: none; }
.factors li { display: grid; grid-template-columns: 76px minmax(0, 1fr) auto; align-items: center; gap: 2px 10px; }
.f-name { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; color: var(--text-2); }
.f-value { font-size: 13px; font-variant-numeric: tabular-nums; text-align: right; }
.f-note { grid-column: 2 / -1; font-size: 11px; color: var(--mute); }

/* 핵심 지표 2×2 */
.metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.metric { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: 12px 13px; border-radius: 16px; }
.m-label { font-size: 12px; font-weight: 600; color: var(--sub); }
.m-label small { margin-left: 2px; font-weight: 400; color: var(--mute); }
.m-value { font-size: 22px; line-height: 1.15; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.m-value small { font-size: 13px; font-weight: 500; color: var(--sub); }
.m-row { display: flex; align-items: center; gap: 5px; color: var(--sub); }
.m-row b { font-size: 17px; color: var(--text); font-variant-numeric: tabular-nums; }
.m-row small, .m-sub { overflow: hidden; font-size: 11px; color: var(--mute); text-overflow: ellipsis; white-space: nowrap; }
.down { color: var(--accent) !important; }
.up { color: var(--g-stage1-fg) !important; }
.m-empty { font-size: 12px; color: var(--mute); }
.grades { display: flex; gap: 2px; height: 6px; margin-top: auto; border-radius: 3px; overflow: hidden; }

/* 블록 공통 */
.block { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border-radius: 18px; }
.b-title { font-size: 14px; font-weight: 700; }
.b-title small { margin-left: 4px; font-size: 11px; font-weight: 400; color: var(--mute); }
.hint { font-size: 11px; color: var(--mute); }

.dist { display: flex; flex-direction: column; gap: 7px; margin: 0; padding: 0; list-style: none; }
.dist li { display: grid; grid-template-columns: 92px minmax(0, 1fr) 36px; align-items: center; gap: 10px; }
.d-name { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-2); white-space: nowrap; }
.d-name i { width: 8px; height: 8px; border-radius: 50%; }
.d-pct { font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; }

/* 요일 막대 */
.dow { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.dow-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px; min-width: 0; }
.dow-v { font-size: 11px; font-weight: 600; color: var(--sub); font-variant-numeric: tabular-nums; }
.dow-track { display: flex; align-items: flex-end; justify-content: center; width: 100%; height: 64px; }
.dow-bar { width: 100%; max-width: 26px; border-radius: 6px 6px 3px 3px; background: var(--soft-2); transition: height 0.5s ease; }
.dow-col.hi .dow-bar { background: var(--g-prehigh); }
.dow-col.hi .dow-v { color: var(--g-prehigh-fg); }
.dow-col.lo .dow-bar { background: var(--accent); opacity: 0.75; }
.dow-col.lo .dow-v { color: var(--accent); }
.dow-name { font-size: 12px; color: var(--sub); }
.dow-name.sun { color: #b4462a; }
.dow-name.sat { color: #3e6fa3; }

/* 생활 습관: 가운데 0을 기준으로 낮아지면 왼쪽(초록), 높아지면 오른쪽(주황) */
.tags { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
.tags li { display: grid; grid-template-columns: 66px minmax(0, 1fr) 30px 28px; align-items: center; gap: 8px; }
.t-name { overflow: hidden; font-size: 12px; font-weight: 600; color: var(--text-2); text-overflow: ellipsis; white-space: nowrap; }
.t-axis { position: relative; height: 10px; border-radius: 5px; background: var(--soft); }
.t-axis::after { content: ''; position: absolute; left: 50%; top: -3px; bottom: -3px; width: 1px; background: var(--line-strong); }
.t-bar { position: absolute; top: 0; bottom: 0; border-radius: 5px; transition: width 0.5s ease; }
.t-bar.good { right: 50%; background: var(--accent); opacity: 0.8; }
.t-bar.bad { left: 50%; background: var(--g-prehigh); }
.t-diff { font-size: 13px; text-align: right; font-variant-numeric: tabular-nums; }
.t-diff.good { color: var(--accent); }
.t-diff.bad { color: var(--g-stage1-fg); }
.t-days { font-size: 11px; color: var(--mute); text-align: right; }

/* 분석 노트 */
.notes { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; }
.notes li { display: flex; gap: 10px; align-items: flex-start; }
.n-num { flex-shrink: 0; display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; background: var(--tone-bg); color: var(--tone-fg); font-size: 12px; font-weight: 800; }
.notes b { font-size: 13.5px; letter-spacing: -0.01em; }
.notes p { margin-top: 2px; font-size: 12px; line-height: 1.5; color: var(--text-2); }

/* 한 줄로: 짧게 쓰고 가운데 정렬 */
.disclaimer { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 2px 0 4px; font-size: 11px; color: var(--mute); white-space: nowrap; }
</style>
