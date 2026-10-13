// 키를 누르고 있으면 초당 30번쯤 반복돼서 달마다 요청이 나간다. 반복은 이 간격으로만 넘긴다
const REPEAT_MS = 250

// ← → 키로 달을 넘긴다. 입력칸에 쓰는 중이거나 모달·시트가 떠 있으면 건드리지 않는다
export function useMonthKeys(go: (delta: number) => void, canNext: Ref<boolean>) {
  let lastAt = 0
  function onKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    const t = e.target as HTMLElement | null
    if (t?.closest('input, textarea, select, [contenteditable], [role=radiogroup], [role=tablist]')) return
    if (document.querySelector('[aria-modal=true]')) return
    if (e.repeat && e.timeStamp - lastAt < REPEAT_MS) {
      e.preventDefault()
      return
    }
    lastAt = e.timeStamp
    if (e.key === 'ArrowLeft') go(-1)
    else if (canNext.value) go(1)
    else return
    e.preventDefault()
  }
  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}
