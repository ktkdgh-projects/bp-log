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
          :aria-pressed="selected === c.date"
          @click="emit('select', c.date)"
        >
          <span class="top">
            <span class="num">{{ c.day }}</span>
            <span v-if="c.isToday" class="today-tag">오늘</span>
            <span v-if="c.hasNote" class="note" :title="c.tags.join(' · ') || '메모'"><AppIcon name="edit" :size="12" :stroke="2.4" /></span>
          </span>
          <template v-if="!c.future">
            <span v-for="s in c.slots" :key="s.session" class="slot" :class="{ empty: !s.rec }">
              <template v-if="s.rec">
                <span class="dot" :style="gradeStyle(s.rec)" />
                {{ s.rec.avg.sys }}/{{ s.rec.avg.dia }}
              </template>
              <template v-else>–</template>
            </span>
          </template>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* 남는 높이를 주 수만큼 나눠 칸이 화면을 꽉 채운다 */
.cal { display: flex; flex-direction: column; gap: 8px; }
.week, .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.week { font-size: 13px; font-weight: 600; color: var(--sub); }
.week span { padding-left: 12px; }
.sun { color: #b4462a; }
.sat { color: #3e6fa3; }
.grid { flex: 1; min-height: 0; grid-auto-rows: minmax(0, 1fr); gap: 6px; }
.cell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  min-height: 0;
  overflow: hidden;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: #f7f8f6;
  color: var(--text);
  text-align: left;
  transition: background var(--fast) ease, border-color var(--fast) ease;
}
.cell:hover:not(:disabled) { background: var(--soft-2); }
.cell.selected { border-color: var(--accent); background: var(--accent-soft); }
.cell.today:not(.selected) { border-color: var(--line-strong); background: var(--card); }
.cell.future { background: transparent; color: #a3aba7; }
.top { display: flex; align-items: center; gap: 6px; min-height: 22px; margin-bottom: auto; }
.num { font-size: 16px; font-weight: 600; }
.cell.sun .num { color: #b4462a; }
.cell.sat .num { color: #3e6fa3; }
.cell.future .num { color: #a3aba7; }
.today-tag { padding: 1px 7px; border-radius: 999px; background: var(--accent); color: #fff; font-size: 11px; font-weight: 700; }
.note { margin-left: auto; display: inline-flex; color: var(--accent); }
.slot { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; white-space: nowrap; }
.slot.empty { color: var(--mute); font-weight: 500; }
.dot { flex-shrink: 0; width: 9px; height: 9px; border-radius: 50%; }

@media (max-width: 1280px) {
  .cell { padding: 8px 10px; }
  .slot { font-size: 14px; }
}
</style>
