export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  await rateLimit(event, 'password', 10, 60 * 60)

  const body = await readBody<Record<string, unknown>>(event)
  const current = typeof body?.current === 'string' ? body.current : ''
  if (!await verifyPassword(current, user.passwordHash)) {
    throw createError({ statusCode: 400, message: '지금 비밀번호가 맞지 않아요.' })
  }
  const next = readPassword(body?.next)

  const { users } = await useCollections()
  await users.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(next) } })
  // 다른 기기에 남은 로그인은 끊는다
  await revokeSessions(user._id, { exceptId: event.context.session?._id })
  return { ok: true }
})
