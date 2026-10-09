<script setup lang="ts">
import type { NoteDto, RecordDto } from '#shared/types'

const props = defineProps<{
  month: string
  records: RecordDto[]
  notes: NoteDto[]
  today: string
  selected?: string | null
}>()
const emit = defineEmits<{ select: [date: string] }>()

const cells = useCalendarCells(() => props)
</script>

<template>
  <div class="cal">
    <div class="week" aria-hidden="true">
      <span v-for="(w, i) in WEEKDAYS" :key="w" :class="{ sun: i === 0, sat: i === 6 }">{{ w }}</span>
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
          <span v-for="s in c.slots" :key="s.session" class="bar" :style="gradeStyle(s.rec)" />
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* 남는 높이를 주 수만큼 나눈다 */
.cal { display: flex; flex-direction: column; gap: 6px; }
.week, .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.week { text-align: center; font-size: 12px; font-weight: 600; color: var(--sub); }
.sun { color: #b4462a; }
.sat { color: #3e6fa3; }
.grid { flex: 1; min-height: 0; grid-auto-rows: minmax(0, 1fr); gap: 4px; }
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 0;
  padding: 2px 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text);
  touch-action: manipulation;
}
.cell:active:not(:disabled) { background: var(--soft); }
.cell.selected { background: var(--soft-2); }
.cell.today { background: #eef5f3; box-shadow: inset 0 0 0 2px var(--accent); }
.num { position: relative; font-size: 13px; line-height: 18px; font-weight: 500; }
.cell.sun .num { color: #b4462a; }
.cell.sat .num { color: #3e6fa3; }
.cell.today .num { color: var(--accent); font-weight: 700; }
.cell.future .num { color: #a3aba7; }
.note-dot { position: absolute; top: 1px; right: -7px; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }
.bar { display: block; width: 26px; height: 5px; border-radius: 3px; background: var(--soft-2); }
.cell.future .bar { background: transparent; }
</style>
