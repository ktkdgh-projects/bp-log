import type { NoteDto } from '#shared/types'

export default defineEventHandler(async (event): Promise<NoteDto> => {
  const user = requireUser(event)
  await rateLimit(event, 'note', 60, 60)

  const body = await readBody<Record<string, unknown>>(event)
  const date = readDate(body?.date)
  assertDateEditable(date)
  const tags = readTags(body?.tags)
  const memo = readMemo(body?.memo)

  const { notes } = await useCollections()
  if (!tags.length && !memo) {
    await notes.deleteOne({ userId: user._id, date })
    return { date, tags, memo }
  }
  await notes.updateOne(
    { userId: user._id, date },
    { $set: { tags, memo, updatedAt: new Date() }, $setOnInsert: { userId: user._id, date } },
    { upsert: true },
  )
  return { date, tags, memo }
})
