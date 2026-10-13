import type { PeriodStat, SummaryResponse } from '#shared/types'

// 추이: 달별 그래프·통계(?month) + 오늘 기준 최근 7일 정리
export async function useTrend() {
  const { today, thisMonth, month, year, mon, canNext, go, goToday } = useMonthQuery()
  const metric = ref<'sys' | 'dia'>('sys')

  const { data: summary, pending } = await useFetch<SummaryResponse>('/api/summary', {
    query: { month },
    key: computed(() => summaryKey(month.value)),
    getCachedData: staleWhileRevalidate,
  })

  // ← → 로 넘길 앞뒤 달을 미리 받아 둔다
  prefetchAroundMonth(month, thisMonth, summaryKey, next => $fetch<SummaryResponse>('/api/summary', { query: { month: next } }))

  const withGrade = (s: PeriodStat | null) => (s ? { ...s, grade: gradeOf(s.sys, s.dia) } : null)
  const monthStats = computed(() => {
    const m = summary.value?.monthStats
    return { morning: withGrade(m?.morning ?? null), evening: withGrade(m?.evening ?? null), recorded: m?.recorded ?? 0, expected: m?.expected ?? 0 }
  })
  const weekStats = computed(() => ({ morning: withGrade(summary.value?.week.morning ?? null), evening: withGrade(summary.value?.week.evening ?? null) }))

  // 최근 7일: 최신이 위로
  const recentRows = computed(() => (summary.value?.recent ?? []).slice().reverse().map(p => ({
    date: p.date,
    isToday: p.date === today,
    morning: p.morning ? { ...p.morning, grade: gradeOf(p.morning.sys, p.morning.dia) } : null,
    evening: p.evening ? { ...p.evening, grade: gradeOf(p.evening.sys, p.evening.dia) } : null,
  })))

  return { thisMonth, month, year, mon, canNext, go, goToday, metric, summary, pending, monthStats, weekStats, recentRows }
}
