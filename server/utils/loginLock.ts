import type { H3Event } from 'h3'

const MAX_FAILS = 5
const LOCK_MS = 10 * 60 * 1000
// 여러 IP로 나눠 들어오는 대입 공격(봇·크리덴셜 스터핑)은 아이디 기준으로 따로 센다
const MAX_FAILS_ALL_IPS = 20
const LOCK_ALL_IPS_MS = 30 * 60 * 1000
// 마지막 실패 후 이 시간이 지나면 실패 횟수를 잊는다
const FORGET_MS = 60 * 60 * 1000

// 한 IP에서 같은 아이디로 5번 틀리면 그 IP만 10분 잠근다. 남이 일부러 틀려서 주인까지 못 들어오게 막는 걸 줄인다
// IP와 상관없이 같은 아이디가 20번 틀리면 아이디 전체를 30분 잠근다
function lockKeys(event: H3Event, username: string) {
  return { ip: `ip:${clientIp(event)}:${username}`, all: `user:${username}` }
}

export async function assertNotLocked(event: H3Event, username: string) {
  const { loginFails } = await useCollections()
  const keys = lockKeys(event, username)
  const now = new Date()
  const doc = await loginFails.findOne({ _id: { $in: [keys.ip, keys.all] }, lockedUntil: { $gt: now } })
  if (doc?.lockedUntil) {
    const minutes = Math.ceil((doc.lockedUntil.getTime() - now.getTime()) / 60000)
    throw createError({ statusCode: 429, message: `로그인에 여러 번 실패해서 잠겼어요. ${minutes}분 뒤에 다시 시도해 주세요.` })
  }
}

async function bump(id: string, max: number, lockMs: number): Promise<number> {
  const { loginFails } = await useCollections()
  const now = Date.now()
  const doc = await loginFails.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $set: { expireAt: new Date(now + FORGET_MS) }, $setOnInsert: { lockedUntil: null } },
    { upsert: true, returnDocument: 'after' },
  )
  const count = doc?.count ?? 1
  if (count >= max) {
    await loginFails.updateOne({ _id: id }, { $set: { count: 0, lockedUntil: new Date(now + lockMs), expireAt: new Date(now + lockMs + FORGET_MS) } })
  }
  return max - count
}

// 이 IP에서 잠기기까지 남은 횟수. 아이디 전체가 잠기면 0
export async function recordLoginFail(event: H3Event, username: string): Promise<number> {
  const keys = lockKeys(event, username)
  const [ipLeft, allLeft] = await Promise.all([
    bump(keys.ip, MAX_FAILS, LOCK_MS),
    bump(keys.all, MAX_FAILS_ALL_IPS, LOCK_ALL_IPS_MS),
  ])
  return allLeft <= 0 ? 0 : ipLeft
}

export async function clearLoginFails(event: H3Event, username: string) {
  const { loginFails } = await useCollections()
  const keys = lockKeys(event, username)
  // 아이디 전체 횟수는 남긴다. 공격 중에 주인이 한 번 로그인했다고 봇의 시도 횟수가 지워지면 안 된다
  await loginFails.deleteOne({ _id: keys.ip })
}
