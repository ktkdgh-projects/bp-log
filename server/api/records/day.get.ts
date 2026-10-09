import type { DayResponse } from '#shared/types'

export default defineEventHandler(async (event): Promise<DayResponse> => {
  const user = requireUser(event)
  const date = getQuery(event).date
  if (!isDate(date)) throw createError({ statusCode: 400, message: '날짜 형식을 확인해 주세요.' })

  const { records, notes } = await useCollections()
  const [recordDocs, note] = await Promise.all([
    records.find({ userId: user._id, date }).toArray(),
    notes.findOne({ userId: user._id, date }),
  ])
  const pick = (session: 'morning' | 'evening') => {
    const doc = recordDocs.find(r => r.session === session)
    return doc ? toRecordDto(doc) : null
  }
  return { date, morning: pick('morning'), evening: pick('evening'), note: note ? toNoteDto(note) : null }
})
