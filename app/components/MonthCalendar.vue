<script setup lang="ts">
import type { NoteDto, RecordDto, Session } from '#shared/types'

const props = defineProps<{
  month: string
  records: RecordDto[]
  notes: NoteDto[]
  today: string
  selected?: string | null
}>()
const emit = defineEmits<{ select: [date: string] }>()

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

const cells = computed(() => {
  const byKey = new Map(props.records.map(r => [`${r.date}:${r.session}`, r]))
  const noteDates = new Set(props.notes.filter(n => n.tags.length || n.memo).map(n => n.date))
  const first = `${props.month}-01`
  const blanks = weekday(first)
  const total = daysInMonth(props.month)

  const out: ({ blank: true, key: string } | {
    blank: false
    key: string
    date: string
    day: number
    dow: number
    future: boolean
    isToday: boolean
    hasNote: boolean
    slots: { session: Session, label: string, rec: RecordDto | null }[]
    aria: string
  })[] = []

  for (let i = 0; i < blanks; i++) out.push({ blank: true, key: `b${i}` })
  for (let day = 1; day <= total; day++) {
    const date = `${props.month}-${String(day).padStart(2, '0')}`
    const slots = (['morning', 'evening'] as const).map(session => ({
      session,
      label: SESSION_LABEL[session],
      rec: byKey.get(`${date}:${session}`) ?? null,
    }))
    const desc = slots.map(s => `${s.label} ${s.rec ? `${s.rec.avg.sys}/${s.rec.avg.dia} ${GRADE_LABEL[gradeOf(s.rec.avg.sys, s.rec.avg.dia)]}` : '기록 없음'}`).join(', ')
    out.push({
      blank: false,
      key: date,
      date,
      day,
      dow: weekday(date),
      future: date > props.today,
      isToday: date === props.today,
      hasNote: noteDates.has(date),
      slots,
      aria: `${formatDate(date)}. ${desc}`,
    })
  }
  return out
})

function barStyle(rec: RecordDto | null) {
  return rec ? { background: gradeVar(gradeOf(rec.avg.sys, rec.avg.dia)) } : undefined
}
</script>

<template>
  <div class="cal">
    <div class="week" aria-hidden="true">
      <span v-for="(w, i) in WEEK" :key="w" :class="{ sun: i === 0, sat: i === 6 }">{{ w }}</span>
    </div>
    <div class="grid">
      <template v-for="c in cells" :key="c.key">
        <span v-if="c.blank" class="blank" />
        <button
          v-else
          type="button"
          class="cell"
          :class="{ today: c.isToday, future: c.future, selected: selected === c.date, sun: c.dow === 0, sat: c.dow === 6 }"
          :disabled="c.future"
          :aria-label="c.aria"
          :aria-current="c.isToday ? 'date' : undefined"
          @click="emit('select', c.date)"
        >
          <span class="num">{{ c.day }}<span v-if="c.hasNote" class="note-dot" /></span>
          <span v-for="s in c.slots" :key="s.session" class="slot" :class="{ empty: !s.rec }">
            <span class="bar" :style="barStyle(s.rec)" />
            <span class="val"><span class="dot" :style="barStyle(s.rec)" />{{ s.rec ? `${s.rec.avg.sys}/${s.rec.avg.dia}` : '–' }}</span>
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.cal {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.week, .grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.week {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--sub);
}
.sun { color: #b4462a; }
.sat { color: #3e6fa3; }
.grid { gap: 4px; }
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 52px;
  padding: 4px 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text);
  transition: background var(--fast) ease;
}
.cell:hover:not(:disabled) { background: var(--soft); }
.cell.selected { background: var(--soft-2); }
.cell.today { background: #eef5f3; box-shadow: inset 0 0 0 2px var(--accent); }
.cell.future { color: #a3aba7; }
.num {
  position: relative;
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
}
.cell.sun .num { color: #b4462a; }
.cell.sat .num { color: #3e6fa3; }
.cell.today .num { color: var(--accent); font-weight: 700; }
.cell.future .num { color: #a3aba7; }
.note-dot {
  position: absolute;
  top: 1px;
  right: -7px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
}
.slot { display: block; }
.bar {
  display: block;
  width: 26px;
  height: 5px;
  border-radius: 3px;
  background: var(--soft-2);
}
.cell.future .bar { background: transparent; }
.val { display: none; }

/* 넓은 달력은 막대 대신 숫자를 보여준다 */
@container (min-width: 620px) {
  .grid { gap: 6px; }
  .cell {
    align-items: stretch;
    justify-content: flex-start;
    gap: 4px;
    min-height: 92px;
    padding: 8px 10px;
    border-radius: 14px;
    background: #f7f8f6;
    text-align: left;
  }
  .cell.future { background: transparent; }
  .cell.future .slot { display: none; }
  .bar { display: none; }
  .val {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }
  .slot.empty .val { color: var(--mute); font-weight: 500; }
  .dot {
    flex-shrink: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--line-strong);
  }
}
</style>
