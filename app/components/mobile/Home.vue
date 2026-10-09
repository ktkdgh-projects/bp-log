<script setup lang="ts">
import type { PeriodStat } from '#shared/types'

const { today, thisMonth, month, year, mon, canNext, go, goToday, selected, data, pending, summary, refresh, slot, slotDone } = await useHome()

// 한 화면에 들어가게 동향은 한 줄 + 아침·저녁 7일 평균만
const week = computed(() => (['morning', 'evening'] as const).map((session) => {
  const now: PeriodStat | null = summary.value?.week[session] ?? null
  return { session, now, grade: now ? gradeOf(now.sys, now.dia) : null }
}))
</script>

<template>
  <div class="home">
    <header class="head">
      <h1 class="month">{{ year }}년 {{ mon }}월</h1>
      <div class="nav">
        <button v-if="month !== thisMonth" type="button" class="btn today-btn" @click="goToday">오늘</button>
        <button type="button" class="icon-btn" aria-label="이전 달" @click="go(-1)"><AppIcon name="chevron-left" /></button>
        <button type="button" class="icon-btn" aria-label="다음 달" :disabled="!canNext" @click="go(1)"><AppIcon name="chevron-right" /></button>
      </div>
    </header>

    <NuxtLink to="/trend" class="card trend" aria-label="최근 동향, 추이 화면으로">
      <template v-if="summary">
        <span class="t-head">
          <InsightIcon :tone="summary.headline.tone" :size="28" />
          <b class="t-title">{{ summary.headline.title }}</b>
          <AppIcon name="chevron-right" :size="18" class="t-go" />
        </span>
        <span class="t-stats">
          <span v-for="w in week" :key="w.session" class="t-stat">
            <AppIcon :name="w.session === 'morning' ? 'sun' : 'moon'" :size="14" class="t-icon" />
            <span class="t-label">7일</span>
            <b>{{ w.now ? `${w.now.sys}/${w.now.dia}` : '–' }}</b>
            <span v-if="w.grade" class="dot" :style="{ background: gradeVar(w.grade) }" />
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

    <MobileDaySheet :date="selected" @close="selected = null" @changed="refresh" />
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 10px; }
.head { display: flex; align-items: center; justify-content: space-between; }
.month { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
.nav { display: flex; align-items: center; gap: 4px; }
.nav .icon-btn { width: 40px; height: 40px; }
.nav .icon-btn:disabled { color: var(--line-strong); }
.today-btn { height: 40px; padding: 0 12px; font-size: 14px; border-radius: 12px; background: var(--card); color: var(--text); }
.trend { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: 18px; color: var(--text); text-decoration: none; }
.t-head { display: flex; align-items: center; gap: 8px; }
.t-title { flex: 1; font-size: 15px; }
.t-go { color: var(--mute); }
.t-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.t-stat { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 12px; background: var(--soft); font-size: 15px; }
.t-icon { color: var(--sub); }
.t-label { font-size: 12px; color: var(--sub); }
.dot { width: 8px; height: 8px; margin-left: auto; border-radius: 50%; }
.skeleton { height: 70px; border-radius: 12px; background: var(--soft-2); }
.cal-card { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; padding: 10px 8px 10px; }
.cal { flex: 1; min-height: 0; }
.legend { font-size: 11px; gap: 4px 10px; }
.cta { flex-shrink: 0; box-shadow: 0 8px 24px rgb(31 95 85 / 0.22); }
</style>
