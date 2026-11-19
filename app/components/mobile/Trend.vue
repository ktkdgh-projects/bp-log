<script setup lang="ts">
const { thisMonth, month, year, mon, canNext, go, goToday, session, summary, pending, monthStats, weekCompare, recentRows } = await useTrend()

// 달별 그래프 / 그 달 분석 / 최근 7일을 옆으로 나란히 두고 손가락으로 밀어 넘긴다 (위 탭은 지금 위치 표시 + 눌러서 이동)
const PAGES = [
  { key: 'month', label: '달별' },
  { key: 'report', label: '분석' },
  { key: 'week', label: '최근 7일' },
] as const
const pager = ref<HTMLElement | null>(null)
const page = ref(0)
function onScroll() {
  const el = pager.value
  if (el?.clientWidth) page.value = Math.round(el.scrollLeft / el.clientWidth)
}
function goPage(i: number) {
  const el = pager.value
  if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}
</script>

<template>
  <div class="trend">
    <header class="head">
      <h1 class="title">추이</h1>
      <div class="seg tabs" role="tablist" aria-label="보기">
        <button v-for="(p, i) in PAGES" :key="p.key" type="button" role="tab" :aria-selected="page === i" :aria-controls="`trend-${p.key}`" :class="{ on: page === i }" @click="goPage(i)">{{ p.label }}</button>
      </div>
    </header>

    <!-- 넘겨도 높이가 그대로이게 한 줄을 같이 쓴다: 달별·분석은 달 이동, 최근 7일은 기간 -->
    <div v-if="page < 2" class="month-nav">
      <button type="button" class="icon-btn" aria-label="이전 달" @click="go(-1)"><AppIcon name="chevron-left" /></button>
      <b class="month">{{ year }}년 {{ mon }}월</b>
      <button type="button" class="icon-btn" aria-label="다음 달" :disabled="!canNext" @click="go(1)"><AppIcon name="chevron-right" /></button>
      <span class="grow" />
      <button v-if="month !== thisMonth" type="button" class="btn this-month" @click="goToday">이번 달</button>
      <span class="count" :style="{ '--r': monthStats.expected ? monthStats.recorded / monthStats.expected : 0 }">
        <span class="count-label">기록</span> <b>{{ monthStats.recorded }}</b>/{{ monthStats.expected }}
      </span>
    </div>
    <div v-else class="month-nav week-range">
      <AppIcon name="calendar" :size="16" />
      <b v-if="summary">{{ formatShort(summary.weekStats.from) }} – {{ formatShort(summary.weekStats.to) }}</b>
      <span>어제까지 7일</span>
    </div>

    <div ref="pager" class="pager" @scroll.passive="onScroll">
      <section id="trend-month" class="page" role="tabpanel" aria-label="달별 그래프">
        <section class="card chart-card" aria-label="한 달 혈압 그래프" :aria-busy="pending">
          <div class="chart-head">
            <div class="seg small" role="radiogroup" aria-label="시간대">
              <button v-for="s in (['morning', 'evening'] as const)" :key="s" type="button" role="radio" :aria-checked="session === s" :class="{ on: session === s }" @click="session = s">
                <AppIcon :name="s === 'morning' ? 'sun' : 'moon'" :size="14" :stroke="2.2" />{{ SESSION_LABEL[s] }}
              </button>
              <button type="button" role="radio" :aria-checked="session === 'both'" :class="{ on: session === 'both' }" @click="session = 'both'">겹쳐 보기</button>
            </div>
            <span class="keys">
              <template v-if="session === 'both'"><span><i class="line am" />아침</span><span><i class="line pm" />저녁</span><span class="sub-key">진하게 수축기 · 옅게 이완기</span></template>
              <template v-else><span><i class="line sys" />수축기</span><span><i class="line dia" />이완기</span></template>
              <span class="sub-key">▲최고 ▼최저</span>
            </span>
          </div>
          <TrendChart v-if="summary" class="chart" :series="summary.series" :session="session" fill />
          <div v-else class="chart chart-skel" />
        </section>

        <section class="pair" :aria-label="`${mon}월 평균`">
          <SessionStat session="morning" :label="`${mon}월 아침`" :stat="monthStats.morning" compact />
          <SessionStat session="evening" :label="`${mon}월 저녁`" :stat="monthStats.evening" compact />
        </section>
      </section>

      <section id="trend-report" class="page" role="tabpanel" :aria-label="`${mon}월 분석`">
        <TrendReport v-if="summary" :report="summary.report" />
      </section>

      <section id="trend-week" class="page" role="tabpanel" aria-label="최근 7일">
        <template v-if="summary">
          <section class="headline" :style="{ '--tone-bg': INSIGHT_TONE[summary.headline.tone].bg, '--tone-fg': INSIGHT_TONE[summary.headline.tone].fg }">
            <InsightIcon :tone="summary.headline.tone" :size="32" />
            <div>
              <b class="hl-title">{{ summary.headline.title }}</b>
              <p class="hl-body">{{ summary.headline.body }}</p>
            </div>
          </section>
          <WeekSummary :stats="summary.weekStats" :rows="recentRows" />
          <WeekCompare :items="weekCompare" aria-label="최근 7일 평균" />
          <section class="card table-card" aria-label="최근 7일 기록">
            <RecentWeek :rows="recentRows" />
          </section>
          <InsightList v-if="summary.insights.length" :items="summary.insights" compact />
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 이 화면은 화면 높이에 맞추고, 옆으로 넘기는 각 장이 따로 세로로 스크롤한다 (다른 페이지는 내용만큼 늘어난다) */
.trend { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; gap: 10px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
.tabs button { padding: 0 12px; }

/* 옆으로 넘기는 장: 화면 끝까지 붙여 쓰고(좌우 여백은 장 안에서), 손을 떼면 한 장씩 맞춰 멈춘다 */
.pager {
  flex: 1;
  min-height: 0;
  display: flex;
  margin: 0 -16px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}
.pager::-webkit-scrollbar { display: none; }
.page {
  flex: 0 0 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 0 16px 4px;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.seg.small { width: 100%; }
.seg.small button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 32px; padding: 0 8px; font-size: 13px; white-space: nowrap; }
.month-nav { display: flex; align-items: center; gap: 4px; min-height: 38px; }
.month-nav .icon-btn { width: 38px; height: 38px; }
.month-nav .icon-btn:disabled { color: var(--line-strong); }
.month { min-width: 100px; font-size: 16px; text-align: center; white-space: nowrap; }
.grow { flex: 1; }
.this-month { flex-shrink: 0; height: 34px; padding: 0 10px; font-size: 13px; border-radius: 10px; background: var(--card); color: var(--text); white-space: nowrap; }
.week-range { gap: 6px; padding: 0 4px; color: var(--sub); }
.week-range b { font-size: 16px; color: var(--text); white-space: nowrap; }
.week-range span { overflow: hidden; font-size: 12px; color: var(--mute); text-overflow: ellipsis; white-space: nowrap; }
/* 기록 몇 번 했는지: 글자 아래 가는 막대가 기록한 만큼 찬다 */
.count {
  --pad: 12px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 34px;
  padding: 0 var(--pad) 4px;
  border-radius: 12px;
  background:
    linear-gradient(var(--accent), var(--accent)) left var(--pad) bottom 6px / calc((100% - 2 * var(--pad)) * var(--r)) 3px no-repeat,
    linear-gradient(var(--soft-2), var(--soft-2)) left var(--pad) bottom 6px / calc(100% - 2 * var(--pad)) 3px no-repeat,
    var(--card);
  font-size: 12px;
  color: var(--sub);
  white-space: nowrap;
}
.count b { color: var(--accent); font-size: 13px; }
/* 아주 좁은 휴대폰(SE 1세대 등): 달 이동 줄을 촘촘하게 */
@media (max-width: 360px) {
  .month-nav { gap: 2px; }
  .month-nav .icon-btn { width: 32px; height: 34px; }
  .month { min-width: 0; font-size: 15px; }
  .count-label { display: none; }
  .this-month { padding: 0 8px; }
  .count { --pad: 8px; }
}
/* 작은 휴대폰에서도 그래프가 너무 납작해지지 않게 (최고·최저 꼬리표 자리) 조금 넘치면 장 안에서 내려간다 */
.chart-card { flex: 1 0 auto; display: flex; flex-direction: column; gap: 6px; padding: 10px 10px 6px; border-radius: 16px; }
/* 위: 아침·저녁·겹쳐 보기 버튼 한 줄, 아래: 범례 한 줄 */
.chart-head { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
.chart-card .chart { flex: 1; min-height: 290px; }
.keys { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 12px; font-size: 12px; color: var(--sub); }
.keys span { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
.line { display: inline-block; width: 14px; height: 3px; border-radius: 2px; }
.line.sys { background: #2a8c7a; }
.line.dia { background: #7c8fe0; }
.line.am { background: linear-gradient(90deg, #1f8a72 50%, #62bfa9 50%); }
.line.pm { background: linear-gradient(90deg, #6e56cf 50%, #a493ea 50%); }
.sub-key { color: var(--mute); }
.chart-skel { border-radius: 12px; background: var(--soft); }
.pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.headline { display: flex; gap: 10px; align-items: center; padding: 12px 14px; border: 1px solid var(--line); border-radius: 18px; background: linear-gradient(135deg, var(--tone-bg) 0%, var(--card) 75%); }
.hl-title { font-size: 16px; color: var(--tone-fg); }
.hl-body { font-size: 13px; line-height: 1.45; color: var(--text-2); }
.table-card { padding: 8px 8px 6px; border-radius: 18px; }
</style>
