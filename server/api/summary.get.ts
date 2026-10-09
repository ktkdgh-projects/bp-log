import type { SummaryResponse } from '#shared/types'

// 최근 동향(지난주 비교, 메모 태그와 다음 날 아침)은 고른 달과 상관없이 오늘부터 넉넉히 본다
const LOOKBACK_DAYS = 60

// ?month=YYYY-MM (없으면 이번 달): 그 달 그래프·통계 + 오늘 기준 최근 7일 동향
export default defineEventHandler(async (event): Promise<SummaryResponse> => {
  const user = requireUser(event)
  const today = kstToday()
  const q = getQuery(event).month
  const month = q == null || q === '' ? today.slice(0, 7) : q
  if (!isMonth(month) || month > today.slice(0, 7)) throw createError({ statusCode: 400, message: '달을 확인해 주세요.' })

  const lookFrom = addDays(today, -(LOOKBACK_DAYS - 1))
  const range = { $or: [{ date: { $gte: `${month}-01`, $lte: `${month}-31` } }, { date: { $gte: lookFrom, $lte: today } }] }
  const { records, notes } = await useCollections()
  const [recordDocs, noteDocs] = await Promise.all([
    records.find({ userId: user._id, ...range }, { projection: { date: 1, session: 1, avg: 1 } }).toArray(),
    notes.find({ userId: user._id, date: { $gte: lookFrom, $lte: today } }, { projection: { date: 1, tags: 1 } }).toArray(),
  ])
  return buildSummary({ today, month, records: recordDocs, notes: noteDocs })
})
