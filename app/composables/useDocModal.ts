// 이용약관·개인정보처리방침을 페이지 이동 없이 모달로 띄운다 (app.vue의 DocModal)
export type DocKind = 'terms' | 'privacy'

export const DOC_TITLE: Record<DocKind, string> = { terms: '이용약관', privacy: '개인정보처리방침' }
export const DOC_UPDATED = '2026년 10월 9일'

export function useDocModal() {
  const doc = useState<DocKind | null>('doc-modal', () => null)
  return {
    doc,
    openDoc: (kind: DocKind) => { doc.value = kind },
    closeDoc: () => { doc.value = null },
  }
}
