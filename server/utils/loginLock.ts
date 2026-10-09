const MAX_FAILS = 5
const LOCK_MS = 10 * 60 * 1000
// 마지막 실패 후 이 시간이 지나면 실패 횟수를 잊는다
const FORGET_MS = 60 * 60 * 1000

// 같은 아이디로 5번 틀리면 IP와 상관없이 10분 잠근다
export async function assertNotLocked(username: string) {
  const { loginFails } = await useCollections()
  const doc = await loginFails.findOne({ _id: username })
  if (doc?.lockedUntil && doc.lockedUntil > new Date()) {
    const minutes = Math.ceil((doc.lockedUntil.getTime() - Date.now()) / 60000)
    throw createError({ statusCode: 429, message: `비밀번호를 ${MAX_FAILS}번 틀려서 잠겼어요. ${minutes}분 뒤에 다시 시도해 주세요.` })
  }
}

export async function recordLoginFail(username: string): Promise<number> {
  const { loginFails } = await useCollections()
  const now = Date.now()
  const doc = await loginFails.findOneAndUpdate(
    { _id: username },
    { $inc: { count: 1 }, $set: { expireAt: new Date(now + FORGET_MS) }, $setOnInsert: { lockedUntil: null } },
    { upsert: true, returnDocument: 'after' },
  )
  const count = doc?.count ?? 1
  if (count >= MAX_FAILS) {
    await loginFails.updateOne({ _id: username }, { $set: { count: 0, lockedUntil: new Date(now + LOCK_MS), expireAt: new Date(now + LOCK_MS + FORGET_MS) } })
  }
  return MAX_FAILS - count
}

export async function clearLoginFails(username: string) {
  const { loginFails } = await useCollections()
  await loginFails.deleteOne({ _id: username })
}
