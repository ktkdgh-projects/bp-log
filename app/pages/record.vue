<script setup lang="ts">
import type { DayResponse, RecordDto, Session } from '#shared/types'

definePageMeta({ layout: 'plain' })

type Field = 'sys' | 'dia' | 'pulse'
interface Row { sys: string, dia: string, pulse: string }

const FIELDS: Field[] = ['sys', 'dia', 'pulse']
const FIELD_LABEL: Record<Field, string> = { sys: '수축기', dia: '이완기', pulse: '맥박' }
const REST_SECONDS = 60

const route = useRoute()
const today = kstToday()
const fallback = defaultSlot()

const date = ref(isDate(route.query.date) && route.query.date <= today ? route.query.date : fallback.date)
const session = ref<Session>(route.query.session === 'morning' || route.query.session === 'evening' ? route.query.session : fallback.session)

const emptyRow = (): Row => ({ sys: '', dia: '', pulse: '' })
const rows = ref<Row[]>([emptyRow(), emptyRow()])
const active = ref<{ row: number, field: Field }>({ row: 0, field: 'sys' })
const existing = ref<RecordDto | null>(null)
const busy = ref(false)
const failure = ref('')
const rest = ref(0)
let restTimer: ReturnType<typeof setInterval> | undefined

useHead(() => ({ title: `${SESSION_LABEL[session.value]} 기록 · bp-log` }))

async function load() {
  failure.value = ''
  try {
    const day = await $fetch<DayResponse>('/api/records/day', { query: { date: date.value } })
    const rec = day[session.value]
    existing.value = rec
    if (rec) {
      rows.value = rec.readings.map(r => ({ sys: String(r.sys), dia: String(r.dia), pulse: r.pulse == null ? '' : String(r.pulse) }))
      if (rows.value.length < 2) rows.value.push(emptyRow())
      active.value = { row: rows.value.findIndex(r => !r.sys) >= 0 ? rows.value.findIndex(r => !r.sys) : 0, field: 'sys' }
    }
    else {
      rows.value = [emptyRow(), emptyRow()]
      active.value = { row: 0, field: 'sys' }
    }
  }
  catch (error) {
    failure.value = errorMessage(error)
  }
}
onMounted(load)
watch([date, session], () => {
  stopRest()
  load()
})

// 혈압계 숫자 범위에 맞춰 자릿수가 차면 다음 칸으로 넘어간다
function digitsFor(field: Field, value: string): number {
  const first = value.charAt(0)
  if (field === 'dia') return first === '1' ? 3 : 2
  return first === '1' || first === '2' ? 3 : 2
}

function startRest() {
  stopRest()
  rest.value = REST_SECONDS
  restTimer = setInterval(() => {
    rest.value -= 1
    if (rest.value <= 0) {
      stopRest()
      navigator.vibrate?.(200)
    }
  }, 1000)
}
function stopRest() {
  clearInterval(restTimer)
  restTimer = undefined
  rest.value = 0
}
onBeforeUnmount(stopRest)

function advance() {
  const { row, field } = active.value
  const i = FIELDS.indexOf(field)
  if (i < FIELDS.length - 1) {
    active.value = { row, field: FIELDS[i + 1]! }
    return
  }
  if (row < rows.value.length - 1) {
    active.value = { row: row + 1, field: 'sys' }
    if (!rows.value[row + 1]!.sys) startRest()
  }
}

function back() {
  const { row, field } = active.value
  const i = FIELDS.indexOf(field)
  if (i > 0) active.value = { row, field: FIELDS[i - 1]! }
  else if (row > 0) active.value = { row: row - 1, field: 'pulse' }
}

function press(key: string) {
  navigator.vibrate?.(8)
  const { row, field } = active.value
  const r = rows.value[row]!
  if (key === 'del') {
    if (r[field]) r[field] = r[field].slice(0, -1)
    else back()
    return
  }
  if (key === 'next') {
    advance()
    return
  }
  if (r[field].length >= 3) return
  if (r[field] === '' && key === '0') return
  r[field] += key
  if (r[field].length >= digitsFor(field, r[field])) advance()
}

function focusField(row: number, field: Field) {
  active.value = { row, field }
}

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey || e.altKey) return
  if (/^[0-9]$/.test(e.key)) press(e.key)
  else if (e.key === 'Backspace') press('del')
  else if (e.key === 'Tab' || e.key === ' ' || e.key === '/' || e.key === 'ArrowRight') press('next')
  else if (e.key === 'ArrowLeft') back()
  else if (e.key === 'Enter') save()
  else return
  e.preventDefault()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// 지금 입력 중인 맥박 한 자리는 아직 오류로 보지 않는다
function isActive(r: Row) {
  return rows.value[active.value.row] === r && active.value.field === 'pulse'
}

const parsed = computed(() => rows.value.map((r) => {
  const sys = r.sys ? Number(r.sys) : null
  const dia = r.dia ? Number(r.dia) : null
  const pulse = r.pulse ? Number(r.pulse) : null
  const complete = sys != null && dia != null && r.sys.length >= 2 && r.dia.length >= 2
  let problem = ''
  if (complete) {
    if (sys < LIMITS.sys.min || sys > LIMITS.sys.max) problem = `수축기는 ${LIMITS.sys.min}–${LIMITS.sys.max} 사이예요`
    else if (dia < LIMITS.dia.min || dia > LIMITS.dia.max) problem = `이완기는 ${LIMITS.dia.min}–${LIMITS.dia.max} 사이예요`
    else if (dia >= sys) problem = '이완기가 수축기보다 높아요'
    else if (pulse != null && (pulse < LIMITS.pulse.min || pulse > LIMITS.pulse.max) && (r.pulse.length >= 2 || !isActive(r))) problem = `맥박은 ${LIMITS.pulse.min}–${LIMITS.pulse.max} 사이예요`
  }
  return { sys, dia, pulse, complete, problem, empty: !r.sys && !r.dia && !r.pulse }
}))

const done = computed(() => parsed.value.filter(p => p.complete && !p.problem))
const avg = computed(() => (done.value.length ? averageOf(done.value.map(p => ({ sys: p.sys!, dia: p.dia!, pulse: p.pulse }))) : null))
const grade = computed(() => (avg.value ? gradeOf(avg.value.sys, avg.value.dia) : null))
const problem = computed(() => parsed.value.find(p => p.problem)?.problem ?? '')
const hasPartial = computed(() => parsed.value.some(p => !p.empty && !p.complete))

const gap = computed(() => {
  const [a, b] = parsed.value
  return a?.complete && b?.complete && !a.problem && !b.problem ? Math.abs(a.sys! - b.sys!) : 0
})
const suggestThird = computed(() => rows.value.length === 2 && gap.value >= RETAKE_GAP)

function addThird() {
  rows.value.push(emptyRow())
  active.value = { row: 2, field: 'sys' }
  startRest()
}
function removeRow(i: number) {
  rows.value.splice(i, 1)
  if (rows.value.length < 2) rows.value.push(emptyRow())
  active.value = { row: Math.min(active.value.row, rows.value.length - 1), field: 'sys' }
}

const canSave = computed(() => done.value.length >= 1 && !problem.value && !hasPartial.value && !busy.value)

async function save() {
  if (!canSave.value) return
  failure.value = ''
  busy.value = true
  try {
    const readings = parsed.value.filter(p => p.complete).map(p => ({ sys: p.sys!, dia: p.dia!, pulse: p.pulse }))
    await $fetch('/api/records', { method: 'PUT', body: { date: date.value, session: session.value, readings } })
    const m = date.value.slice(0, 7)
    await navigateTo({ path: '/', query: m === today.slice(0, 7) ? {} : { month: m } })
  }
  catch (error) {
    failure.value = errorMessage(error)
  }
  finally {
    busy.value = false
  }
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'next', '0', 'del']
const dateInput = ref<HTMLInputElement | null>(null)
function openDate() {
  const el = dateInput.value
  if (!el) return
  try {
    el.showPicker()
  }
  catch {
    el.click()
  }
}
</script>

<template>
  <div class="record">
    <header class="head">
      <NuxtLink to="/" class="icon-btn" aria-label="달력으로 돌아가기"><AppIcon name="chevron-left" /></NuxtLink>
      <div class="head-text">
        <h1 class="title">{{ SESSION_LABEL[session] }} {{ existing ? '기록 고치기' : '기록' }}</h1>
        <button type="button" class="date-btn" @click="openDate">
          {{ formatDate(date) }}{{ date === today ? ' · 오늘' : '' }}
          <AppIcon name="calendar" :size="14" />
        </button>
        <input ref="dateInput" v-model="date" type="date" class="date-input" :max="today" aria-label="날짜 바꾸기" tabindex="-1">
      </div>
    </header>

    <div class="seg" role="radiogroup" aria-label="측정 시간대">
      <button v-for="s in (['morning', 'evening'] as const)" :key="s" type="button" role="radio" :aria-checked="session === s" :class="{ on: session === s }" @click="session = s">
        <AppIcon :name="s === 'morning' ? 'sun' : 'moon'" :size="16" />
        {{ SESSION_LABEL[s] }}
      </button>
    </div>

    <div class="rows">
      <div v-for="(r, ri) in rows" :key="ri" class="row card" :class="{ current: active.row === ri, bad: parsed[ri]?.problem }">
        <span class="row-label">{{ ri + 1 }}회차</span>
        <button
          v-for="f in FIELDS"
          :key="f"
          type="button"
          class="cell"
          :class="{ on: active.row === ri && active.field === f, filled: !!r[f] }"
          :aria-label="`${ri + 1}회차 ${FIELD_LABEL[f]} ${r[f] || '비어 있음'}`"
          @click="focusField(ri, f)"
        >
          <span class="cell-label">{{ FIELD_LABEL[f] }}<template v-if="f === 'pulse'"> (선택)</template></span>
          <span class="cell-value">{{ r[f] || '–' }}<span v-if="active.row === ri && active.field === f" class="caret" /></span>
        </button>
        <button v-if="ri === 2" type="button" class="row-x" aria-label="3회차 지우기" @click="removeRow(ri)"><AppIcon name="close" :size="16" /></button>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="rest > 0" class="banner rest" role="status">
        <AppIcon name="timer" :size="18" />
        <span class="grow">1분 쉬고 {{ active.row + 1 }}회차를 재요</span>
        <b class="clock">{{ Math.floor(rest / 60) }}:{{ String(rest % 60).padStart(2, '0') }}</b>
        <button type="button" class="skip" @click="stopRest">건너뛰기</button>
      </div>
      <div v-else-if="problem" class="banner bad" role="alert">
        <AppIcon name="alert" :size="18" />
        <span class="grow">{{ problem }}</span>
      </div>
      <div v-else-if="suggestThird" class="banner third" role="status">
        <span class="grow">두 값 차이가 {{ gap }}이에요. 한 번 더 재면 정확해요</span>
        <button type="button" class="third-btn" @click="addThird">3회차 추가</button>
      </div>
    </Transition>

    <div class="summary card">
      <span class="sum-label">{{ done.length > 1 ? `${done.length}회 평균` : '이번 값' }}</span>
      <span class="sum-value">
        <b>{{ avg ? `${avg.sys}/${avg.dia}` : '–' }}</b>
        <span v-if="avg?.pulse" class="sum-pulse">맥박 {{ avg.pulse }}</span>
        <GradeChip v-if="grade" :grade="grade" />
      </span>
    </div>

    <p v-if="failure" class="error" role="alert">{{ failure }}</p>

    <div class="spacer" />

    <div class="pad" role="group" aria-label="숫자 키패드">
      <button
        v-for="k in KEYS"
        :key="k"
        type="button"
        class="key"
        :class="{ fn: k === 'next' || k === 'del' }"
        :aria-label="k === 'next' ? '다음 칸' : k === 'del' ? '지우기' : k"
        @click="press(k)"
      >
        <AppIcon v-if="k === 'del'" name="backspace" :size="22" />
        <template v-else>{{ k === 'next' ? '다음' : k }}</template>
      </button>
    </div>

    <button type="button" class="btn btn-primary btn-lg btn-block" :disabled="!canSave" @click="save">
      {{ busy ? '저장 중…' : done.length === 1 ? '1회만 저장' : '저장' }}
    </button>
    <p class="tip">5분 앉아 쉰 뒤, 1분 간격으로 2번 재요. 키보드로도 입력할 수 있어요.</p>
  </div>
</template>

<style scoped>
.record { display: flex; flex-direction: column; gap: 12px; flex: 1; }
.head { display: flex; align-items: center; gap: 10px; }
.head-text { position: relative; display: flex; flex-direction: column; align-items: flex-start; }
.title { font-size: 19px; font-weight: 700; }
.date-btn { display: inline-flex; align-items: center; gap: 4px; padding: 2px 0; border: 0; background: none; color: var(--sub); font-size: 13px; }
.date-btn:hover { color: var(--accent); }
.date-input { position: absolute; left: 0; bottom: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.seg { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 14px; background: #e6e9e4; }
.seg button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 44px; border: 0; border-radius: 10px; background: transparent; color: var(--sub); font-size: 15px; font-weight: 500; }
.seg button.on { background: var(--card); color: var(--text); font-weight: 700; box-shadow: 0 1px 2px rgb(0 0 0 / 0.06); }
.rows { display: flex; flex-direction: column; gap: 8px; }
.row { position: relative; display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 16px; transition: box-shadow var(--fast) ease; }
.row.current { box-shadow: 0 0 0 2px var(--accent); }
.row.bad { box-shadow: 0 0 0 2px var(--danger); }
.row-label { width: 34px; flex-shrink: 0; font-size: 12px; font-weight: 600; color: var(--sub); }
.cell { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; height: 64px; border: 0; border-radius: 12px; background: var(--soft); color: var(--mute); transition: background var(--fast) ease; }
.cell.filled { color: var(--text); }
.cell.on { background: var(--accent-soft); box-shadow: inset 0 0 0 2px var(--accent); }
.cell-label { font-size: 11px; font-weight: 500; color: var(--sub); white-space: nowrap; }
.cell-value { display: inline-flex; align-items: center; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; min-height: 30px; }
.caret { width: 2px; height: 22px; margin-left: 2px; background: var(--accent); animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
.row-x { position: absolute; top: -8px; right: -6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: var(--text-2); color: #fff; }
.banner { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 14px; border-radius: 14px; font-size: 14px; font-weight: 600; }
.banner .grow { flex: 1; }
.rest { background: var(--g-normal-bg); color: var(--g-normal-fg); }
.clock { font-size: 16px; }
.skip { height: 32px; padding: 0 10px; border: 0; border-radius: 8px; background: rgb(255 255 255 / 0.7); color: inherit; font-size: 13px; font-weight: 600; }
.bad.banner { background: var(--danger-soft); color: var(--danger); }
.third { background: var(--g-prehigh-bg); color: var(--g-prehigh-fg); }
.third-btn { height: 36px; padding: 0 12px; border: 0; border-radius: 10px; background: var(--g-prehigh-fg); color: #fff; font-size: 13px; font-weight: 700; }
.summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 16px; border-radius: 16px; }
.sum-label { font-size: 13px; font-weight: 500; color: var(--sub); }
.sum-value { display: flex; align-items: center; gap: 8px; }
.sum-value b { font-size: 22px; }
.sum-pulse { font-size: 12px; color: var(--sub); }
.spacer { flex: 1; min-height: 4px; }
.pad { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.key { height: 54px; border: 0; border-radius: 14px; background: var(--card); color: var(--text); font-size: 22px; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: background var(--fast) ease, transform var(--fast) ease; touch-action: manipulation; user-select: none; }
.key:active { background: var(--soft-2); transform: scale(0.97); }
.key.fn { background: #dde3df; font-size: 16px; }
.tip { font-size: 12px; color: var(--mute); text-align: center; }

@media (min-height: 860px) {
  .key { height: 60px; }
}
</style>
