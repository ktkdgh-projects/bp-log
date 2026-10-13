export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  await rateLimit(event, 'withdraw', 10, 60 * 60)

  const body = await readBody<Record<string, unknown>>(event)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!await verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 400, message: '비밀번호가 맞지 않아요.' })
  }

  const { users, sessions, records, notes } = await useCollections()
  // 기록부터 지우고 계정은 마지막에. 중간에 실패해도 다시 탈퇴하면 남은 것까지 지워진다
  await Promise.all([
    records.deleteMany({ userId: user._id }),
    notes.deleteMany({ userId: user._id }),
    sessions.deleteMany({ userId: user._id }),
  ])
  await users.deleteOne({ _id: user._id })
  forgetCachedSessions()
  clearSessionCookie(event)
  return { ok: true }
})
