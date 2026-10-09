import type { MonthResponse } from '#shared/types'

export default defineEventHandler(async (event): Promise<MonthResponse> => {
  const user = requireUser(event)
  const month = getQuery(event).month
  if (!isMonth(month)) throw createError({ statusCode: 400, message: '월 형식을 확인해 주세요.' })

  const from = `${month}-01`
  const to = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`
  const { records, notes } = await useCollections()
  const [recordDocs, noteDocs] = await Promise.all([
    records.find({ userId: user._id, date: { $gte: from, $lte: to } }).sort({ date: 1 }).toArray(),
    notes.find({ userId: user._id, date: { $gte: from, $lte: to } }).toArray(),
  ])
  return { month, records: recordDocs.map(toRecordDto), notes: noteDocs.map(toNoteDto) }
})
