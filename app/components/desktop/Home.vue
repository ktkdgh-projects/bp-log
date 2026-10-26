<script setup lang="ts">
const { today, thisMonth, month, year, mon, canNext, go, goToday, setMonth, selected, data, monthData, pending, refresh } = await useHome()
const { lastSaved } = useRecordModal()

// PC는 옆 패널이 늘 열려 있으니 처음엔 오늘을 보여준다
if (!selected.value) selected.value = month.value === thisMonth ? today : `${month.value}-01`

// 모달에서 저장하면 그 날짜를 열어 둔다 (다른 달이면 그 달로)
watch(lastSaved, (d) => {
  if (!d) return
  selected.value = d
  const m = d.slice(0, 7)
  if (m !== month.value) setMonth(m)
})

const monthStats = computed(() => {
  const recs = data.value.records
  const elapsed = month.value === thisMonth ? Number(today.slice(8, 10)) : daysInMonth(month.value)
  const avg = (session: 'morning' | 'evening') => {
    const v = recs.filter(r => r.session === session)
    if (!v.length) return null
    const sys = Math.round(v.reduce((s, r) => s + r.avg.sys, 0) / v.length)
    const dia = Math.round(v.reduce((s, r) => s + r.avg.dia, 0) / v.length)
    return { text: `${sys}/${dia}`, grade: gradeOf(sys, dia) }
  }
  const expected = elapsed * 2
  return { count: recs.length, expected, rate: expected ? Math.min(100, Math.round(recs.length / expected * 100)) : 0, morning: avg('morning'), evening: avg('evening') }
})

useMonthKeys(go, canNext)

// 달을 넘기면 옆 패널도 그 달 날짜(이번 달이면 오늘, 아니면 1일)로 옮긴다. 그래야 그 달 데이터에서 바로 꺼내 보여 준다
watch(month, (m) => {
  if (selected.value?.slice(0, 7) !== m) selected.value = m === thisMonth ? today : `${m}-01`
})
</script>

<template>
  <div class="home">
    <header class="page-head">
      <h1 class="month">{{ year }}년 {{ mon }}월</h1>
      <div class="nav">
        <button type="button" class="icon-btn" aria-label="이전 달" title="이전 달 (←)" @click="go(-1)"><AppIcon name="chevron-left" /></button>
        <button type="button" class="icon-btn" aria-label="다음 달" title="다음 달 (→)" :disabled="!canNext" @click="go(1)"><AppIcon name="chevron-right" /></button>
        <button v-if="month !== thisMonth" type="button" class="btn btn-soft today-btn" @click="goToday">오늘</button>
      </div>

      <dl class="stats" aria-label="이번 달 요약">
        <div class="stat-rate">
          <dt><AppIcon name="calendar" :size="13" :stroke="2.2" /> {{ mon }}월 기록</dt>
          <dd>{{ monthStats.count }}<small>/{{ monthStats.expected }}회</small></dd>
          <span class="rate"><span :style="{ width: `${monthStats.rate}%` }" /></span>
        </div>
        <div v-for="s in (['morning', 'evening'] as const)" :key="s" :class="s" :style="monthStats[s] ? { '--g-bg': gradeVar(monthStats[s]!.grade, 'bg'), '--g-fg': gradeVar(monthStats[s]!.grade, 'fg') } : undefined">
          <dt><AppIcon :name="s === 'morning' ? 'sun' : 'moon'" :size="13" :stroke="2.2" /> {{ SESSION_LABEL[s] }} 평균</dt>
          <dd>
            <template v-if="monthStats[s]">
              {{ monthStats[s]!.text }}
              <GradeChip :grade="monthStats[s]!.grade" size="sm" />
            </template>
            <template v-else>–</template>
          </dd>
        </div>
      </dl>

    </header>

    <div class="layout">
      <section class="card cal-card" :aria-busy="pending">
        <DesktopCalendar class="cal" :month="month" :records="data.records" :notes="data.notes" :today="today" :selected="selected" @select="selected = $event" />
        <div class="foot">
          <span class="order">칸마다 위 아침 · 아래 저녁</span>
          <GradeLegend class="legend" />
        </div>
      </section>

      <aside class="card panel" aria-label="선택한 날짜">
        <DayDetail v-if="selected" :key="selected" :date="selected" :month="monthData" wide @changed="refresh" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; align-items: center; gap: 12px; }
.month { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; min-width: 148px; }
.nav { display: flex; align-items: center; gap: 4px; }
.nav .icon-btn { border: 1px solid var(--line); }
.nav .icon-btn:disabled { color: var(--line-strong); background: transparent; }
.today-btn { height: 44px; padding: 0 16px; margin-left: 4px; font-size: 14px; border-radius: 12px; }
.stats { display: flex; gap: 8px; margin: 0 0 0 auto; }
.stats > div { --g-bg: var(--card); --g-fg: var(--text); position: relative; display: flex; flex-direction: column; justify-content: center; gap: 2px; min-width: 132px; height: 60px; padding: 0 16px; border: 1px solid var(--line); border-radius: 16px; background: linear-gradient(135deg, var(--g-bg) 0%, var(--card) 80%); }
.stats dt { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; color: var(--sub); }
.stats .morning dt :deep(svg) { color: #9a5b0b; }
.stats .evening dt :deep(svg) { color: #2e6399; }
.stats dd { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.02em; color: var(--g-fg); font-variant-numeric: tabular-nums; }
.stats small { font-size: 12px; font-weight: 500; color: var(--sub); }
.rate { position: absolute; left: 16px; right: 16px; bottom: 8px; height: 4px; border-radius: 2px; background: var(--soft-2); overflow: hidden; }
.rate span { display: block; height: 100%; border-radius: 2px; background: var(--accent); }
.stat-rate { padding-bottom: 8px !important; }

.layout { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; }
.cal-card { display: flex; flex-direction: column; gap: 12px; min-height: 0; padding: 16px 18px 14px; }
.cal { flex: 1; min-height: 0; }
.foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.order { font-size: 13px; color: var(--sub); }
.legend { font-size: 13px; }
.panel { min-height: 0; overflow-y: auto; padding: 18px; }
</style>
