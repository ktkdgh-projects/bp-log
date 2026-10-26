import type { SummaryResponse, Session } from '#shared/types'

// 추이: 달별 그래프·통계(?month) + 오늘 기준 최근 7일 정리
export async function useTrend() {
  const { today, thisMonth, month, year, mon, canNext, go, goToday } = useMonthQuery()
  // 그래프는 아침·저녁 중 하나를 골라 수축기·이완기 두 선으로 본다 (아침·저녁 선은 서로 엉켜서)
  // 'both'는 아침(초록 계열)·저녁(보라 계열)을 겹쳐 본다
  const session = ref<Session | 'both'>('morning')

  const { data: summary, pending } = await useFetch<SummaryResponse>('/api/summary', {
    query: { month },
    key: computed(() => summaryKey(month.value)),
    getCachedData: staleWhileRevalidate,
  })

  // ← → 로 넘길 앞뒤 달을 미리 받아 둔다
  prefetchAroundMonth(month, thisMonth, summaryKey, next => $fetch<SummaryResponse>('/api/summary', { query: { month: next } }))

  const withGrade = <T extends { sys: number, dia: number }>(s: T | null) => (s ? { ...s, grade: gradeOf(s.sys, s.dia) } : null)
  const monthStats = computed(() => {
    const m = summary.value?.monthStats
    return { morning: withGrade(m?.morning ?? null), evening: withGrade(m?.evening ?? null), recorded: m?.recorded ?? 0, expected: m?.expected ?? 0 }
  })
  // 최근 7일 아침·저녁 평균과 지난주보다 수축기가 얼마나 달라졌는지
  const weekCompare = computed(() => (['morning', 'evening'] as const).map((session) => {
    const now = withGrade(summary.value?.week[session] ?? null)
    const before = summary.value?.lastWeek[session] ?? null
    return { session, now, delta: now && before ? now.sys - before.sys : null }
  }))

  // 최근 7일: 왼쪽이 오래된 날, 오른쪽 끝이 오늘
  const recentRows = computed(() => (summary.value?.recent ?? []).map(p => ({
    date: p.date,
    isToday: p.date === today,
    morning: withGrade(p.morning),
    evening: withGrade(p.evening),
  })))

  return { thisMonth, month, year, mon, canNext, go, goToday, session, summary, pending, monthStats, weekCompare, recentRows }
}
