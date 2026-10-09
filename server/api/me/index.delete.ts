export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  await rateLimit(event, 'withdraw', 10, 60 * 60)

  const body = await readBody<Record<string, unknown>>(event)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!await verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 400, message: '비밀번호가 맞지 않아요.' })
  }

  const { users, sessions, records, notes } = await useCollections()
  await records.deleteMany({ userId: user._id })
  await notes.deleteMany({ userId: user._id })
  await sessions.deleteMany({ userId: user._id })
  await users.deleteOne({ _id: user._id })
  clearSessionCookie(event)
  return { ok: true }
})
