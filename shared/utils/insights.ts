import type { Average, Insight, PeriodStat, SeriesPoint, Session, SummaryResponse } from '../types'
import { gradeOf } from './bp'
import { addDays, dateRange } from './kst'

export interface SummaryInput {
  today: string
  days: number
  records: { date: string, session: Session, avg: Average }[]
  notes: { date: string, tags: string[] }[]
}

// 지난주와 이만큼 차이 나면 '좋아짐/올라감'으로 본다
const TREND_DELTA = 3
// 아침이 저녁보다 이만큼 높으면 아침 혈압 패턴으로 본다
const MORNING_SURGE = 15
const TAG_MIN_DAYS = 3
const TAG_DELTA = 3

function statOf(values: Average[]): PeriodStat | null {
  if (!values.length) return null
  return {
    sys: Math.round(values.reduce((s, v) => s + v.sys, 0) / values.length),
    dia: Math.round(values.reduce((s, v) => s + v.dia, 0) / values.length),
    count: values.length,
  }
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null
}

// 같은 기간의 아침·저녁을 합친 수축기 평균
function combinedSys(stats: (PeriodStat | null)[]): number | null {
  let sum = 0
  let count = 0
  for (const s of stats) {
    if (!s) continue
    sum += s.sys * s.count
    count += s.count
  }
  return count ? sum / count : null
}

export function buildSummary({ today, days, records, notes }: SummaryInput): SummaryResponse {
  const byDate = new Map<string, SeriesPoint>()
  for (const r of records) {
    const point = byDate.get(r.date) ?? { date: r.date, morning: null, evening: null }
    point[r.session] = r.avg
    byDate.set(r.date, point)
  }
  const pick = (from: string, to: string, session: Session) =>
    dateRange(from, to).map(d => byDate.get(d)?.[session]).filter((v): v is Average => !!v)

  const weekFrom = addDays(today, -6)
  const lastFrom = addDays(today, -13)
  const lastTo = addDays(today, -7)
  const week = { morning: statOf(pick(weekFrom, today, 'morning')), evening: statOf(pick(weekFrom, today, 'evening')) }
  const lastWeek = { morning: statOf(pick(lastFrom, lastTo, 'morning')), evening: statOf(pick(lastFrom, lastTo, 'evening')) }

  const headline = buildHeadline(week, lastWeek)
  const insights: Insight[] = []

  // 아침·저녁 차이
  if (week.morning && week.evening && week.morning.count >= 3 && week.evening.count >= 3) {
    const gap = week.morning.sys - week.evening.sys
    if (gap >= MORNING_SURGE) {
      insights.push({ tone: 'caution', title: `아침이 저녁보다 ${gap} 높아요`, body: '아침 혈압이 특히 높은 패턴이에요. 진료 때 이 기록을 보여주세요.' })
    }
    else if (gap >= 5) {
      insights.push({ tone: 'info', title: `아침이 저녁보다 ${gap} 높아요`, body: '아침 관리가 핵심이에요. 일어나서 5분 앉아 쉰 뒤 재는 습관을 지켜보세요.' })
    }
    else if (gap <= -5) {
      insights.push({ tone: 'info', title: `저녁이 아침보다 ${-gap} 높아요`, body: '저녁 식사·음주가 영향을 주는지 메모로 함께 남겨보세요.' })
    }
  }

  // 메모 태그와 다음 날 아침 혈압
  const tagDates = new Map<string, Set<string>>()
  for (const n of notes) {
    for (const t of n.tags) {
      if (!tagDates.has(t)) tagDates.set(t, new Set())
      tagDates.get(t)!.add(n.date)
    }
  }
  const tagInsight = (tag: string, better: boolean) => {
    const dates = tagDates.get(tag)
    if (!dates) return
    const withTag: number[] = []
    const without: number[] = []
    for (const [date, point] of byDate) {
      const next = byDate.get(addDays(date, 1))?.morning
      if (!point || !next) continue
      if (dates.has(date)) withTag.push(next.sys)
      else without.push(next.sys)
    }
    if (withTag.length < TAG_MIN_DAYS || without.length < TAG_MIN_DAYS) return
    const diff = Math.round(mean(withTag)! - mean(without)!)
    if (better && diff <= -TAG_DELTA) {
      insights.push({ tone: 'good', title: `${tag.replace('함', '')}한 다음 날 아침이 ${-diff} 낮았어요`, body: `메모 기준 ${withTag.length}일을 비교했어요. 계속 이어가 보세요.` })
    }
    if (!better && diff >= TAG_DELTA) {
      insights.push({ tone: 'caution', title: `${tag} 다음 날 아침이 ${diff} 높았어요`, body: `메모 기준 ${withTag.length}일을 비교했어요.` })
    }
  }
  tagInsight('운동함', true)
  tagInsight('음주', false)
  tagInsight('짜게 먹음', false)
  tagInsight('잠 부족', false)

  // 기록 습관
  const recentFrom = addDays(today, -(Math.min(days, 14) - 1))
  const recentDays = dateRange(recentFrom, today)
  const recorded = recentDays.reduce((n, d) => n + (byDate.get(d)?.morning ? 1 : 0) + (byDate.get(d)?.evening ? 1 : 0), 0)
  const expected = recentDays.length * 2
  if (recorded > 0) {
    const missing = expected - recorded
    insights.push({
      tone: 'info',
      title: `${recentDays.length}일 동안 ${recorded}번 기록했어요`,
      body: missing === 0 ? '하루도 빠짐없이 기록 중이에요.' : missing <= 2 ? `빠진 건 ${missing}번뿐이에요.` : '아침·저녁 한 번씩, 꾸준히 쌓을수록 동향이 정확해져요.',
    })
  }

  const seriesFrom = addDays(today, -(days - 1))
  const series = dateRange(seriesFrom, today).map(d => byDate.get(d) ?? { date: d, morning: null, evening: null })

  let peak: SummaryResponse['peak'] = null
  for (const p of series) {
    for (const session of ['morning', 'evening'] as const) {
      const v = p[session]
      if (v && (!peak || v.sys > peak.sys)) peak = { date: p.date, session, sys: v.sys, dia: v.dia }
    }
  }

  return { days, today, headline, insights, week, lastWeek, series, peak, recorded, expected }
}

function buildHeadline(
  week: { morning: PeriodStat | null, evening: PeriodStat | null },
  lastWeek: { morning: PeriodStat | null, evening: PeriodStat | null },
): Insight {
  if (!week.morning && !week.evening) {
    return { tone: 'empty', title: '아직 이번 주 기록이 없어요', body: '아침에 일어나서, 자기 전에 한 번씩. 1분 간격으로 2번 재서 넣어 주세요.' }
  }

  const grades = [week.morning, week.evening].filter((s): s is PeriodStat => !!s).map(s => gradeOf(s.sys, s.dia))
  if (grades.includes('stage2')) {
    return { tone: 'warn', title: '많이 높아요', body: '최근 7일 평균이 160/100 이상이에요(고혈압 2기). 가능한 빨리 진료를 받아보세요.' }
  }

  const now = combinedSys([week.morning, week.evening])!
  const before = combinedSys([lastWeek.morning, lastWeek.evening])
  const delta = before == null ? null : Math.round(now - before)
  const worse = (week.morning && lastWeek.morning && week.morning.sys - lastWeek.morning.sys >= TREND_DELTA) ? '아침' : '평균'

  if (grades.includes('stage1')) {
    return {
      tone: 'warn',
      title: delta != null && delta <= -TREND_DELTA ? '높지만 내려오는 중이에요' : '운동이 필요해요',
      body: delta != null && delta <= -TREND_DELTA
        ? `지난주보다 ${-delta} 낮아졌지만 아직 140/90 이상이에요. 지금 습관을 이어가세요.`
        : '최근 7일 평균이 140/90 이상이에요(고혈압 1기). 걷기·싱겁게 먹기를 챙기고, 2주 넘게 이어지면 진료를 받아보세요.',
    }
  }

  if (delta != null && delta <= -TREND_DELTA) {
    return { tone: 'good', title: '좋아지고 있어요', body: `수축기 평균이 지난주보다 ${-delta} 낮아졌어요.` }
  }
  if (delta != null && delta >= TREND_DELTA) {
    return { tone: 'up', title: '올라가고 있어요', body: `${worse} 수축기가 지난주보다 ${delta} 높아졌어요. 운동량과 짠 음식을 점검해 보세요.` }
  }
  const base = delta == null ? '아직 비교할 지난주 기록이 없어요.' : '지난주와 비슷해요.'
  if (grades.includes('prehigh')) {
    return { tone: 'caution', title: '고혈압 전단계예요', body: `${base} 130–139 / 80–89 범위라 운동·식단 관리가 필요해요.` }
  }
  if (grades.includes('elevated')) {
    return { tone: 'caution', title: '조금 높은 편이에요', body: `${base} 수축기 120–129 주의 범위예요.` }
  }
  return { tone: 'steady', title: '좋은 상태예요', body: delta == null ? '최근 7일 모두 정상 범위예요.' : '지난주와 비슷하게 정상 범위를 지키고 있어요.' }
}
