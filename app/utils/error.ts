export function errorMessage(error: unknown, fallback = '문제가 생겼어요. 잠시 후 다시 시도해 주세요.'): string {
  const data = (error as { data?: { message?: string } } | null)?.data
  return data?.message || fallback
}

// 로그인 뒤 돌아갈 주소는 같은 사이트 경로만 받는다
export function safeNext(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}
