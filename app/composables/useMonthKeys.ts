// ← → 키로 달을 넘긴다. 입력칸에 쓰는 중이거나 모달·시트가 떠 있으면 건드리지 않는다
export function useMonthKeys(go: (delta: number) => void, canNext: Ref<boolean>) {
  function onKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    const t = e.target as HTMLElement | null
    if (t?.closest('input, textarea, select, [contenteditable], [role=radiogroup], [role=tablist]')) return
    if (document.querySelector('[aria-modal=true]')) return
    if (e.key === 'ArrowLeft') go(-1)
    else if (canNext.value) go(1)
    else return
    e.preventDefault()
  }
  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}
