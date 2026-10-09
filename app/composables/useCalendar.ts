import type { NoteDto, RecordDto, Session } from '#shared/types'

export interface CalendarDay {
  blank: false
  key: string
  date: string
  day: number
  dow: number
  future: boolean
  isToday: boolean
  hasNote: boolean
  tags: string[]
  slots: { session: Session, label: string, rec: RecordDto | null }[]
  aria: string
}
export type CalendarCell = { blank: true, key: string } | CalendarDay

export function useCalendarCells(source: () => { month: string, records: RecordDto[], notes: NoteDto[], today: string }) {
  return computed<CalendarCell[]>(() => {
    const { month, records, notes, today } = source()
    const byKey = new Map(records.map(r => [`${r.date}:${r.session}`, r]))
    const noteByDate = new Map(notes.filter(n => n.tags.length || n.memo).map(n => [n.date, n]))
    const blanks = weekday(`${month}-01`)
    const total = daysInMonth(month)

    const out: CalendarCell[] = []
    for (let i = 0; i < blanks; i++) out.push({ blank: true, key: `b${i}` })
    for (let day = 1; day <= total; day++) {
      const date = `${month}-${String(day).padStart(2, '0')}`
      const slots = (['morning', 'evening'] as const).map(session => ({
        session,
        label: SESSION_LABEL[session],
        rec: byKey.get(`${date}:${session}`) ?? null,
      }))
      const desc = slots.map(s => `${s.label} ${s.rec ? `${s.rec.avg.sys}/${s.rec.avg.dia} ${GRADE_LABEL[gradeOf(s.rec.avg.sys, s.rec.avg.dia)]}` : '기록 없음'}`).join(', ')
      const note = noteByDate.get(date)
      out.push({
        blank: false,
        key: date,
        date,
        day,
        dow: weekday(date),
        future: date > today,
        isToday: date === today,
        hasNote: !!note,
        tags: note?.tags ?? [],
        slots,
        aria: `${formatDate(date)}. ${desc}`,
      })
    }
    return out
  })
}

export function gradeStyle(rec: RecordDto | null) {
  return rec ? { background: gradeVar(gradeOf(rec.avg.sys, rec.avg.dia)) } : undefined
}
