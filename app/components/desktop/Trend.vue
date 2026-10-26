<script setup lang="ts">
const { thisMonth, month, year, mon, canNext, go, goToday, session, summary, pending, monthStats, weekCompare, recentRows } = await useTrend()
useMonthKeys(go, canNext)
const rate = computed(() => (monthStats.value.expected ? Math.round(monthStats.value.recorded / monthStats.value.expected * 100) : 0))
</script>

<template>
  <div class="trend">
    <header class="page-head">
      <h1 class="title">추이 · 리포트</h1>
      <div class="nav">
        <button type="button" class="icon-btn" aria-label="이전 달" @click="go(-1)"><AppIcon name="chevron-left" /></button>
        <b class="month">{{ year }}년 {{ mon }}월</b>
        <button type="button" class="icon-btn" aria-label="다음 달" :disabled="!canNext" @click="go(1)"><AppIcon name="chevron-right" /></button>
        <button v-if="month !== thisMonth" type="button" class="btn btn-soft this-month" @click="goToday">이번 달</button>
      </div>
    </header>

    <div class="body">
      <div class="main-col">
        <section class="card chart-card" aria-label="한 달 혈압 그래프" :aria-busy="pending">
          <div class="chart-head">
            <h2 class="h2">{{ mon }}월 {{ session === 'both' ? '아침·저녁' : SESSION_LABEL[session] }} 혈압</h2>
            <span class="keys">
              <template v-if="session === 'both'"><span><i class="line am" />아침</span><span><i class="line pm" />저녁</span><span class="sub-key">진하게 수축기 · 옅게 이완기</span></template>
              <template v-else><span><i class="line sys" />수축기</span><span><i class="line dia" />이완기</span></template>
            <span class="sub-key">▲최고 ▼최저</span>
              <span><i class="line ref" />고혈압 기준</span>
            </span>
            <div class="seg" role="radiogroup" aria-label="시간대">
              <button v-for="s in (['morning', 'evening'] as const)" :key="s" type="button" role="radio" :aria-checked="session === s" :class="{ on: session === s }" @click="session = s">
                <AppIcon :name="s === 'morning' ? 'sun' : 'moon'" :size="14" :stroke="2.2" />{{ SESSION_LABEL[s] }}
              </button>
              <button type="button" role="radio" :aria-checked="session === 'both'" :class="{ on: session === 'both' }" @click="session = 'both'">겹쳐 보기</button>
            </div>
          </div>
          <TrendChart v-if="summary" class="chart" :series="summary.series" :session="session" fill />
          <div v-else class="chart chart-skel" />
        </section>

        <section class="month-stats" :aria-label="`${mon}월 통계`">
          <SessionStat session="morning" :label="`${mon}월 아침 평균`" :stat="monthStats.morning" />
          <SessionStat session="evening" :label="`${mon}월 저녁 평균`" :stat="monthStats.evening" />
          <div class="card count">
            <span class="c-label">{{ mon }}월 기록</span>
            <b class="c-value">{{ monthStats.recorded }}<small>/{{ monthStats.expected }}회</small></b>
            <span class="bar"><span :style="{ width: `${rate}%` }" /></span>
            <span class="c-sub">{{ rate }}% 기록함</span>
          </div>
        </section>
      </div>

      <aside class="card side" aria-label="최근 7일">
        <h2 class="side-title">최근 7일 <small>날짜와 상관없이 오늘 기준</small></h2>
        <div v-if="summary" class="headline" :style="{ '--tone-bg': INSIGHT_TONE[summary.headline.tone].bg, '--tone-fg': INSIGHT_TONE[summary.headline.tone].fg }">
          <InsightIcon :tone="summary.headline.tone" :size="36" />
          <div>
            <b class="hl-title">{{ summary.headline.title }}</b>
            <p class="hl-body">{{ summary.headline.body }}</p>
          </div>
        </div>
        <WeekCompare :items="weekCompare" aria-label="최근 7일 평균" />
        <RecentWeek :rows="recentRows" />
        <div class="insights">
          <InsightList v-if="summary?.insights.length" :items="summary.insights" compact />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.trend { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
.nav { display: flex; align-items: center; gap: 6px; }
.nav .icon-btn { border: 1px solid var(--line); }
.nav .icon-btn:disabled { color: var(--line-strong); background: transparent; }
.month { min-width: 120px; font-size: 18px; text-align: center; }
.this-month { height: 44px; padding: 0 14px; font-size: 14px; border-radius: 12px; }

.body { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 16px; }
.main-col { display: flex; flex-direction: column; gap: 16px; min-height: 0; }
.chart-card { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; padding: 18px 22px 14px; }
.chart-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px; }
.chart-head .keys { margin-left: auto; }
.chart { flex: 1; min-height: 0; }
.h2 { font-size: 16px; font-weight: 700; white-space: nowrap; }
.keys { display: flex; gap: 14px; font-size: 13px; color: var(--sub); }
.keys span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.line { display: inline-block; width: 16px; height: 3px; border-radius: 2px; }
.line.sys { background: #2a8c7a; }
.line.dia { background: #7c8fe0; }
.line.am { background: linear-gradient(90deg, #1f8a72 50%, #62bfa9 50%); }
.line.pm { background: linear-gradient(90deg, #6e56cf 50%, #a493ea 50%); }
.sub-key { color: var(--mute); }
.line.ref { background: repeating-linear-gradient(90deg, #e7a184 0 4px, transparent 4px 8px); }
.chart-skel { border-radius: 12px; background: var(--soft); }
.seg button { display: inline-flex; align-items: center; gap: 4px; height: 32px; font-size: 13px; white-space: nowrap; }
.month-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) minmax(0, 0.8fr); gap: 12px; }
.count { display: flex; flex-direction: column; gap: 6px; padding: 13px 15px; border: 1px solid var(--line); border-radius: 18px; box-shadow: none; }
.c-label { font-size: 13px; color: var(--sub); }
.c-value { font-size: 24px; letter-spacing: -0.02em; }
.c-value small { font-size: 13px; font-weight: 500; color: var(--sub); }
.bar { height: 6px; border-radius: 3px; background: var(--soft-2); overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: 3px; background: var(--accent); }
.c-sub { font-size: 12px; color: var(--sub); }

.side { display: flex; flex-direction: column; gap: 12px; min-height: 0; padding: 18px; }
.side-title { font-size: 17px; font-weight: 700; }
.side-title small { margin-left: 6px; font-size: 12px; font-weight: 400; color: var(--mute); }
.headline { display: flex; gap: 12px; align-items: flex-start; padding: 14px; border-radius: 16px; background: linear-gradient(135deg, var(--tone-bg) 0%, var(--soft) 80%); }
.hl-title { font-size: 16px; color: var(--tone-fg); }
.hl-body { font-size: 13px; line-height: 1.5; color: var(--text-2); }
.insights { flex: 1; min-height: 0; overflow-y: auto; }
</style>
