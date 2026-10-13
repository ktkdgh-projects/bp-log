import type { H3Event } from 'h3'

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
// 가장 큰 요청(혈압 3회차·메모 200자)도 1KB 안팎이다. 큰 본문으로 서버를 붙잡는 요청은 읽기 전에 끊는다
const MAX_BODY_BYTES = 16 * 1024

function assertSafeWrite(event: H3Event) {
  // SameSite=Lax 쿠키에 더해, 쓰기 요청은 다른 사이트에서 온 것을 막는다
  const origin = getHeader(event, 'origin')
  const fetchSite = getHeader(event, 'sec-fetch-site')
  const sameOrigin = origin
    ? origin === getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
    : !fetchSite || fetchSite === 'same-origin'
  if (!sameOrigin) throw createError({ statusCode: 403, message: '허용되지 않은 요청이에요.' })

  // 화면은 JSON으로만 보낸다. form·text/plain 같은 단순 요청(CSRF에 쓰이는 형태)은 받지 않는다
  const contentType = getHeader(event, 'content-type')
  if (contentType && !contentType.toLowerCase().startsWith('application/json')) {
    throw createError({ statusCode: 415, message: '허용되지 않은 요청이에요.' })
  }
  if (Number(getHeader(event, 'content-length') ?? 0) > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, message: '요청이 너무 커요.' })
  }
}

export default defineEventHandler(async (event) => {
  const isApi = event.path.startsWith('/api/')
  if (!isApi && (event.path.startsWith('/_nuxt/') || /\.\w+$/.test(event.path.split('?')[0]!))) return

  // 건강 기록이 캐시에 남지 않게 한다. 페이지는 뒤로 가기 캐시를 위해 no-cache, API는 아예 저장하지 않는다
  setResponseHeader(event, 'Cache-Control', isApi ? 'private, no-store' : 'private, no-cache')
  if (isApi && UNSAFE_METHODS.has(event.method)) assertSafeWrite(event)

  // 페이지 요청에서도 세션을 읽어야 토큰 교체 쿠키가 브라우저까지 간다 (SSR 내부 API 호출의 Set-Cookie는 버려짐)
  await loadSession(event)
})
