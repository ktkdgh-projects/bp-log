import type { SummaryResponse } from '#shared/types'

const PERIODS = new Set([7, 14, 30, 90])
// 메모 태그와 혈압의 관계는 기간과 상관없이 넉넉히 본다
const LOOKBACK_DAYS = 60

export default defineEventHandler(async (event): Promise<SummaryResponse> => {
  const user = requireUser(event)
  const days = Number(getQuery(event).days ?? 14)
  if (!PERIODS.has(days)) throw createError({ statusCode: 400, message: '기간을 확인해 주세요.' })

  const today = kstToday()
  const from = addDays(today, -(Math.max(days, LOOKBACK_DAYS) - 1))
  const { records, notes } = await useCollections()
  const [recordDocs, noteDocs] = await Promise.all([
    records.find({ userId: user._id, date: { $gte: from, $lte: today } }, { projection: { date: 1, session: 1, avg: 1 } }).toArray(),
    notes.find({ userId: user._id, date: { $gte: from, $lte: today } }, { projection: { date: 1, tags: 1 } }).toArray(),
  ])
  return buildSummary({ today, days, records: recordDocs, notes: noteDocs })
})
