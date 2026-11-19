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

// 최근 7일 한눈에: 몇 번 쟀는지, 목표 범위 비율, 가장 높았던·낮았던 기록, 며칠째 이어서 쟀는지
export interface WeekStats {
  from: string
  to: string
  recorded: number
  expected: number
  // 목표(130/80 미만) 안에 든 기록 비율 %, 기록이 없으면 null
  inTarget: number | null
  high: (StatPoint & { session: Session }) | null
  low: (StatPoint & { session: Session }) | null
  // 어제부터 거꾸로 하루도 안 빠지고 기록한 날 수
  streak: number
}

export interface SummaryResponse {
  today: string
  // 최근 동향: 고른 달과 상관없이 어제까지 7일 (오늘은 아직 다 안 재서 뺀다)
  headline: Insight
  insights: Insight[]
  week: SessionStats
  lastWeek: SessionStats
  weekStats: WeekStats
  recent: SeriesPoint[]
  // 고른 달
  month: string
  series: SeriesPoint[]
  monthStats: SessionStats & { recorded: number, expected: number }
  report: MonthReport
}

// 월간 분석 리포트: 고른 달의 기록을 숫자로 풀어 본다 (통계로 본 경향이며 진단이 아니다)
export type ReportFactorKey = 'level' | 'trend' | 'stability' | 'habit'

export interface ReportFactor {
  key: ReportFactorKey
  label: string
  // 0~100
  score: number
  // 근거 숫자 (예: '132/83', '주당 -1.2')
  value: string
  note: string
}

// 회귀선으로 본 한 달 추세 (수축기, mmHg)
export interface SessionTrend {
  session: Session
  // 주당 변화량 (음수면 내려가는 중)
  perWeek: number
  // 회귀선의 첫날·마지막 날 값
  from: number
  to: number
  // 이대로 2주 가면 (변화 폭은 보수적으로 자른다)
  next: number
  points: number
}

export interface ReportTag {
  tag: string
  // 그 태그를 단 다음 날 아침 수축기 - 안 단 날 다음 날 아침 수축기
  diff: number
  days: number
}

export interface MonthReport {
  month: string
  readings: number
  // 리포트를 내려면 이만큼 기록이 필요하다
  need: number
  enough: boolean
  score: number
  label: string
  tone: InsightTone
  factors: ReportFactor[]
  trends: SessionTrend[]
  // 기록 횟수 (등급별)
  grades: Record<Grade, number>
  // 목표(130/80 미만) 안에 든 기록 비율 %
  inTarget: number
  variability: { sd: number, swing: number, label: string } | null
  average: { sys: number, dia: number } | null
  prev: { month: string, sys: number, dia: number } | null
  // 맥압(수축기-이완기) 평균, 맥박 평균
  pulse: { pressure: number, rate: number | null } | null
  // 같은 날 아침 - 저녁 수축기 평균
  gap: number | null
  // 0 = 일요일
  weekdays: { dow: number, sys: number | null }[]
  tags: ReportTag[]
  // 태그를 비교한 기간
  tagFrom: string
  findings: Insight[]
}
