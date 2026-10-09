import type { MonthResponse, SummaryResponse } from '#shared/types'

// 달력 화면 데이터. 모바일·데스크톱 화면이 같은 키로 불러서 캐시를 나눠 쓴다
export async function useHome() {
  const route = useRoute()
  const { today, thisMonth, month, year, mon, canNext, go, goToday, setMonth } = useMonthQuery()
  // 수명주기 훅을 쓰므로 await 전에 부른다
  const slot = useSlot()
  const selected = ref<string | null>(isDate(route.query.date) ? route.query.date : null)

  const [{ data, refresh: refreshMonth, pending }, { data: summary, refresh: refreshSummary }] = await Promise.all([
    useFetch<MonthResponse>('/api/records', {
      query: { month },
      key: 'month',
      default: () => ({ month: month.value, records: [], notes: [] }),
    }),
    // 홈은 최근 7일 동향만 쓴다 (이번 달 기준)
    useFetch<SummaryResponse>('/api/summary', { key: 'summary-home' }),
  ])

  async function refresh() {
    await Promise.all([refreshMonth(), refreshSummary()])
  }

  const slotDone = computed(() => data.value.records.some(r => r.date === slot.value.date && r.session === slot.value.session))

  return { today, thisMonth, month, year, mon, canNext, go, goToday, setMonth, selected, data, pending, summary, refresh, slot, slotDone }
}
