// 앱·서버 공용 타입

export type Session = 'morning' | 'evening'

export type Grade = 'normal' | 'elevated' | 'prehigh' | 'stage1' | 'stage2'

export interface Reading {
  sys: number
  dia: number
  pulse: number | null
}

export interface Average {
  sys: number
  dia: number
  pulse: number | null
}

export interface RecordDto {
  date: string
  session: Session
  readings: Reading[]
  avg: Average
  measuredAt: string
}

export interface NoteDto {
  date: string
  tags: string[]
  memo: string
}

export interface MonthResponse {
  month: string
  records: RecordDto[]
  notes: NoteDto[]
}

export interface DayResponse {
  date: string
  morning: RecordDto | null
  evening: RecordDto | null
  note: NoteDto | null
}

export interface MeUser {
  email: string
  nickname: string
  createdAt: string
}

export interface MeResponse {
  user: MeUser | null
}

export type InsightTone = 'good' | 'steady' | 'caution' | 'up' | 'warn' | 'info' | 'empty'

export interface Insight {
  tone: InsightTone
  title: string
  body: string
}

export interface PeriodStat {
  sys: number
  dia: number
  count: number
}

export interface SeriesPoint {
  date: string
  morning: Average | null
  evening: Average | null
}

export interface SummaryResponse {
  days: number
  today: string
  headline: Insight
  insights: Insight[]
  week: { morning: PeriodStat | null, evening: PeriodStat | null }
  lastWeek: { morning: PeriodStat | null, evening: PeriodStat | null }
  series: SeriesPoint[]
  peak: { date: string, session: Session, sys: number, dia: number } | null
  recorded: number
  expected: number
}
