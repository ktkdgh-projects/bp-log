// 시간대가 바뀌어도 "아침/저녁 기록하기" 문구가 맞도록 1분마다 다시 계산한다
export function useSlot() {
  const now = ref(new Date())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => { timer = setInterval(() => (now.value = new Date()), 60_000) })
  onBeforeUnmount(() => clearInterval(timer))
  return computed(() => defaultSlot(now.value))
}
