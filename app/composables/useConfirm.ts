import type { Grade } from '#shared/types'

export interface ConfirmOptions {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  // 지우기처럼 되돌릴 수 없는 일이면 빨간 버튼
  danger?: boolean
  // 지울 기록을 한 번 더 보여 준다 (예: 아침 128/82)
  preview?: { label: string, value: string, grade?: Grade | null }
}

// 브라우저 confirm() 대신 쓰는 확인창. app.vue의 <ConfirmDialog />가 그린다
// const ok = await useConfirm().ask({ title: '지울까요?', danger: true })
let resolver: ((ok: boolean) => void) | null = null

export function useConfirm() {
  const state = useState<ConfirmOptions | null>('confirm', () => null)

  function ask(options: ConfirmOptions): Promise<boolean> {
    // 이미 떠 있으면 앞의 것은 취소로 끝낸다
    resolver?.(false)
    state.value = options
    return new Promise((resolve) => { resolver = resolve })
  }

  function answer(ok: boolean) {
    resolver?.(ok)
    resolver = null
    state.value = null
  }

  return { state, ask, answer }
}
