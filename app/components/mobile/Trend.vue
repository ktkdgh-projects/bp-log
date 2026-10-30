<script setup lang="ts">
const { thisMonth, month, year, mon, canNext, go, goToday, session, summary, pending, monthStats, weekCompare, recentRows } = await useTrend()
// 한 화면에 들어가게 달별 / 최근 7일을 탭으로 나눈다
const tab = ref<'month' | 'week'>('month')
</script>

<template>
  <div class="trend">
    <header class="head">
      <h1 class="title">추이</h1>
      <div class="seg tabs" role="tablist" aria-label="보기">
        <button type="button" role="tab" :aria-selected="tab === 'month'" :class="{ on: tab === 'month' }" @click="tab = 'month'">달별</button>
        <button type="button" role="tab" :aria-selected="tab === 'week'" :class="{ on: tab === 'week' }" @click="tab = 'week'">최근 7일</button>
      </div>
    </header>

    <template v-if="tab === 'month'">
      <div class="month-nav">
        <button type="button" class="icon-btn" aria-label="이전 달" @click="go(-1)"><AppIcon name="chevron-left" /></button>
        <b class="month">{{ year }}년 {{ mon }}월</b>
        <button type="button" class="icon-btn" aria-label="다음 달" :disabled="!canNext" @click="go(1)"><AppIcon name="chevron-right" /></button>
        <span class="grow" />
        <button v-if="month !== thisMonth" type="button" class="btn this-month" @click="goToday">이번 달</button>
        <span class="count" :style="{ '--r': monthStats.expected ? monthStats.recorded / monthStats.expected : 0 }">
          기록 <b>{{ monthStats.recorded }}</b>/{{ monthStats.expected }}
        </span>
      </div>

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
    </template>

    <template v-else>
      <section v-if="summary" class="headline" :style="{ '--tone-bg': INSIGHT_TONE[summary.headline.tone].bg, '--tone-fg': INSIGHT_TONE[summary.headline.tone].fg }">
        <InsightIcon :tone="summary.headline.tone" :size="32" />
        <div>
          <b class="hl-title">{{ summary.headline.title }}</b>
          <p class="hl-body">{{ summary.headline.body }}</p>
        </div>
      </section>
      <WeekCompare :items="weekCompare" aria-label="최근 7일 평균" />
      <section class="card table-card" aria-label="최근 7일 기록">
        <RecentWeek :rows="recentRows" />
      </section>
      <div class="insights">
        <InsightList v-if="summary?.insights.length" :items="summary.insights" compact />
      </div>
    </template>
  </div>
</template>

<style scoped>
.trend { display: flex; flex-direction: column; gap: 10px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
.tabs button { padding: 0 14px; }
.seg.small { width: 100%; }
.seg.small button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 32px; padding: 0 8px; font-size: 13px; white-space: nowrap; }
.month-nav { display: flex; align-items: center; gap: 4px; }
.month-nav .icon-btn { width: 38px; height: 38px; }
.month-nav .icon-btn:disabled { color: var(--line-strong); }
.month { min-width: 100px; font-size: 16px; text-align: center; }
.grow { flex: 1; }
.this-month { height: 34px; padding: 0 10px; font-size: 13px; border-radius: 10px; background: var(--card); color: var(--text); }
/* 기록 몇 번 했는지: 글자 아래 가는 막대가 기록한 만큼 찬다 */
.count {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 34px;
  padding: 0 12px 4px;
  border-radius: 12px;
  background:
    linear-gradient(var(--accent), var(--accent)) left 12px bottom 6px / calc((100% - 24px) * var(--r)) 3px no-repeat,
    linear-gradient(var(--soft-2), var(--soft-2)) left 12px bottom 6px / calc(100% - 24px) 3px no-repeat,
    var(--card);
  font-size: 12px;
  color: var(--sub);
  white-space: nowrap;
}
.count b { color: var(--accent); font-size: 13px; }
/* 작은 휴대폰에서도 그래프가 너무 납작해지지 않게 (최고·최저 꼬리표 자리) 조금 넘치면 화면이 내려간다 */
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
.insights { flex: 1; min-height: 0; overflow-y: auto; }
</style>
