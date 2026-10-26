// 화면을 처음 누를 때 알림음을 낼 수 있게 열어 둔다 (브라우저는 사람이 누르기 전엔 소리를 막는다)
export default defineNuxtPlugin(() => {
  // 아이폰 무음 스위치가 켜져 있어도 알림음은 들리게 (지원하는 사파리만)
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (session) session.type = 'playback'

  const unlock = () => unlockChime()
  for (const type of ['pointerdown', 'keydown'] as const) window.addEventListener(type, unlock, { capture: true, passive: true })
})
