import type { Session } from '#shared/types'

// 데스크톱 기록 모달 상태. 어디서든 open() 하면 사이드바 셸이 모달을 띄운다
export function useRecordModal() {
  const state = useState<{ date: string, session: Session } | null>('record-modal', () => null)
  // 저장할 때마다 1씩 올라간다. 날짜 상세 패널이 보고 다시 불러온다
  const version = useState('records-version', () => 0)
  const lastSaved = useState<string | null>('records-last-saved', () => null)

  function open(date?: string, session?: Session) {
    const slot = defaultSlot()
    state.value = { date: date ?? slot.date, session: session ?? slot.session }
  }
  function close() {
    state.value = null
  }
  async function saved(date: string) {
    state.value = null
    invalidatePrefetch()
    lastSaved.value = date
    version.value += 1
    // 지금 화면에 떠 있는 달력·통계를 다시 받는다 (안 보이는 달은 다음에 열 때 새로 받는다)
    await refreshNuxtData()
  }

  return { state, version, lastSaved, open, close, saved }
}
