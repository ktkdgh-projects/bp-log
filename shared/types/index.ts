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
  username: string
  nickname: string
  createdAt: string
  isAdmin?: boolean
}

// 운영 페이지: 개인 기록 없이 합계만
export interface AdminStatsResponse {
  generatedAt: string
  days: number
  totals: {
    users: number
    newToday: number
    new7: number
    new30: number
    active1: number
    active7: number
    active30: number
    records: number
    recordersToday: number
  }
  // 날마다: 그날 가입 수, 그날까지 누적 가입자, 그날 기록한 사람 수, 그날 기록 수
  series: { date: string, signups: number, total: number, recorders: number, records: number }[]
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

export interface StatPoint {
  date: string
  sys: number
  dia: number
}

// 기간 평균 + 그 기간의 최저·최고(수축기 기준)
export interface PeriodStat {
  sys: number
  dia: number
  count: number
  min: StatPoint
  max: StatPoint
}

export interface SessionStats {
  morning: PeriodStat | null
  evening: PeriodStat | null
}

export interface SeriesPoint {
  date: string
  morning: Average | null
  evening: Average | null
}

export interface SummaryResponse {
  today: string
  // 최근 동향: 고른 달과 상관없이 오늘 기준
  headline: Insight
  insights: Insight[]
  week: SessionStats
  lastWeek: SessionStats
  recent: SeriesPoint[]
  // 고른 달
  month: string
  series: SeriesPoint[]
  monthStats: SessionStats & { recorded: number, expected: number }
}
