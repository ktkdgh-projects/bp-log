<script setup lang="ts">
import type { Average, Grade } from '#shared/types'

type Cell = (Average & { grade: Grade }) | null
// 최근 7일을 날짜 칸으로 나란히 (왼쪽이 오래된 날, 오른쪽 끝이 오늘). 칸마다 위 아침 · 아래 저녁, 색은 등급
defineProps<{ rows: { date: string, isToday: boolean, morning: Cell, evening: Cell }[] }>()
</script>

<template>
  <div class="week">
    <ol class="strip" aria-label="최근 7일 기록">
      <li v-for="r in rows" :key="r.date" class="day" :class="{ today: r.isToday }">
        <span class="wd" :class="{ sun: weekday(r.date) === 0, sat: weekday(r.date) === 6 }">{{ r.isToday ? '오늘' : WEEKDAYS[weekday(r.date)] }}</span>
        <span class="dt">{{ Number(r.date.slice(8, 10)) }}</span>
        <span
          v-for="(c, ci) in [r.morning, r.evening]"
          :key="ci"
          class="tile"
          :class="{ empty: !c }"
          :style="c ? { background: gradeVar(c.grade, 'bg'), color: gradeVar(c.grade, 'fg'), '--edge': gradeVar(c.grade) } : undefined"
          :aria-label="`${formatShort(r.date)} ${ci === 0 ? '아침' : '저녁'} ${c ? `${c.sys}/${c.dia} ${GRADE_LABEL[c.grade]}` : '기록 없음'}`"
        >
          <AppIcon :name="ci === 0 ? 'sun' : 'moon'" :size="10" :stroke="2.4" class="ti" />
          <template v-if="c">
            <b>{{ c.sys }}</b>
            <small>{{ c.dia }}</small>
          </template>
          <span v-else class="dash">–</span>
        </span>
      </li>
    </ol>
    <p class="hint">
      <span><AppIcon name="sun" :size="11" :stroke="2.4" /> 위 아침</span>
      <span><AppIcon name="moon" :size="11" :stroke="2.4" /> 아래 저녁</span>
      <span>큰 숫자 수축기 · 작은 숫자 이완기</span>
    </p>
  </div>
</template>

<style scoped>
.week { display: flex; flex-direction: column; gap: 8px; }
.strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; margin: 0; padding: 0; list-style: none; }
.day { display: flex; flex-direction: column; align-items: stretch; gap: 4px; padding: 6px 3px 5px; border-radius: 14px; text-align: center; }
.day.today { background: var(--accent-soft); box-shadow: inset 0 0 0 1.5px var(--accent); }
.wd { font-size: 11px; font-weight: 600; color: var(--sub); }
.wd.sun { color: #b4462a; }
.wd.sat { color: #3e6fa3; }
.today .wd { color: var(--accent); font-weight: 700; }
.dt { margin-top: -3px; font-size: 13px; font-weight: 700; color: var(--text-2); }
.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 46px;
  border-radius: 10px;
  box-shadow: inset 0 -3px 0 var(--edge, transparent);
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}
.tile b { font-size: 15px; letter-spacing: -0.03em; }
.tile small { font-size: 11px; font-weight: 600; opacity: 0.75; }
.tile .ti { position: absolute; top: 3px; left: 3px; opacity: 0.5; }
.tile.empty { border: 1.5px dashed var(--line-strong); background: transparent; color: var(--mute); }
.dash { font-size: 14px; }
.hint { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 10px; font-size: 11px; color: var(--mute); }
.hint span { display: inline-flex; align-items: center; gap: 3px; }

@media (max-width: 380px) {
  .tile b { font-size: 13px; }
  .tile .ti { display: none; }
}
</style>
