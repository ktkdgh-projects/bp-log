import type { H3Event } from 'h3'

// Vercel은 x-real-ip에 실제 접속 IP를 넣고 x-forwarded-for도 덮어써서, 클라이언트가 보낸 값으로 IP를 속일 수 없다
export function clientIp(event: H3Event): string {
  return getHeader(event, 'x-real-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

// 서버리스 인스턴스끼리 메모리를 공유하지 않으므로 횟수는 DB에 센다
// 로그인한 요청은 사용자별로 센다. 훔친 세션으로 IP를 바꿔 가며 시도해도 같이 묶인다. 로그인 전에는 IP별로
export async function rateLimit(event: H3Event, bucket: string, limit: number, windowSec: number) {
  const key = event.context.user?._id.toHexString() ?? clientIp(event)
  const windowStart = Math.floor(Date.now() / 1000 / windowSec) * windowSec
  const { rateLimits } = await useCollections()
  const doc = await rateLimits.findOneAndUpdate(
    { _id: `${bucket}:${key}:${windowStart}` },
    { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date((windowStart + windowSec) * 1000) } },
    { upsert: true, returnDocument: 'after' },
  )
  if ((doc?.count ?? 0) > limit) {
    throw createError({ statusCode: 429, message: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' })
  }
}
