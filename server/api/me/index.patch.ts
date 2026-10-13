export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  await rateLimit(event, 'nickname', 30, 60 * 60)
  const body = await readBody<Record<string, unknown>>(event)
  const nickname = readNickname(body?.nickname)

  const { users } = await useCollections()
  await users.updateOne({ _id: user._id }, { $set: { nickname } })
  forgetCachedSessions()
  return { ok: true }
})
