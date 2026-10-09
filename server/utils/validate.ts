import type { NoteDto, Reading, RecordDto, Session } from '#shared/types'
import type { NoteDoc, RecordDoc } from './mongo'

const USERNAME_PATTERN = /^[a-z0-9_]{4,20}$/
const OLDEST_DAYS = 366 * 3

function bad(message: string): never {
  throw createError({ statusCode: 400, message })
}

export function readUsername(value: unknown): string {
  const username = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!USERNAME_PATTERN.test(username)) bad('아이디는 영문 소문자·숫자·밑줄(_)로 4–20자예요.')
  return username
}

export function readPassword(value: unknown): string {
  const password = typeof value === 'string' ? value : ''
  if (password.length < 8) bad('비밀번호는 8자 이상이어야 해요.')
  if (password.length > 128) bad('비밀번호가 너무 길어요.')
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) bad('비밀번호에 영문과 숫자를 함께 넣어 주세요.')
  return password
}

export function readNickname(value: unknown): string {
  const nickname = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (!nickname) bad('닉네임을 입력해 주세요.')
  if ([...nickname].length > 12) bad('닉네임은 12자까지예요.')
  return nickname
}

export function readSession(value: unknown): Session {
  if (value !== 'morning' && value !== 'evening') bad('아침 또는 저녁을 골라 주세요.')
  return value
}

export function readDate(value: unknown): string {
  if (!isDate(value)) bad('날짜 형식을 확인해 주세요.')
  const today = kstToday()
  if (value > today) bad('미래 날짜에는 기록할 수 없어요.')
  if (value < addDays(today, -OLDEST_DAYS)) bad('너무 오래된 날짜예요.')
  return value
}

// 혈압 기록 쓰기(저장·삭제)는 최근 3일만
export function assertRecordEditable(date: string) {
  if (!canEditRecord(date, kstToday())) {
    throw createError({ statusCode: 403, message: `혈압 기록은 ${EDIT_DAYS}일 안에만 넣고 고칠 수 있어요.` })
  }
}

function readNumber(value: unknown, name: string, min: number, max: number): number {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n)) bad(`${name} 값을 확인해 주세요.`)
  if (n < min || n > max) bad(`${name}은(는) ${min}–${max} 사이여야 해요.`)
  return n
}

export function readReadings(value: unknown): Reading[] {
  if (!Array.isArray(value) || value.length < MIN_READINGS || value.length > MAX_READINGS) {
    bad(`측정값은 ${MIN_READINGS}–${MAX_READINGS}회까지 넣을 수 있어요.`)
  }
  return value.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>
    const label = `${i + 1}회차`
    const sys = readNumber(r.sys, `${label} 수축기`, LIMITS.sys.min, LIMITS.sys.max)
    const dia = readNumber(r.dia, `${label} 이완기`, LIMITS.dia.min, LIMITS.dia.max)
    if (dia >= sys) bad(`${label} 이완기가 수축기보다 높아요. 순서를 확인해 주세요.`)
    const pulse = r.pulse == null || r.pulse === '' ? null : readNumber(r.pulse, `${label} 맥박`, LIMITS.pulse.min, LIMITS.pulse.max)
    return { sys, dia, pulse }
  })
}

export function readTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set<string>(TAGS)
  return [...new Set(value.filter((t): t is string => typeof t === 'string' && allowed.has(t)))]
}

export function readMemo(value: unknown): string {
  const memo = typeof value === 'string' ? value.trim() : ''
  if ([...memo].length > 200) bad('메모는 200자까지예요.')
  return memo
}

export function toRecordDto(doc: RecordDoc): RecordDto {
  return { date: doc.date, session: doc.session, readings: doc.readings, avg: doc.avg, measuredAt: doc.measuredAt.toISOString() }
}

export function toNoteDto(doc: NoteDoc): NoteDto {
  return { date: doc.date, tags: doc.tags, memo: doc.memo }
}
