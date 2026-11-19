import type { Average, Grade, Insight, InsightTone, MonthReport, ReportFactor, ReportTag, SeriesPoint, Session, SessionTrend } from '../types'
import { GRADES, GRADE_LABEL, SESSION_LABEL, gradeOf, inTarget } from './bp'
import { DAY_MS, WEEKDAYS, addDays, addMonths, dateRange, formatShort, monthEnd, weekday } from './kst'

// 월간 분석 리포트. 통계로 본 경향일 뿐 진단이 아니다 (화면에도 그렇게 적는다)

// 리포트를 내려면 그 달에 이만큼은 기록이 있어야 한다
const REPORT_MIN = 6
// 추세(회귀선)는 시간대마다 이만큼 기록이 있고, 처음과 끝이 이만큼 떨어져 있어야 본다
const TREND_POINTS = 5
const TREND_SPAN_DAYS = 7
// 요일·태그 비교에 쓰는 최소 표본
const DOW_MIN = 2
const TAG_MIN_DAYS = 3
const WEIGHT: Record<ReportFactor['key'], number> = { level: 0.5, trend: 0.2, stability: 0.1, habit: 0.2 }
// 다른 항목이 좋아도 혈압 수준보다 이만큼 넘게 높은 점수는 주지 않는다 (높은 혈압을 '좋아요'로 보이지 않게)
const LEVEL_LEAD = 8
// 추세선을 앞으로 늘려 보는 기간과 그 사이 바뀔 수 있는 최대 폭 (직선이 끝없이 이어지진 않으니 짧고 보수적으로)
const PROJECT_DAYS = 14
const PROJECT_MAX = 8

type Entry = { date: string, session: Session, v: Average }

export interface ReportInput {
  today: string
  month: string
  byDate: Map<string, SeriesPoint>
  // 날짜별 메모 태그
  tagsByDate: Map<string, string[]>
}

const round1 = (v: number) => Math.round(v * 10) / 10
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
const sd = (xs: number[]) => {
  const m = mean(xs)
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, xs.length - 1))
}

// 점들을 잇는 꺾은선으로 점수를 매긴다 (범위 밖은 양 끝 값)
function scale(v: number, points: [number, number][]): number {
  if (v <= points[0]![0]) return points[0]![1]
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]!
    const [x0, y0] = points[i - 1]!
    if (v <= x1) return y0 + (y1 - y0) * (v - x0) / (x1 - x0)
  }
  return points[points.length - 1]![1]
}

// 최소제곱 직선 (x는 날짜 순번)
function fit(xs: number[], ys: number[]) {
  const mx = mean(xs)
  const my = mean(ys)
  let num = 0
  let den = 0
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i]! - mx) * (ys[i]! - my)
    den += (xs[i]! - mx) ** 2
  }
  const slope = den ? num / den : 0
  return { slope, at: (x: number) => my + slope * (x - mx) }
}

function readingsIn(byDate: Map<string, SeriesPoint>, from: string, to: string): Entry[] {
  return dateRange(from, to).flatMap((date) => {
    const p = byDate.get(date)
    return (['morning', 'evening'] as const).flatMap(session => (p?.[session] ? [{ date, session, v: p[session]! }] : []))
  })
}

function trendOf(readings: Entry[], session: Session, from: string): SessionTrend | null {
  const own = readings.filter(r => r.session === session)
  if (own.length < TREND_POINTS) return null
  const day0 = Date.parse(`${from}T00:00:00Z`)
  const xs = own.map(r => (Date.parse(`${r.date}T00:00:00Z`) - day0) / DAY_MS)
  if (xs[xs.length - 1]! - xs[0]! < TREND_SPAN_DAYS) return null
  const sys = fit(xs, own.map(r => r.v.sys))
  const last = xs[xs.length - 1]!
  return {
    session,
    perWeek: round1(sys.slope * 7),
    from: Math.round(sys.at(xs[0]!)),
    to: Math.round(sys.at(last)),
    next: Math.round(sys.at(last) + Math.max(-PROJECT_MAX, Math.min(PROJECT_MAX, sys.slope * PROJECT_DAYS))),
    points: own.length,
  }
}

// 하루 사이 얼마나 오르내리는지: 시간대마다 연이은 기록끼리의 차이 평균 (ARV)
function swingOf(readings: Entry[]): number | null {
  const diffs: number[] = []
  for (const session of ['morning', 'evening'] as const) {
    const own = readings.filter(r => r.session === session)
    for (let i = 1; i < own.length; i++) diffs.push(Math.abs(own[i]!.v.sys - own[i - 1]!.v.sys))
  }
  return diffs.length >= 3 ? mean(diffs) : null
}

function tagEffects(byDate: Map<string, SeriesPoint>, tagsByDate: Map<string, string[]>, from: string, to: string): ReportTag[] {
  // 기록한 날마다 다음 날 아침 수축기와 그날 단 태그
  const pairs = dateRange(from, to).flatMap((date) => {
    const next = byDate.get(addDays(date, 1))?.morning
    return next ? [{ tags: tagsByDate.get(date) ?? [], sys: next.sys }] : []
  })
  const all = new Set(pairs.flatMap(p => p.tags))
  const out: ReportTag[] = []
  for (const tag of all) {
    const withTag = pairs.filter(p => p.tags.includes(tag)).map(p => p.sys)
    const without = pairs.filter(p => !p.tags.includes(tag)).map(p => p.sys)
    if (withTag.length < TAG_MIN_DAYS || without.length < TAG_MIN_DAYS) continue
    out.push({ tag, diff: Math.round(mean(withTag) - mean(without)), days: withTag.length })
  }
  return out.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
}

const LABELS: [number, string, InsightTone][] = [
  [85, '아주 좋아요', 'good'],
  [72, '좋아요', 'steady'],
  [58, '보통이에요', 'caution'],
  [42, '관리가 필요해요', 'up'],
  [0, '주의가 필요해요', 'warn'],
]

// +3 / -3 / 0 (화면에서도 쓴다)
export const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`)
// 받침이 있으면 '을', 없으면 '를'
const objectJosa = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xAC00
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '을' : '를'
}

export function buildReport({ today, month, byDate, tagsByDate }: ReportInput): MonthReport {
  const from = `${month}-01`
  const end = monthEnd(month)
  const to = end < today ? end : today
  const readings = readingsIn(byDate, from, to)
  const days = dateRange(from, to).length
  const tagFrom = `${addMonths(month, -1)}-01`

  const grades = Object.fromEntries(GRADES.map(g => [g, 0])) as Record<Grade, number>
  for (const r of readings) grades[gradeOf(r.v.sys, r.v.dia)]++

  const base: MonthReport = {
    month,
    readings: readings.length,
    need: REPORT_MIN,
    enough: readings.length >= REPORT_MIN,
    score: 0,
    label: '',
    tone: 'empty',
    factors: [],
    trends: [],
    grades,
    inTarget: 0,
    variability: null,
    average: null,
    prev: null,
    pulse: null,
    gap: null,
    weekdays: WEEKDAYS.map((_, dow) => ({ dow, sys: null })),
    tags: tagEffects(byDate, tagsByDate, tagFrom, to),
    tagFrom,
    findings: [],
  }
  if (!base.enough) return base

  const sysAll = readings.map(r => r.v.sys)
  const average = { sys: Math.round(mean(sysAll)), dia: Math.round(mean(readings.map(r => r.v.dia))) }
  const targetPct = Math.round(readings.filter(r => inTarget(r.v.sys, r.v.dia)).length / readings.length * 100)

  const trends = (['morning', 'evening'] as const).map(s => trendOf(readings, s, from)).filter((t): t is SessionTrend => !!t)
  const slope = trends.length ? trends.reduce((s, t) => s + t.perWeek * t.points, 0) / trends.reduce((s, t) => s + t.points, 0) : null

  // 아침·저녁은 원래 높이가 달라 시간대마다 따로 흩어짐을 재고 기록 수로 가중 평균한다
  const spread = (['morning', 'evening'] as const)
    .map(s => readings.filter(r => r.session === s).map(r => r.v.sys))
    .filter(xs => xs.length >= 3)
  const sdAll = spread.length ? spread.reduce((s, xs) => s + sd(xs) * xs.length, 0) / spread.reduce((s, xs) => s + xs.length, 0) : null
  const swing = swingOf(readings)
  const variability = sdAll == null
    ? null
    : { sd: round1(sdAll), swing: Math.round(swing ?? 0), label: sdAll <= 7 ? '안정적' : sdAll <= 11 ? '보통' : '들쭉날쭉' }

  const pulses = readings.flatMap(r => (r.v.pulse ? [r.v.pulse] : []))
  const pulse = { pressure: Math.round(mean(readings.map(r => r.v.sys - r.v.dia))), rate: pulses.length ? Math.round(mean(pulses)) : null }

  const bothDays = dateRange(from, to).flatMap((d) => {
    const p = byDate.get(d)
    return p?.morning && p.evening ? [p.morning.sys - p.evening.sys] : []
  })
  const gap = bothDays.length >= 3 ? Math.round(mean(bothDays)) : null

  const weekdays = WEEKDAYS.map((_, dow) => {
    const xs = readings.filter(r => weekday(r.date) === dow).map(r => r.v.sys)
    return { dow, sys: xs.length >= DOW_MIN ? Math.round(mean(xs)) : null }
  })

  const prevMonth = addMonths(month, -1)
  const prevReadings = readingsIn(byDate, `${prevMonth}-01`, monthEnd(prevMonth))
  const prev = prevReadings.length >= REPORT_MIN
    ? { month: prevMonth, sys: Math.round(mean(prevReadings.map(r => r.v.sys))), dia: Math.round(mean(prevReadings.map(r => r.v.dia))) }
    : null

  // 점수: 혈압 수준 50 · 추세 20 · 안정성 10 · 꾸준함 20 (추세를 못 보면 나머지로 나눈다)
  const level = Math.min(
    scale(average.sys, [[110, 100], [120, 92], [130, 72], [140, 48], [160, 15], [180, 0]]),
    scale(average.dia, [[70, 100], [80, 74], [90, 48], [100, 15], [110, 0]]),
  )
  const factors: ReportFactor[] = [{
    key: 'level',
    label: '혈압 수준',
    score: Math.round(level),
    value: `${average.sys}/${average.dia}`,
    note: `한 달 평균 · ${GRADE_LABEL[gradeOf(average.sys, average.dia)]}`,
  }]
  if (slope != null) {
    let s = scale(slope, [[-4, 100], [-1.5, 90], [0, 72], [1.5, 52], [3, 32], [5, 10]])
    // 이미 정상인데 그대로 유지하는 건 좋은 것
    if (level >= 85 && Math.abs(slope) < 1.5) s = Math.max(s, 88)
    factors.push({ key: 'trend', label: '추세', score: Math.round(s), value: `주당 ${signed(round1(slope))}`, note: slope <= -1 ? '내려가는 중' : slope >= 1 ? '올라가는 중' : '거의 그대로' })
  }
  if (variability) {
    factors.push({ key: 'stability', label: '안정성', score: Math.round(scale(variability.sd, [[5, 100], [8, 85], [11, 65], [15, 40], [20, 15]])), value: `±${variability.sd}`, note: `${variability.label} · 하루 사이 ${variability.swing}씩` })
  }
  const recorded = readings.length
  factors.push({ key: 'habit', label: '꾸준함', score: Math.round(Math.min(100, recorded / (days * 2) * 100)), value: `${recorded}/${days * 2}회`, note: '아침·저녁 하루 두 번 기준' })

  const weightSum = factors.reduce((s, f) => s + WEIGHT[f.key], 0)
  const score = Math.round(Math.min(level + LEVEL_LEAD, factors.reduce((s, f) => s + f.score * WEIGHT[f.key], 0) / weightSum))
  const [, label, tone] = LABELS.find(([min]) => score >= min)!

  const report: MonthReport = { ...base, score, label, tone, factors, trends, inTarget: targetPct, variability, average, prev, pulse, gap, weekdays }
  report.findings = findingsOf(report, readings, tagsByDate)
  return report
}

// 숫자를 근거로 한 분석 문장. 중요한 것부터
function findingsOf(r: MonthReport, readings: Entry[], tagsByDate: Map<string, string[]>): Insight[] {
  const out: (Insight & { rank: number })[] = []
  const add = (rank: number, tone: InsightTone, title: string, body: string) => out.push({ rank, tone, title, body })

  // 추세: 아침·저녁이 같은 방향이면 한 문장으로
  const line = (t: SessionTrend) => `${SESSION_LABEL[t.session]} ${t.from} → ${t.to} (주당 ${signed(t.perWeek)})`
  const soon = (t: SessionTrend) => `${SESSION_LABEL[t.session]} ${t.next}`
  for (const [dir, list] of [['down', r.trends.filter(t => t.perWeek <= -1)], ['up', r.trends.filter(t => t.perWeek >= 1)]] as const) {
    if (!list.length) continue
    const who = list.length === 2 ? '아침·저녁 모두' : `${SESSION_LABEL[list[0]!.session]} 수축기가`
    const speed = list.length === 2 ? '' : ` 주당 ${Math.abs(list[0]!.perWeek)}씩`
    const body = `추세선(기록 ${list.reduce((n, t) => n + t.points, 0)}번): ${list.map(line).join(', ')}. 이대로 2주 가면 ${list.map(soon).join(', ')} 근처예요.`
    if (dir === 'down') add(2, 'good', `${who}${speed} 내려가는 추세예요`, body)
    else add(1, 'up', `${who}${speed} 올라가는 추세예요`, `${body} 짠 음식·운동량·잠을 점검해 보세요.`)
  }

  const high = r.grades.stage1 + r.grades.stage2
  if (r.inTarget >= 80) add(5, 'good', `기록의 ${r.inTarget}%가 목표 범위 안이에요`, `목표(130/80 미만)를 잘 지키고 있어요.`)
  else if (high / r.readings >= 0.3) add(1, 'warn', `기록의 ${Math.round(high / r.readings * 100)}%가 140/90 이상이에요`, `${r.readings}번 중 ${high}번이 고혈압 범위였어요. 이런 날이 2주 넘게 이어지면 진료를 받아보세요.`)
  else add(4, 'caution', `목표 범위(130/80 미만)는 ${r.inTarget}%예요`, `${r.readings}번 중 ${Math.round(r.inTarget * r.readings / 100)}번이 목표 안이었어요. 절반을 넘기는 것부터 해 보세요.`)

  if (r.prev && r.average) {
    const d = r.average.sys - r.prev.sys
    const [, pm] = r.prev.month.split('-').map(Number)
    const [, m] = r.month.split('-').map(Number)
    const change = `${pm}월 ${r.prev.sys}/${r.prev.dia} → ${m}월 ${r.average.sys}/${r.average.dia}`
    if (d <= -3) add(3, 'good', `${pm}월보다 수축기 평균이 ${-d} 낮아요`, `${change}. 한 달 사이 잘 내려왔어요.`)
    else if (d >= 3) add(2, 'up', `${pm}월보다 수축기 평균이 ${d} 높아요`, `${change}. 그사이 생활에 달라진 게 있었는지 떠올려 보세요.`)
    else add(7, 'steady', `${pm}월과 비슷한 수준이에요`, `${change} (수축기 ${signed(d)})`)
  }

  if (r.variability) {
    if (r.variability.sd >= 12) add(3, 'caution', `날마다 차이가 커요 (±${r.variability.sd})`, `같은 시간대끼리 하루 사이 평균 ${r.variability.swing}씩 오르내렸어요. 재는 시각·자세·쉬는 시간을 매번 같게 해 보세요.`)
    else if (r.variability.sd <= 7) add(6, 'good', `혈압이 고르게 유지돼요 (±${r.variability.sd})`, `하루 사이 평균 ${r.variability.swing}씩만 달라졌어요.`)
  }

  if (r.gap != null && r.gap >= 10) add(3, 'caution', `아침이 저녁보다 평균 ${r.gap} 높아요`, '아침 혈압이 특히 높은 패턴이에요. 진료 때 아침 기록을 함께 보여 주세요.')
  else if (r.gap != null && r.gap <= -10) add(4, 'info', `저녁이 아침보다 평균 ${-r.gap} 높아요`, '저녁 식사·음주·스트레스가 영향을 주는지 메모로 함께 남겨 보세요.')

  const dows = r.weekdays.filter(w => w.sys != null)
  if (dows.length >= 4) {
    const hi = dows.reduce((a, b) => (b.sys! > a.sys! ? b : a))
    const lo = dows.reduce((a, b) => (b.sys! < a.sys! ? b : a))
    if (hi.sys! - lo.sys! >= 6) add(5, 'info', `${WEEKDAYS[hi.dow]}요일이 가장 높아요 (평균 ${hi.sys})`, `가장 낮은 ${WEEKDAYS[lo.dow]}요일(${lo.sys})보다 ${hi.sys! - lo.sys!} 높아요. 그날 생활에 공통점이 있는지 살펴보세요.`)
  }

  if (r.pulse && r.pulse.pressure >= 60) add(4, 'caution', `맥압이 평균 ${r.pulse.pressure}로 넓은 편이에요`, '수축기와 이완기 차이(맥압)가 60을 넘으면 혈관이 뻣뻣해졌다는 신호일 수 있어요. 진료 때 이야기해 보세요.')
  if (r.pulse?.rate != null && r.pulse.rate >= 90) add(5, 'info', `맥박이 평균 ${r.pulse.rate}회로 빠른 편이에요`, '쉬는 동안 분당 90회를 넘으면 빠른 편이에요. 재기 전 5분 쉬었는지도 확인해 보세요.')

  const tag = r.tags[0]
  if (tag && Math.abs(tag.diff) >= 3) {
    const good = tag.diff < 0
    add(good ? 4 : 2, good ? 'good' : 'caution', `'${tag.tag}' 다음 날 아침이 ${Math.abs(tag.diff)} ${good ? '낮았어요' : '높았어요'}`, `메모에 '${tag.tag}'${objectJosa(tag.tag)} 단 ${tag.days}일과 안 단 날의 다음 날 아침을 비교했어요.`)
  }

  // 가장 높았던 날과 그 전날 메모
  const top = readings.reduce((a, b) => (b.v.sys > a.v.sys ? b : a))
  const cause = [...(tagsByDate.get(addDays(top.date, -1)) ?? []), ...(top.session === 'evening' ? tagsByDate.get(top.date) ?? [] : [])]
  if (gradeOf(top.v.sys, top.v.dia) !== 'normal') {
    add(6, 'info', `가장 높았던 날은 ${formatShort(top.date)} ${SESSION_LABEL[top.session]} ${top.v.sys}/${top.v.dia}`, cause.length ? `그 전 메모: ${[...new Set(cause)].join(' · ')}` : '그 전날 메모는 없었어요. 높았던 날은 메모를 남겨 두면 원인을 찾기 쉬워요.')
  }

  return out.sort((a, b) => a.rank - b.rank).slice(0, 6).map(({ rank: _, ...i }) => i)
}
