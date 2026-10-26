// 이 컴포넌트가 떠 있는 동안 휴대폰 화면이 절전으로 꺼지지 않게 한다 (Wake Lock API)
// 다른 앱에 다녀오면 브라우저가 잠금을 풀어 버려서, 화면이 다시 보이면 새로 건다
// https에서만 동작하고, 지원하지 않는 브라우저에서는 아무 일도 하지 않는다
export function useWakeLock() {
  let lock: WakeLockSentinel | null = null
  let active = false

  async function acquire() {
    if (!active || lock || document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return
    try {
      lock = await navigator.wakeLock.request('screen')
      lock.addEventListener('release', () => { lock = null })
      // 기다리는 사이에 닫혔으면 바로 푼다
      if (!active) release()
    }
    catch {
      // 배터리 절약 모드 등으로 거절되면 그냥 둔다
    }
  }

  function release() {
    lock?.release().catch(() => {})
    lock = null
  }

  onMounted(() => {
    active = true
    acquire()
    document.addEventListener('visibilitychange', acquire)
  })
  onBeforeUnmount(() => {
    active = false
    document.removeEventListener('visibilitychange', acquire)
    release()
  })
}
