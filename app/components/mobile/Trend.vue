<script setup lang="ts">
const { thisMonth, month, year, mon, canNext, go, goToday, metric, summary, pending, monthStats, weekStats, recentRows } = await useTrend()
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
        <span class="count">기록 {{ monthStats.recorded }}/{{ monthStats.expected }}</span>
      </div>

      <section class="card chart-card" aria-label="한 달 혈압 그래프" :aria-busy="pending">
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
        <TrendChart v-if="summary" class="chart" :series="summary.series" :metric="metric" fill />
        <div v-else class="chart chart-skel" />
      </section>

      <section class="pair" :aria-label="`${mon}월 평균`">
        <SessionStat session="morning" :label="`${mon}월 아침`" :stat="monthStats.morning" compact />
        <SessionStat session="evening" :label="`${mon}월 저녁`" :stat="monthStats.evening" compact />
      </section>
    </template>

    <template v-else>
      <section v-if="summary" class="card headline">
        <InsightIcon :tone="summary.headline.tone" :size="32" />
        <div>
          <b class="hl-title">{{ summary.headline.title }}</b>
          <p class="hl-body">{{ summary.headline.body }}</p>
        </div>
      </section>
      <section class="pair" aria-label="최근 7일 평균">
        <SessionStat session="morning" label="아침 7일" :stat="weekStats.morning" compact />
        <SessionStat session="evening" label="저녁 7일" :stat="weekStats.evening" compact />
      </section>
      <section class="card table-card" aria-label="최근 7일 기록">
        <RecentWeek :rows="recentRows" />
      </section>
      <div class="insights">
        <InsightList v-if="summary?.insights.length" :items="summary.insights" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.trend { display: flex; flex-direction: column; gap: 10px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
.tabs button { padding: 0 14px; }
.seg.small button { height: 30px; padding: 0 10px; font-size: 13px; }
.month-nav { display: flex; align-items: center; gap: 4px; }
.month-nav .icon-btn { width: 38px; height: 38px; }
.month-nav .icon-btn:disabled { color: var(--line-strong); }
.month { min-width: 100px; font-size: 16px; text-align: center; }
.grow { flex: 1; }
.this-month { height: 34px; padding: 0 10px; font-size: 13px; border-radius: 10px; background: var(--card); color: var(--text); }
.count { font-size: 12px; color: var(--sub); }
.chart-card { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 6px; padding: 10px 10px 6px; border-radius: 16px; }
.chart-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.chart { flex: 1; min-height: 0; }
.keys { display: flex; gap: 10px; font-size: 12px; color: var(--sub); }
.keys span { display: inline-flex; align-items: center; gap: 5px; }
.line { display: inline-block; width: 14px; height: 3px; border-radius: 2px; }
.line.morning { background: #1f5f55; }
.line.evening { background: #7fa8d6; }
.chart-skel { border-radius: 12px; background: var(--soft); }
.pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.headline { display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 16px; }
.hl-title { font-size: 15px; }
.hl-body { font-size: 13px; line-height: 1.45; color: var(--text-2); }
.table-card { padding: 6px 8px; border-radius: 16px; }
.insights { flex: 1; min-height: 0; overflow-y: auto; }
.insights :deep(.item) { padding: 10px 12px; border-radius: 14px; }
</style>
