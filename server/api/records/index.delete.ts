export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = await readBody<Record<string, unknown>>(event)
  if (!isDate(body?.date)) throw createError({ statusCode: 400, message: '날짜 형식을 확인해 주세요.' })
  const session = readSession(body?.session)
  assertRecordEditable(body.date)

  const { records } = await useCollections()
  await records.deleteOne({ userId: user._id, date: body.date, session })
  return { ok: true }
})
