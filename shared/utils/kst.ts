const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MONTH_PATTERN = /^\d{4}-\d{2}$/
export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// UTC로 도는 서버에서도 한국 날짜가 나오도록 오프셋을 더한 뒤 UTC 기준으로 자른다
export function toKstDate(at: Date = new Date()): string {
  return new Date(at.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
}

export function kstHour(at: Date = new Date()): number {
  return new Date(at.getTime() + KST_OFFSET_MS).getUTCHours()
}

export function kstToday(): string {
  return toKstDate()
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

export function isDate(value: unknown): value is string {
  return typeof value === 'string' && DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

export function isMonth(value: unknown): value is string {
  return typeof value === 'string' && MONTH_PATTERN.test(value)
}

export function addMonths(month: string, months: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const d = new Date(Date.UTC(y, m - 1 + months, 1))
  return d.toISOString().slice(0, 7)
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number) as [number, number]
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

// 0 = 일요일
export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

export function formatDate(date: string): string {
  const [, m, d] = date.split('-').map(Number)
  return `${m}월 ${d}일 ${WEEKDAYS[weekday(date)]}요일`
}

export function formatShort(date: string): string {
  const [, m, d] = date.split('-').map(Number)
  return `${m}/${d}`
}

export function dateRange(from: string, to: string): string[] {
  const out: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}
