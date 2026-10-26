import type { Average, Grade, Reading, Session } from '../types'
import { addDays, kstHour, toKstDate } from './kst'

// 대한고혈압학회 혈압 분류. 수축기·이완기 중 높은 쪽 등급을 따른다. 화면 표시용이며 진단이 아니다
export function gradeOf(sys: number, dia: number): Grade {
  if (sys >= 160 || dia >= 100) return 'stage2'
  if (sys >= 140 || dia >= 90) return 'stage1'
  if (sys >= 130 || dia >= 80) return 'prehigh'
  if (sys >= 120) return 'elevated'
  return 'normal'
}

export const GRADES: Grade[] = ['normal', 'elevated', 'prehigh', 'stage1', 'stage2']

export const GRADE_LABEL: Record<Grade, string> = {
  normal: '정상',
  elevated: '주의',
  prehigh: '고혈압 전단계',
  stage1: '고혈압 1기',
  stage2: '고혈압 2기',
}

export const GRADE_RANGE: Record<Grade, string> = {
  normal: '120/80 미만',
  elevated: '120–129 / 80 미만',
  prehigh: '130–139 또는 80–89',
  stage1: '140–159 또는 90–99',
  stage2: '160 또는 100 이상',
}

export const SESSION_LABEL: Record<Session, string> = {
  morning: '아침',
  evening: '저녁',
}

export const LIMITS = {
  sys: { min: 60, max: 260 },
  dia: { min: 30, max: 160 },
  pulse: { min: 30, max: 220 },
} as const

export const MAX_READINGS = 3
export const MIN_READINGS = 1
// 두 번 잰 수축기 차이가 이만큼 나면 한 번 더 재기를 권한다
export const RETAKE_GAP = 10

// 혈압 기록과 메모·태그는 오늘 포함 3일(오늘·어제·그제) 안에만 넣고 고치고 지울 수 있다
export const EDIT_DAYS = 3

export function editableFrom(today: string): string {
  return addDays(today, -(EDIT_DAYS - 1))
}

export function canEditRecord(date: string, today: string): boolean {
  return date <= today && date >= editableFrom(today)
}

export const TAGS = ['운동함', '커피', '음주', '짜게 먹음', '잠 부족', '스트레스'] as const

export function averageOf(readings: Reading[]): Average {
  const n = readings.length
  const pulses = readings.map(r => r.pulse).filter((p): p is number => p != null)
  return {
    sys: Math.round(readings.reduce((s, r) => s + r.sys, 0) / n),
    dia: Math.round(readings.reduce((s, r) => s + r.dia, 0) / n),
    pulse: pulses.length ? Math.round(pulses.reduce((s, p) => s + p, 0) / pulses.length) : null,
  }
}

// 새벽(4시 전)에 재면 전날 자기 전 기록으로 본다
export function defaultSlot(at: Date = new Date()): { date: string, session: Session } {
  const hour = kstHour(at)
  const today = toKstDate(at)
  if (hour < 4) return { date: addDays(today, -1), session: 'evening' }
  return { date: today, session: hour < 15 ? 'morning' : 'evening' }
}
