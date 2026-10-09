import type { RecordDto } from '#shared/types'

export default defineEventHandler(async (event): Promise<RecordDto> => {
  const user = requireUser(event)
  await rateLimit(event, 'record', 60, 60)

  const body = await readBody<Record<string, unknown>>(event)
  const date = readDate(body?.date)
  const session = readSession(body?.session)
  const readings = readReadings(body?.readings)
  const avg = averageOf(readings)

  const { records } = await useCollections()
  const now = new Date()
  const doc = await records.findOneAndUpdate(
    { userId: user._id, date, session },
    { $set: { readings, avg, measuredAt: now, updatedAt: now }, $setOnInsert: { userId: user._id, date, session, createdAt: now } },
    { upsert: true, returnDocument: 'after' },
  )
  if (!doc) throw createError({ statusCode: 500, message: '저장하지 못했어요.' })
  return toRecordDto(doc)
})
