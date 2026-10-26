<script setup lang="ts">
import type { AdminStatsResponse } from '#shared/types'

// 운영 페이지: 가입자·활동 합계와 추이 (운영자만. 개인 기록은 보여 주지 않는다)
useHead({ title: '운영 · bp-log' })
const days = ref<30 | 90>(30)
const { data, pending, error, refresh } = await useFetch<AdminStatsResponse>('/api/admin/stats', {
  query: { days },
  key: computed(() => `admin-stats:${days.value}`),
})

const t = computed(() => data.value?.totals)
const signupPoints = computed(() => (data.value?.series ?? []).map(p => ({ date: p.date, line: p.total, bar: p.signups })))
const recordPoints = computed(() => (data.value?.series ?? []).map(p => ({ date: p.date, bar: p.recorders })))
const updatedAt = computed(() => (data.value ? new Date(data.value.generatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' }) : ''))
// 활성 비율 (가입자 중 최근 7일 안에 들어온 사람)
const activeRate = computed(() => (t.value?.users ? Math.round(t.value.active7 / t.value.users * 100) : 0))
const n = (v: number | undefined) => (v ?? 0).toLocaleString()
const { isMobile } = useDevice()
const chartH = computed(() => (isMobile.value ? 200 : 300))
</script>

<template>
  <div class="admin">
    <header class="head">
      <NuxtLink to="/settings" class="back" aria-label="설정으로 돌아가기"><AppIcon name="chevron-left" :size="20" /></NuxtLink>
      <h1 class="title">운영</h1>
      <div class="seg range" role="radiogroup" aria-label="기간">
        <button v-for="d in ([30, 90] as const)" :key="d" type="button" role="radio" :aria-checked="days === d" :class="{ on: days === d }" @click="days = d">{{ d }}일</button>
      </div>
    </header>
    <p class="sub"><AppIcon name="lock" :size="12" /> 사람 수와 기록 수 합계만 보여요 · 개인 기록은 보이지 않아요</p>

    <p v-if="error" class="error" role="alert">{{ errorMessage(error) }} <button type="button" class="retry" @click="refresh()">다시 불러오기</button></p>

    <section class="kpis" :aria-busy="pending">
      <div class="kpi main">
        <span class="k-label"><AppIcon name="user" :size="14" /> 전체 가입자</span>
        <b class="k-value">{{ n(t?.users) }}<small>명</small></b>
        <span class="k-sub"><span class="up">+{{ n(t?.newToday) }}</span> 오늘</span>
      </div>
      <div class="kpi">
        <span class="k-label"><AppIcon name="plus" :size="14" /> 새로 가입</span>
        <b class="k-value">{{ n(t?.new7) }}<small>명</small></b>
        <span class="k-sub">최근 7일 · 30일 {{ n(t?.new30) }}명</span>
      </div>
      <div class="kpi">
        <span class="k-label"><AppIcon name="pulse" :size="14" /> 7일 안에 접속</span>
        <b class="k-value">{{ n(t?.active7) }}<small>명</small></b>
        <span class="k-sub">가입자의 {{ activeRate }}% · 오늘 {{ n(t?.active1) }}명</span>
      </div>
      <div class="kpi">
        <span class="k-label"><AppIcon name="edit" :size="14" /> 오늘 기록한 사람</span>
        <b class="k-value">{{ n(t?.recordersToday) }}<small>명</small></b>
        <span class="k-sub">전체 기록 {{ n(t?.records) }}건</span>
      </div>
    </section>

    <div class="charts">
      <section class="card chart-card">
        <div class="c-head">
          <h2 class="h2">가입자 추이</h2>
          <span class="keys"><span><i class="line" />누적 가입자</span><span><i class="bar" />그날 가입</span></span>
        </div>
        <AdminChart v-if="data" :points="signupPoints" line-label="누적" bar-label="그날 가입" color="#2a8c7a" bar-color="#9ed3c6" unit="명" :height="chartH" />
        <div v-else class="skeleton" />
      </section>

      <section class="card chart-card">
        <div class="c-head">
          <h2 class="h2">매일 기록한 사람</h2>
          <span class="keys"><span><i class="bar violet" />아침·저녁 중 한 번이라도</span></span>
        </div>
        <AdminChart v-if="data" :points="recordPoints" bar-label="기록한 사람" color="#7c8fe0" unit="명" :height="chartH" />
        <div v-else class="skeleton" />
      </section>
    </div>

    <p class="foot">{{ updatedAt }} 기준 · 접속은 1시간 단위로 셉니다</p>
  </div>
</template>

<style scoped>
.admin { display: flex; flex-direction: column; gap: 14px; }
.head { display: flex; align-items: center; gap: 10px; }
.back { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--card); color: var(--text); flex-shrink: 0; }
.title { flex: 1; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
.sub { display: flex; align-items: center; gap: 4px; margin-top: -6px; font-size: 12px; color: var(--mute); }
.range button { height: 34px; padding: 0 14px; font-size: 13px; }
.error { display: flex; align-items: center; gap: 8px; }
.retry { border: 0; background: none; color: var(--accent); font-weight: 700; text-decoration: underline; }

.kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.kpi { display: flex; flex-direction: column; gap: 3px; min-width: 0; padding: 14px 16px; border: 1px solid var(--line); border-radius: 18px; background: var(--card); }
.kpi.main { background: linear-gradient(150deg, var(--accent-soft) 0%, var(--card) 80%); }
.k-label { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--sub); }
.k-value { font-size: 30px; line-height: 1.15; letter-spacing: -0.03em; color: var(--text); font-variant-numeric: tabular-nums; }
.k-value small { margin-left: 2px; font-size: 14px; font-weight: 600; color: var(--sub); }
.main .k-value { color: var(--accent); }
.k-sub { overflow: hidden; font-size: 12px; color: var(--mute); text-overflow: ellipsis; white-space: nowrap; }
.up { color: var(--accent); font-weight: 700; }

.charts { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 14px; }
.chart-card { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px 12px; }
.c-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px 12px; }
.h2 { font-size: 15px; font-weight: 700; }
.keys { display: flex; gap: 12px; font-size: 12px; color: var(--sub); }
.keys span { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
.keys .line { width: 14px; height: 3px; border-radius: 2px; background: #2a8c7a; }
.keys .bar { width: 8px; height: 10px; border-radius: 2px; background: #9ed3c6; }
.keys .bar.violet { background: #7c8fe0; }
.skeleton { height: 240px; border-radius: 12px; background: var(--soft); }
.foot { font-size: 12px; color: var(--mute); text-align: right; }

/* 휴대폰: 숫자 칸 2개씩, 그래프는 위아래로 */
@media (max-width: 900px) {
  .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .charts { grid-template-columns: minmax(0, 1fr); }
  .k-value { font-size: 26px; }
}
</style>
