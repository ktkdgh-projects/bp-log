export function errorMessage(error: unknown, fallback = '문제가 생겼어요. 잠시 후 다시 시도해 주세요.'): string {
  const data = (error as { data?: { message?: string } } | null)?.data
  return data?.message || fallback
}

// 로그인 뒤 돌아갈 주소는 같은 사이트 경로만 받는다
// 브라우저는 /\evil.com 을 //evil.com 으로 읽고 탭·줄바꿈은 지우고 읽어서, 역슬래시와 제어 문자도 막는다
export function safeNext(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/'
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f]/.test(value)) return '/'
  return value
}
