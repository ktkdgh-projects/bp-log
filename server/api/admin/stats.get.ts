import type { AdminStatsResponse } from '#shared/types'

// 운영 통계 (?days=30|90). 사람 수·기록 수 합계만 내고, 누구의 어떤 혈압인지는 내보내지 않는다
export default defineEventHandler(async (event): Promise<AdminStatsResponse> => {
  requireAdmin(event)
  const days = getQuery(event).days === '90' ? 90 : 30
  const today = kstToday()
  const from = addDays(today, -(days - 1))
  const now = Date.now()
  const since = (d: number) => new Date(now - d * DAY_MS)
  // 기간 첫날 0시(한국 시각)
  const fromAt = new Date(Date.parse(`${from}T00:00:00+09:00`))

  const { users, records } = await useCollections()
  const [userCount, before, recordCount, active1, active7, active30, signupDocs, recordDocs] = await Promise.all([
    users.estimatedDocumentCount(),
    users.countDocuments({ createdAt: { $lt: fromAt } }),
    records.estimatedDocumentCount(),
    users.countDocuments({ lastSeenAt: { $gte: since(1) } }),
    users.countDocuments({ lastSeenAt: { $gte: since(7) } }),
    users.countDocuments({ lastSeenAt: { $gte: since(30) } }),
    // 기간 안 한국 날짜별 가입 수
    users.aggregate<{ _id: string, n: number }>([
      { $match: { createdAt: { $gte: fromAt } } },
      { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: '+09:00' } }, n: { $sum: 1 } } },
    ]).toArray(),
    // 기간 안 날짜별 기록 수와 기록한 사람 수
    records.aggregate<{ _id: string, records: number, recorders: number }>([
      { $match: { date: { $gte: from, $lte: today } } },
      { $group: { _id: '$date', records: { $sum: 1 }, users: { $addToSet: '$userId' } } },
      { $project: { records: 1, recorders: { $size: '$users' } } },
    ]).toArray(),
  ])

  const signupsByDate = new Map(signupDocs.map(d => [d._id, d.n]))
  const recordsByDate = new Map(recordDocs.map(d => [d._id, d]))
  let total = before
  const series = dateRange(from, today).map((date) => {
    const signups = signupsByDate.get(date) ?? 0
    total += signups
    const r = recordsByDate.get(date)
    return { date, signups, total, recorders: r?.recorders ?? 0, records: r?.records ?? 0 }
  })
  const signupsSince = (d: number) => signupDocs.filter(x => x._id >= addDays(today, -(d - 1))).reduce((n, x) => n + x.n, 0)

  return {
    generatedAt: new Date(now).toISOString(),
    days,
    totals: {
      users: userCount,
      newToday: signupsByDate.get(today) ?? 0,
      new7: signupsSince(7),
      new30: signupsSince(30),
      active1,
      active7,
      active30,
      records: recordCount,
      recordersToday: recordsByDate.get(today)?.recorders ?? 0,
    },
    series,
  }
})
