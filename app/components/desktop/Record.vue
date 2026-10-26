<script setup lang="ts">
import type { Session } from '#shared/types'
import type { Cursor, Field } from '~/composables/useRecordForm'

// PC: 실제 입력칸에 키보드로 친다. 자릿수가 차면 다음 칸, Enter로 저장
// modal이면 페이지를 옮기지 않고 저장 뒤 saved를 알린다 (DesktopRecordModal)
const props = defineProps<{ modal?: boolean, date?: string, session?: Session }>()
const emit = defineEmits<{ close: [], saved: [date: string] }>()

const typing = ref<Cursor | null>(null)
const f = useRecordForm(typing, props.modal ? { date: props.date, session: props.session, onSaved: d => emit('saved', d) } : {})
defineExpose({ dirty: f.dirty })
const { today, minDate, date, session, rows, existing, failure, restKind, restTotal, rest, stopRest, parsed, done, avg, grade, problem, gap, suggestThird, retakePair, retakeDeclined, canSave, saveLabel } = f

const inputs = new Map<string, HTMLInputElement>()
function bind(row: number, field: Field) {
  return (el: unknown) => {
    if (el instanceof HTMLInputElement) inputs.set(`${row}:${field}`, el)
    else inputs.delete(`${row}:${field}`)
  }
}
// 쉬는 시간 모달이 떠 있는 동안은 입력칸으로 옮기지 않고, 닫히면 여기로 돌아온다
const resume = ref<Cursor | null>(null)
const restRow = computed(() => (resume.value ?? f.firstEmpty.value).row + 1)
watch(restKind, (k) => {
  if (!k) focus(resume.value ?? f.firstEmpty.value)
})

function focus(c: Cursor) {
  resume.value = c
  nextTick(() => {
    if (restKind.value) return
    const el = inputs.get(`${c.row}:${c.field}`)
    el?.focus()
    el?.select()
  })
}

watch(f.loaded, (v) => {
  if (v) focus(f.firstEmpty.value)
})

function nextOf(c: Cursor): Cursor | null {
  const i = FIELDS.indexOf(c.field)
  if (i < FIELDS.length - 1) return { row: c.row, field: FIELDS[i + 1]! }
  if (c.row < rows.value.length - 1) return { row: c.row + 1, field: 'sys' }
  return null
}

function onInput(row: number, field: Field, e: Event) {
  const el = e.target as HTMLInputElement
  const value = el.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 3)
  el.value = value
  rows.value[row]![field] = value
  if (value.length >= digitsFor(field, value)) {
    const n = nextOf({ row, field })
    if (!n) return
    if (n.row !== row && !rows.value[n.row]!.sys) f.startRest()
    focus(n)
  }
}

function onKeydown(row: number, field: Field, e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    f.save(true)
  }
  else if (e.key === 'Backspace' && !rows.value[row]![field]) {
    const i = FIELDS.indexOf(field)
    const prev: Cursor | null = i > 0 ? { row, field: FIELDS[i - 1]! } : row > 0 ? { row: row - 1, field: 'pulse' } : null
    if (prev) {
      e.preventDefault()
      focus(prev)
    }
  }
}

function addThird() {
  f.addThird()
}
// 3회차가 생기면(직접 추가했든 차이가 커서 자동이든) 그 칸으로 간다
// 3회차를 안 재기로 해서 칸이 사라지면 2회차 맥박으로 돌아온다
watch(() => rows.value.length, (n, old) => {
  if (n > old) focus({ row: n - 1, field: 'sys' })
  else if ((resume.value?.row ?? 0) >= n) focus({ row: n - 1, field: 'pulse' })
})
</script>

<template>
  <div class="record" :class="{ modal }">
    <header class="page-head">
      <div>
        <h1 :id="modal ? 'record-title' : undefined" class="title">{{ SESSION_LABEL[session] }} {{ existing ? '기록 고치기' : '기록하기' }}</h1>
        <p class="sub">{{ formatDate(date) }}{{ date === today ? ' · 오늘' : '' }}</p>
      </div>
      <button v-if="modal" type="button" class="icon-btn close" aria-label="닫기 (Esc)" title="닫기 (Esc)" @click="emit('close')"><AppIcon name="close" /></button>
      <NuxtLink v-else to="/" class="btn btn-soft cancel">취소</NuxtLink>
    </header>

    <div class="layout">
      <section class="card form">
        <div class="controls">
          <div class="seg" role="radiogroup" aria-label="측정 시간대">
            <button v-for="s in (['morning', 'evening'] as const)" :key="s" type="button" role="radio" :aria-checked="session === s" :class="{ on: session === s }" @click="session = s">
              <AppIcon :name="s === 'morning' ? 'sun' : 'moon'" :size="16" />
              {{ SESSION_LABEL[s] }}
            </button>
          </div>
          <label class="date">
            <span class="sr-only">날짜</span>
            <input v-model="date" type="date" class="input" :min="minDate" :max="today" required>
          </label>
        </div>

        <div class="table" role="group" aria-label="측정값">
          <div class="thead" aria-hidden="true">
            <span />
            <span v-for="fd in FIELDS" :key="fd">{{ FIELD_LABEL[fd] }}<small v-if="fd === 'pulse'"> (선택)</small></span>
            <span />
          </div>
          <div v-for="(r, ri) in rows" :key="ri" class="tr" :class="{ bad: parsed[ri]?.problem }">
            <span class="row-label">{{ ri + 1 }}회차</span>
            <input
              v-for="fd in FIELDS"
              :key="fd"
              :ref="bind(ri, fd)"
              class="num"
              :class="{ filled: !!r[fd] }"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              maxlength="3"
              :value="r[fd]"
              :placeholder="fd === 'sys' ? '120' : fd === 'dia' ? '80' : '70'"
              :aria-label="`${ri + 1}회차 ${FIELD_LABEL[fd]}`"
              :aria-invalid="!!parsed[ri]?.problem"
              @input="onInput(ri, fd, $event)"
              @keydown="onKeydown(ri, fd, $event)"
              @focus="typing = resume = { row: ri, field: fd }"
              @blur="typing = null"
            >
            <button v-if="ri === 2" type="button" class="icon-btn row-x" aria-label="3회차 지우기" @click="f.removeRow(ri)"><AppIcon name="close" :size="16" /></button>
            <span v-else />
          </div>
        </div>

        <Transition name="fade" mode="out-in">
          <div v-if="problem" class="banner bad" role="alert">
            <AppIcon name="alert" :size="18" />
            <span class="grow">{{ problem }}</span>
          </div>
          <div v-else-if="suggestThird" class="banner third" role="status">
            <span class="grow">두 값 차이가 {{ gap }}이에요. 한 번 더 재면 정확해요</span>
            <button type="button" class="third-btn" @click="addThird">3회차 추가</button>
          </div>
        </Transition>

        <p v-if="failure" class="error" role="alert">{{ failure }}</p>

        <div class="actions">
          <button v-if="rows.length < MAX_READINGS && !suggestThird && !retakeDeclined" type="button" class="btn btn-ghost" @click="addThird">
            <AppIcon name="plus" :size="16" /> 3회차 추가
          </button>
          <span class="grow" />
          <span class="kbd-tip">Enter로 저장</span>
          <button type="button" class="btn btn-primary save" :disabled="!canSave" @click="f.save(true)">{{ saveLabel }}</button>
        </div>
      </section>

      <aside class="side">
        <section class="card preview" aria-live="polite">
          <span class="p-label">{{ done.length > 1 ? `${done.length}회 평균` : done.length ? '이번 값' : '평균' }}</span>
          <b class="p-value" :style="grade ? { color: gradeVar(grade, 'fg') } : undefined">{{ avg ? `${avg.sys}/${avg.dia}` : '–/–' }}</b>
          <span class="p-meta">
            <GradeChip v-if="grade" :grade="grade" />
            <span v-if="avg?.pulse" class="p-pulse">맥박 {{ avg.pulse }}</span>
          </span>
          <GradeLegend ranges class="p-legend" />
        </section>
        <section v-if="!modal" class="card guide">
          <h2 class="h2"><AppIcon name="book" :size="18" /> 바르게 재는 법</h2>
          <MeasureGuide />
        </section>
      </aside>
    </div>

    <RestTimer v-if="restKind" :kind="restKind" :left="rest" :total="restTotal" :row="restRow" :compare="retakePair" @close="stopRest" @skip-retake="f.skipRetake" />
  </div>
</template>

<style scoped>
.record { display: flex; flex-direction: column; gap: 20px; }
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
.sub { font-size: 15px; color: var(--sub); }
.cancel { height: 44px; font-size: 14px; border-radius: 12px; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
.form { display: flex; flex-direction: column; gap: 18px; padding: 24px; }
.controls { display: flex; align-items: center; gap: 12px; }
.seg { gap: 4px; padding: 4px; border-radius: 14px; }
.seg button { height: 40px; padding: 0 18px; border-radius: 10px; font-size: 15px; }
.date .input { width: 200px; height: 48px; }
.table { display: flex; flex-direction: column; gap: 10px; }
.thead, .tr { display: grid; grid-template-columns: 64px repeat(3, minmax(0, 1fr)) 40px; gap: 12px; align-items: center; }
.thead { font-size: 13px; font-weight: 600; color: var(--sub); }
.thead small { font-weight: 400; color: var(--mute); }
.row-label { font-size: 14px; font-weight: 600; color: var(--sub); }
.num {
  width: 100%;
  height: 68px;
  padding: 0 18px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--soft);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  transition: border-color var(--fast) ease, box-shadow var(--fast) ease, background var(--fast) ease;
}
.num::placeholder { color: #c3c9c5; font-weight: 500; }
.num.filled { background: var(--card); }
.num:focus { outline: none; border-color: var(--accent); background: var(--card); box-shadow: 0 0 0 3px var(--focus); }
.tr.bad .num { border-color: var(--danger); }
.row-x { width: 36px; height: 36px; color: var(--sub); }
.banner { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 14px; border-radius: 14px; font-size: 14px; font-weight: 600; }
.banner .grow { flex: 1; }
.bad.banner { background: var(--danger-soft); color: var(--danger); }
.third { background: var(--g-prehigh-bg); color: var(--g-prehigh-fg); }
.third-btn { height: 36px; padding: 0 12px; border: 0; border-radius: 10px; background: var(--g-prehigh-fg); color: #fff; font-size: 13px; font-weight: 700; }
.actions { display: flex; align-items: center; gap: 12px; padding-top: 6px; border-top: 1px solid var(--soft-2); }
.actions .grow { flex: 1; }
.actions .btn-ghost { height: 44px; font-size: 14px; color: var(--sub); }
.kbd-tip { font-size: 12px; color: var(--mute); }
.save { min-width: 160px; height: 52px; }
.side { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 24px; }
.preview { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 20px; }
.p-label { font-size: 13px; color: var(--sub); }
.p-value { font-size: 44px; line-height: 1.1; letter-spacing: -0.03em; }
.p-meta { display: flex; align-items: center; gap: 8px; min-height: 26px; }
.p-pulse { font-size: 13px; color: var(--sub); }
.p-legend { flex-direction: column; align-items: flex-start; margin-top: 10px; padding-top: 12px; border-top: 1px solid var(--soft-2); width: 100%; font-size: 13px; }
.guide { display: flex; flex-direction: column; gap: 10px; padding: 20px; }
.h2 { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; }

/* 모달: 바깥 창이 카드 역할을 하므로 안쪽 카드는 배경만 살짝 */
.modal { gap: 16px; }
.modal .page-head { align-items: flex-start; }
.modal .title { font-size: 24px; }
.modal .close { background: var(--soft); }
.modal .layout { grid-template-columns: minmax(0, 1fr) 280px; }
.modal .form { padding: 0; background: transparent; }
.modal .side { position: static; }
.modal .preview { background: var(--soft); }
.modal .p-value { font-size: 38px; }
.modal .num { height: 62px; font-size: 28px; }
</style>
