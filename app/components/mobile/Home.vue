<script setup lang="ts">
import type { PeriodStat } from '#shared/types'

const { today, thisMonth, month, year, mon, canNext, go, goToday, selected, data, monthData, pending, summary, refresh, slot, slotDone } = await useHome()

// 한 화면에 들어가게 동향은 한 줄 + 아침·저녁 7일 평균만
const week = computed(() => (['morning', 'evening'] as const).map((session) => {
  const now: PeriodStat | null = summary.value?.week[session] ?? null
  return { session, now, grade: now ? gradeOf(now.sys, now.dia) : null }
}))
const tone = computed(() => INSIGHT_TONE[summary.value?.headline.tone ?? 'empty'])
</script>

<template>
  <div class="home">
    <header class="head">
      <h1 class="month">{{ year }}<small>년</small> {{ mon }}<small>월</small></h1>
      <div class="nav">
        <button v-if="month !== thisMonth" type="button" class="today-btn" @click="goToday">오늘</button>
        <span class="nav-group">
          <button type="button" class="nav-btn" aria-label="이전 달" @click="go(-1)"><AppIcon name="chevron-left" :size="18" :stroke="2.4" /></button>
          <button type="button" class="nav-btn" aria-label="다음 달" :disabled="!canNext" @click="go(1)"><AppIcon name="chevron-right" :size="18" :stroke="2.4" /></button>
        </span>
      </div>
    </header>

    <NuxtLink to="/trend" class="trend" :style="{ '--tone-bg': tone.bg, '--tone-fg': tone.fg }" aria-label="최근 동향, 추이 화면으로">
      <template v-if="summary">
        <span class="t-head">
          <InsightIcon :tone="summary.headline.tone" :size="34" />
          <span class="t-text">
            <b class="t-title">{{ summary.headline.title }}</b>
            <span class="t-body">{{ summary.headline.body }}</span>
          </span>
          <AppIcon name="chevron-right" :size="18" :stroke="2.4" class="t-go" />
        </span>
        <span class="t-stats">
          <span v-for="w in week" :key="w.session" class="t-stat">
            <span class="t-label"><AppIcon :name="w.session === 'morning' ? 'sun' : 'moon'" :size="13" :stroke="2.2" />{{ SESSION_LABEL[w.session] }} 7일 평균</span>
            <span class="t-val">
              <b :style="w.grade ? { color: gradeVar(w.grade, 'fg') } : undefined">{{ w.now ? `${w.now.sys}/${w.now.dia}` : '–' }}</b>
              <GradeChip v-if="w.grade" :grade="w.grade" size="sm" />
            </span>
          </span>
        </span>
      </template>
      <span v-else class="skeleton" />
    </NuxtLink>

    <div class="card cal-card" :aria-busy="pending">
      <MobileCalendar class="cal" :month="month" :records="data.records" :notes="data.notes" :today="today" :selected="selected" @select="selected = $event" />
      <GradeLegend class="legend" />
    </div>

    <NuxtLink :to="{ path: '/record', query: slot }" class="btn btn-primary btn-lg btn-block cta">
      <AppIcon :name="slotDone ? 'edit' : 'plus'" :stroke="2.4" />
      {{ SESSION_LABEL[slot.session] }} {{ slotDone ? '기록 고치기' : '기록하기' }}
    </NuxtLink>

    <MobileDaySheet :date="selected" :month="monthData" @close="selected = null" @changed="refresh" />
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 10px; }
.head { display: flex; align-items: center; justify-content: space-between; padding: 2px 2px 0; }
.month { font-size: 24px; font-weight: 700; letter-spacing: -0.03em; }
.month small { margin-left: 1px; font-size: 17px; font-weight: 600; color: var(--sub); }
.nav { display: flex; align-items: center; gap: 6px; }
.nav-group { display: inline-flex; padding: 3px; border-radius: 13px; background: var(--card); box-shadow: 0 1px 2px rgb(23 32 29 / 0.06); }
.nav-btn { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 34px; border: 0; border-radius: 10px; background: transparent; color: var(--text); }
.nav-btn:active:not(:disabled) { background: var(--soft-2); }
.nav-btn:disabled { color: var(--line-strong); }
.today-btn { height: 40px; padding: 0 14px; border: 0; border-radius: 13px; background: var(--accent-soft); color: var(--accent); font-size: 14px; font-weight: 700; }

/* 동향 카드: 문구 성격(좋아짐·주의·경고)에 맞춰 은은하게 물든다 */
.trend { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 20px; background: linear-gradient(135deg, var(--tone-bg) 0%, var(--card) 72%); color: var(--text); text-decoration: none; }
.t-head { display: flex; align-items: center; gap: 10px; padding: 0 2px; }
.t-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.t-title { font-size: 16px; letter-spacing: -0.02em; color: var(--tone-fg); }
.t-body { overflow: hidden; font-size: 12px; color: var(--sub); white-space: nowrap; text-overflow: ellipsis; }
.t-go { flex-shrink: 0; color: var(--mute); }
.t-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.t-stat { display: flex; flex-direction: column; gap: 3px; padding: 8px 11px; border-radius: 14px; background: rgb(255 255 255 / 0.85); box-shadow: 0 1px 2px rgb(23 32 29 / 0.05); }
.t-label { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; color: var(--sub); }
.t-val { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.t-val b { font-size: 18px; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.skeleton { height: 96px; border-radius: 14px; background: rgb(255 255 255 / 0.6); }
.cal-card { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; padding: 10px 8px 10px; }
.cal { flex: 1; min-height: 0; }
.legend { font-size: 11px; gap: 4px 10px; }
.cta { flex-shrink: 0; box-shadow: 0 8px 24px rgb(31 95 85 / 0.22); }

/* 작은 휴대폰: 동향 설명 줄은 빼서 달력 자리를 지킨다 */
@media (max-height: 700px) {
  .t-body { display: none; }
  .t-stat { padding: 6px 10px; }
}
</style>
