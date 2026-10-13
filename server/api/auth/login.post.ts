export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  // DB를 여러 번 오가지 않게 횟수 제한·잠금 확인·계정 조회를 한꺼번에 한다
  const { users } = await useCollections()
  const [, , user] = await Promise.all([
    rateLimit(event, 'login', 20, 60),
    username && assertNotLocked(event, username),
    username ? users.findOne({ username }) : null,
  ])
  if (!username || !password) throw createError({ statusCode: 400, message: '아이디와 비밀번호를 입력해 주세요.' })

  const ok = await verifyPassword(password, user?.passwordHash ?? await dummyPasswordHash())
  if (!user || !ok) {
    const left = await recordLoginFail(event, username)
    if (left <= 0) throw createError({ statusCode: 429, message: '로그인에 여러 번 실패해서 잠겼어요. 잠시 뒤에 다시 시도해 주세요.' })
    throw createError({
      statusCode: 401,
      message: left <= 2
        ? `아이디 또는 비밀번호가 맞지 않아요. ${left}번 더 틀리면 10분 동안 잠겨요.`
        : '아이디 또는 비밀번호가 맞지 않아요.',
    })
  }

  await Promise.all([
    clearLoginFails(event, username),
    users.updateOne({ _id: user._id }, { $set: { lastSeenAt: new Date() } }),
    createSession(event, user._id, body.remember !== false),
  ])
  // 화면이 /api/me를 다시 부르지 않게 사용자 정보를 같이 준다
  return { ok: true, user: toMeUser(user) }
})
