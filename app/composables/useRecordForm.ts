import type { DayResponse, RecordDto, Session } from '#shared/types'

export type Field = 'sys' | 'dia' | 'pulse'
export interface Row { sys: string, dia: string, pulse: string }
export interface Cursor { row: number, field: Field }

export const FIELDS: Field[] = ['sys', 'dia', 'pulse']
export const FIELD_LABEL: Record<Field, string> = { sys: '수축기', dia: '이완기', pulse: '맥박' }
export const REST_SECONDS = 60

// 혈압계 숫자 범위에 맞춰 몇 자리면 다 쓴 건지 정한다 (자릿수가 차면 다음 칸으로)
export function digitsFor(field: Field, value: string) {
  const first = value[0]
  if (field === 'sys') return first === '1' || first === '2' ? 3 : 2
  if (field === 'dia') return first === '1' ? 3 : 2
  return first === '1' || first === '2' ? 3 : 2
}

export interface RecordFormOptions {
  date?: string
  session?: Session
  // 있으면 저장 뒤 페이지를 옮기지 않고 이 함수를 부른다 (데스크톱 모달)
  onSaved?: (date: string) => void
}

// 기록 입력 상태·검증·저장. 키패드(모바일)와 입력칸(데스크톱)이 같이 쓴다.
// typing: 지금 입력 중인 칸 — 그 칸의 덜 쓴 맥박은 아직 오류로 보지 않는다
export function useRecordForm(typing: Ref<Cursor | null>, opts: RecordFormOptions = {}) {
  const route = useRoute()
  const today = kstToday()
  const fallback = defaultSlot()

  const qDate = opts.date ?? route.query.date
  const qSession = opts.session ?? route.query.session
  // 3일이 지난 날짜는 고칠 수 없으니 오늘 칸으로 연다
  const date = ref(isDate(qDate) && canEditRecord(qDate, today) ? qDate : fallback.date)
  const minDate = editableFrom(today)
  const session = ref<Session>(qSession === 'morning' || qSession === 'evening' ? qSession : fallback.session)

  const emptyRow = (): Row => ({ sys: '', dia: '', pulse: '' })
  const rows = ref<Row[]>([emptyRow(), emptyRow()])
  const existing = ref<RecordDto | null>(null)
  const loaded = ref(false)
  const snapshot = ref('')
  const busy = ref(false)
  const failure = ref('')

  const rest = ref(0)
  let restTimer: ReturnType<typeof setInterval> | undefined
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
  const restClock = computed(() => `${Math.floor(rest.value / 60)}:${String(rest.value % 60).padStart(2, '0')}`)

  async function load() {
    failure.value = ''
    loaded.value = false
    try {
      const day = await $fetch<DayResponse>('/api/records/day', { query: { date: date.value } })
      const rec = day[session.value]
      existing.value = rec
      rows.value = rec
        ? rec.readings.map(r => ({ sys: String(r.sys), dia: String(r.dia), pulse: r.pulse == null ? '' : String(r.pulse) }))
        : [emptyRow(), emptyRow()]
      if (rows.value.length < 2) rows.value.push(emptyRow())
      snapshot.value = JSON.stringify(rows.value)
    }
    catch (error) {
      failure.value = errorMessage(error)
    }
    finally {
      loaded.value = true
    }
  }
  onMounted(load)
  watch([date, session], () => {
    stopRest()
    load()
  })

  // 처음 빈 칸 (불러온 뒤 커서를 둘 곳)
  const firstEmpty = computed<Cursor>(() => {
    const i = rows.value.findIndex(r => !r.sys)
    return { row: i >= 0 ? i : 0, field: 'sys' }
  })

  const parsed = computed(() => rows.value.map((r, ri) => {
    const sys = r.sys ? Number(r.sys) : null
    const dia = r.dia ? Number(r.dia) : null
    const pulse = r.pulse ? Number(r.pulse) : null
    const complete = sys != null && dia != null && r.sys.length >= 2 && r.dia.length >= 2
    const typingPulse = typing.value?.row === ri && typing.value.field === 'pulse'
    let problem = ''
    if (complete) {
      if (sys < LIMITS.sys.min || sys > LIMITS.sys.max) problem = `수축기는 ${LIMITS.sys.min}–${LIMITS.sys.max} 사이예요`
      else if (dia < LIMITS.dia.min || dia > LIMITS.dia.max) problem = `이완기는 ${LIMITS.dia.min}–${LIMITS.dia.max} 사이예요`
      else if (dia >= sys) problem = '이완기가 수축기보다 높아요'
      else if (pulse != null && (pulse < LIMITS.pulse.min || pulse > LIMITS.pulse.max) && (r.pulse.length >= 2 || !typingPulse)) problem = `맥박은 ${LIMITS.pulse.min}–${LIMITS.pulse.max} 사이예요`
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
    startRest()
  }
  function removeRow(i: number) {
    rows.value.splice(i, 1)
    if (rows.value.length < 2) rows.value.push(emptyRow())
  }

  // 불러온 값에서 바뀐 게 있는지 (모달을 닫을 때 확인용)
  const dirty = computed(() => loaded.value && JSON.stringify(rows.value) !== snapshot.value)

  const canSave = computed(() => done.value.length >= 1 && !problem.value && !hasPartial.value && !busy.value)
  const saveLabel = computed(() => (busy.value ? '저장 중…' : done.value.length === 1 ? '1회만 저장' : '저장'))

  // 저장 뒤 돌아갈 곳: 그 달 달력 (keepDate면 그 날짜를 열어 둔다)
  async function save(keepDate = false) {
    if (!canSave.value) return
    failure.value = ''
    busy.value = true
    try {
      const readings = parsed.value.filter(p => p.complete).map(p => ({ sys: p.sys!, dia: p.dia!, pulse: p.pulse }))
      await $fetch('/api/records', { method: 'PUT', body: { date: date.value, session: session.value, readings } })
      if (opts.onSaved) {
        snapshot.value = JSON.stringify(rows.value)
        opts.onSaved(date.value)
        return
      }
      const m = date.value.slice(0, 7)
      const query: Record<string, string> = m === today.slice(0, 7) ? {} : { month: m }
      if (keepDate) query.date = date.value
      // 달력이 저장 전 캐시를 잠깐 보여 주지 않게 비우고 새로 받게 한다
      clearNuxtData(key => key.startsWith('month:') || key.startsWith('summary:'))
      await navigateTo({ path: '/', query })
    }
    catch (error) {
      failure.value = errorMessage(error)
    }
    finally {
      busy.value = false
    }
  }

  if (!opts.onSaved) useHead(() => ({ title: `${SESSION_LABEL[session.value]} 기록 · bp-log` }))

  return {
    today, minDate, date, session, rows, existing, loaded, busy, failure,
    rest, restClock, startRest, stopRest,
    firstEmpty, parsed, done, avg, grade, problem, gap, suggestThird, addThird, removeRow,
    dirty, canSave, saveLabel, save,
  }
}
