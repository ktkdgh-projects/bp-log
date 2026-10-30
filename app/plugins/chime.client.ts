// 알림음은 기록 화면에서만 쓴다. 기록 화면으로 가는 링크나 기록 화면 안([data-chime])을 누를 때만 소리를 열어 둔다
// (다른 화면에서 소리를 열면 아이폰에서 듣던 음악이 멈춘다. PC 기록 모달은 useRecordModal().open()에서 연다)
export default defineNuxtPlugin(() => {
  const unlock = (e: Event) => {
    if ((e.target as Element | null)?.closest?.('[data-chime], a[href^="/record"]')) unlockChime()
  }
  for (const type of ['pointerdown', 'keydown'] as const) window.addEventListener(type, unlock, { capture: true, passive: true })
})
