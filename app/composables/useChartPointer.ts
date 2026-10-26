// 그래프 공용(추이·운영): 실제 폭 재기 + 짚은 날 + 말풍선 위치
// 마우스: 올리면 보이고 빠지면 사라진다
// 손가락: 누르면 그날이 뜨고, 같은 날을 다시 누르거나 그래프 바깥을 누르면 닫힌다. 누른 채 옆으로 밀면 따라간다
const TIP_MARGIN = 4

export function useChartPointer(opts: { pad: { left: number, right: number }, count: () => number }) {
  const root = ref<HTMLElement | null>(null)
  const svg = ref<SVGSVGElement | null>(null)
  // 실제 폭에 맞춰 그려서 휴대폰에서도 글자가 작아지지 않게 한다
  const W = ref(640)
  const boxH = ref(0)
  let observer: ResizeObserver | undefined
  onMounted(() => {
    if (!root.value) return
    observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      W.value = Math.max(280, Math.round(entry.contentRect.width))
      boxH.value = Math.round(entry.contentRect.height)
    })
    observer.observe(root.value)
  })

  const active = ref<number | null>(null)
  let pressed = false
  // 이미 열린 날을 다시 눌렀는지 (손을 뗄 때 그대로면 닫는다)
  let tappedOpen: number | null = null

  function indexAt(e: PointerEvent): number | null {
    const el = svg.value
    const n = opts.count()
    if (!el || n === 0) return null
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) * W.value / rect.width
    const i = n <= 1 ? 0 : Math.round((px - opts.pad.left) / (W.value - opts.pad.left - opts.pad.right) * (n - 1))
    return Math.min(n - 1, Math.max(0, i))
  }
  function onDown(e: PointerEvent) {
    if (e.pointerType === 'mouse') return
    const i = indexAt(e)
    if (i == null) return
    pressed = true
    tappedOpen = active.value === i ? i : null
    active.value = i
  }
  function onMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse' && !pressed) return
    const i = indexAt(e)
    if (i == null) return
    if (i !== active.value) tappedOpen = null
    active.value = i
  }
  function onUp(e: PointerEvent) {
    if (e.pointerType === 'mouse') return
    if (tappedOpen != null && active.value === tappedOpen) active.value = null
    pressed = false
    tappedOpen = null
  }
  function onLeave(e: PointerEvent) {
    if (e.pointerType === 'mouse') active.value = null
  }
  // 그래프 바깥을 누르면 닫는다. 말풍선이 열려 있을 때만 듣는다
  function onOutside(e: PointerEvent) {
    if (root.value && !root.value.contains(e.target as Node)) active.value = null
  }
  // svg에 v-on으로 붙인다
  const handlers = { pointerdown: onDown, pointermove: onMove, pointerup: onUp, pointercancel: onUp, pointerleave: onLeave }

  // 말풍선 실제 폭. 짚은 날이 바뀔 때마다 다시 잰다 (그래프 양 끝에서 잘리지 않게 쓴다)
  const tipEl = ref<HTMLElement | null>(null)
  const tipW = ref(0)
  watch(active, async (a, prev) => {
    if (a != null && prev == null) document.addEventListener('pointerdown', onOutside, true)
    if (a == null) {
      document.removeEventListener('pointerdown', onOutside, true)
      tipW.value = 0
      return
    }
    await nextTick()
    tipW.value = tipEl.value?.offsetWidth ?? 0
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    document.removeEventListener('pointerdown', onOutside, true)
  })

  // 말풍선 가운데를 그날 위치에 두되 그래프 밖으로 나가지 않게 안쪽으로 민다. 꼬리는 늘 그날을 가리킨다
  function place(x: number) {
    const center = Math.min(Math.max(x, tipW.value / 2 + TIP_MARGIN), W.value - tipW.value / 2 - TIP_MARGIN)
    return {
      left: `${center}px`,
      caret: `${Math.min(Math.max(x - (center - tipW.value / 2), 14), Math.max(14, tipW.value - 14))}px`,
    }
  }

  return { root, svg, W, boxH, active, handlers, tipEl, tipW, place }
}
