<script setup lang="ts">
import type { MonthResponse, SummaryResponse } from '#shared/types'

useHead({ title: '달력 · bp-log' })

const route = useRoute()
const router = useRouter()
const today = kstToday()
const thisMonth = today.slice(0, 7)

const month = computed(() => (isMonth(route.query.month) && route.query.month <= thisMonth ? route.query.month : thisMonth))
const selected = ref<string | null>(isDate(route.query.date) ? route.query.date : null)

const { data, refresh: refreshMonth, pending } = await useFetch<MonthResponse>('/api/records', {
  query: { month },
  key: 'month',
  default: () => ({ month: month.value, records: [], notes: [] }),
})
const { data: summary, refresh: refreshSummary } = await useFetch<SummaryResponse>('/api/summary', {
  query: { days: 14 },
  key: 'summary-home',
})

const [year, mon] = [computed(() => Number(month.value.slice(0, 4))), computed(() => Number(month.value.slice(5, 7)))]
const canNext = computed(() => month.value < thisMonth)

function go(delta: number) {
  const next = addMonths(month.value, delta)
  router.replace({ query: next === thisMonth ? {} : { month: next } })
}

function select(date: string) {
  selected.value = date
}

async function onChanged() {
  await Promise.all([refreshMonth(), refreshSummary()])
}

const slot = defaultSlot()
const todayDone = computed(() => data.value.records.some(r => r.date === slot.date && r.session === slot.session))
const insights = computed(() => summary.value?.insights.slice(0, 3) ?? [])
</script>

<template>
  <div class="home">
    <section class="cal-col">
      <header class="cal-head">
        <div>
          <span class="eyebrow">bp-log</span>
          <h1 class="month">{{ year }}년 {{ mon }}월</h1>
        </div>
        <div class="nav">
          <button v-if="month !== thisMonth" type="button" class="btn btn-soft today-btn" @click="router.replace({ query: {} })">오늘</button>
          <button type="button" class="icon-btn" aria-label="이전 달" @click="go(-1)"><AppIcon name="chevron-left" /></button>
          <button type="button" class="icon-btn" aria-label="다음 달" :disabled="!canNext" @click="go(1)"><AppIcon name="chevron-right" /></button>
        </div>
      </header>

      <TrendCard class="trend-mobile" :summary="summary ?? null" />

      <div class="card cal-card" :aria-busy="pending">
        <MonthCalendar :month="month" :records="data.records" :notes="data.notes" :today="today" :selected="selected" @select="select" />
        <GradeLegend class="legend" />
        <p class="hint">위 막대 아침 · 아래 막대 저녁 · 날짜를 눌러 자세히</p>
      </div>
    </section>

    <aside class="side" aria-label="최근 동향">
      <TrendCard :summary="summary ?? null" />
      <InsightList v-if="insights.length" :items="insights" />
      <NuxtLink to="/trend" class="more">추이 그래프 보기 <AppIcon name="chevron-right" :size="16" /></NuxtLink>
    </aside>

    <div class="cta">
      <NuxtLink :to="{ path: '/record', query: slot }" class="btn btn-primary btn-lg btn-block">
        <AppIcon :name="todayDone ? 'edit' : 'plus'" :stroke="2.4" />
        {{ SESSION_LABEL[slot.session] }} {{ todayDone ? '기록 고치기' : '기록하기' }}
      </NuxtLink>
    </div>

    <DaySheet :date="selected" @close="selected = null" @changed="onChanged" />
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 12px; }
.cal-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.cal-head { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; }
.eyebrow { font-size: 13px; font-weight: 500; color: var(--sub); }
.month { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
.nav { display: flex; align-items: center; gap: 4px; }
.nav .icon-btn:disabled { color: var(--line-strong); background: var(--card); }
.today-btn { height: 44px; padding: 0 14px; font-size: 14px; border-radius: 12px; background: var(--card); }
.cal-card { display: flex; flex-direction: column; gap: 10px; padding: 12px 8px 14px; }
.legend { padding-top: 4px; }
.hint { font-size: 12px; color: var(--mute); text-align: center; }
.side { display: none; }
.cta {
  position: sticky;
  bottom: calc(var(--nav-h) + 12px + env(safe-area-inset-bottom));
  z-index: 5;
  margin-top: 4px;
}
.cta .btn { box-shadow: 0 8px 24px rgb(31 95 85 / 0.25); }

@media (min-width: 900px) {
  .home {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 20px;
    align-items: start;
  }
  .eyebrow { display: none; }
  .trend-mobile, .cta { display: none; }
  .cal-card { padding: 20px; }
  .hint { display: none; }
  .side { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 84px; padding-top: 58px; }
  .more { display: inline-flex; align-items: center; gap: 4px; align-self: flex-start; padding: 8px 4px; font-size: 14px; font-weight: 600; text-decoration: none; }
}
</style>
