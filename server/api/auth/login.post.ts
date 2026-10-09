export default defineEventHandler(async (event) => {
  await rateLimit(event, 'login', 20, 60)

  const body = await readBody<Record<string, unknown>>(event)
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!username || !password) throw createError({ statusCode: 400, message: '아이디와 비밀번호를 입력해 주세요.' })

  await assertNotLocked(username)

  const { users } = await useCollections()
  const user = await users.findOne({ username })
  const ok = await verifyPassword(password, user?.passwordHash ?? await dummyPasswordHash())
  if (!user || !ok) {
    const left = await recordLoginFail(username)
    if (left <= 0) throw createError({ statusCode: 429, message: '비밀번호를 5번 틀려서 10분 동안 잠겼어요.' })
    throw createError({
      statusCode: 401,
      message: left <= 2
        ? `아이디 또는 비밀번호가 맞지 않아요. ${left}번 더 틀리면 10분 동안 잠겨요.`
        : '아이디 또는 비밀번호가 맞지 않아요.',
    })
  }

  await clearLoginFails(username)
  await users.updateOne({ _id: user._id }, { $set: { lastSeenAt: new Date() } })
  await createSession(event, user._id, body.remember !== false)
  return { ok: true }
})
