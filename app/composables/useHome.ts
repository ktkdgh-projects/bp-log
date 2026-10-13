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
      key: computed(() => monthKey(month.value)),
      getCachedData: staleWhileRevalidate,
      // 받기 전 빈 자리. month가 비어 있어 날짜 패널이 이걸 그 달 데이터로 착각하지 않는다
      default: () => ({ month: '', records: [], notes: [] }),
    }),
    // 홈은 최근 7일 동향만 쓴다. 추이 화면의 이번 달과 같은 키라서 탭을 옮기면 바로 보인다
    useFetch<SummaryResponse>('/api/summary', {
      query: { month: thisMonth },
      key: summaryKey(thisMonth),
      getCachedData: staleWhileRevalidate,
    }),
  ])

  // ← → 로 넘길 앞뒤 달을 미리 받아 둔다
  prefetchAroundMonth(month, thisMonth, monthKey, next => $fetch<MonthResponse>('/api/records', { query: { month: next } }))

  async function refresh() {
    await Promise.all([refreshMonth(), refreshSummary()])
  }

  const slotDone = computed(() => data.value.records.some(r => r.date === slot.value.date && r.session === slot.value.session))

  // 날짜 패널에 넘길 그 달 데이터. 뒤에서 새로 받는 중에도 들고 있는 걸 쓰고, 아직 하나도 없을 때만 null(기다림)
  const monthData = computed(() => (data.value.month ? data.value : null))

  return { today, thisMonth, month, year, mon, canNext, go, goToday, setMonth, selected, data, monthData, pending, summary, refresh, slot, slotDone }
}
