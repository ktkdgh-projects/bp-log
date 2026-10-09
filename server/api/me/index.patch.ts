export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = await readBody<Record<string, unknown>>(event)
  const nickname = readNickname(body?.nickname)

  const { users } = await useCollections()
  await users.updateOne({ _id: user._id }, { $set: { nickname } })
  return { ok: true }
})
