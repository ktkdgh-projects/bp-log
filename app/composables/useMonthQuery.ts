// 주소의 ?month=YYYY-MM으로 보는 달을 정한다 (달력·추이 공용). 이번 달이면 주소에서 뺀다
export function useMonthQuery() {
  const route = useRoute()
  const router = useRouter()
  const today = kstToday()
  const thisMonth = today.slice(0, 7)

  const month = computed(() => (isMonth(route.query.month) && route.query.month <= thisMonth ? route.query.month : thisMonth))
  const year = computed(() => Number(month.value.slice(0, 4)))
  const mon = computed(() => Number(month.value.slice(5, 7)))
  const canNext = computed(() => month.value < thisMonth)

  function setMonth(next: string) {
    router.replace({ query: next === thisMonth ? {} : { month: next } })
  }
  const go = (delta: number) => setMonth(addMonths(month.value, delta))
  const goToday = () => setMonth(thisMonth)

  return { today, thisMonth, month, year, mon, canNext, go, goToday, setMonth }
}
