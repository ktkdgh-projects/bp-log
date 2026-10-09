import type { DayResponse, MonthResponse, NoteDto, RecordDto, Session } from '#shared/types'

// 날짜 하나의 기록·메모. 모바일 시트와 데스크톱 옆 패널이 같이 쓴다
// 달력이 그 달 기록·메모를 이미 들고 있으면(month) 거기서 꺼내 쓰고, 없을 때만 따로 받는다
// month가 null이면 달력이 그 달을 받는 중이라 따로 받지 않고 기다린다
export function useDay(date: Ref<string | null>, onChanged: () => void, month?: () => MonthResponse | null | undefined) {
  const fetched = ref<DayResponse | null>(null)
  // 지운 기록은 달력 데이터가 새로 올 때까지 먼저 숨긴다
  const removed = ref<Session[]>([])
  const loading = ref(false)
  const failure = ref('')
  const tags = ref<string[]>([])
  const memo = ref('')
  const savedMemo = ref('')

  function fromMonth(d: string): DayResponse | null {
    const m = month?.()
    if (m?.month !== d.slice(0, 7)) return null
    const pick = (session: Session) => m.records.find(r => r.date === d && r.session === session) ?? null
    return { date: d, morning: pick('morning'), evening: pick('evening'), note: m.notes.find(n => n.date === d) ?? null }
  }

  const day = computed<DayResponse | null>(() => {
    const d = date.value
    if (!d) return null
    const base = fromMonth(d) ?? (fetched.value?.date === d ? fetched.value : null)
    if (!base || !removed.value.length) return base
    return { ...base, ...Object.fromEntries(removed.value.map(s => [s, null])) }
  })

  const waiting = computed(() => month?.() === null)

  async function load(d: string | null) {
    failure.value = ''
    if (!d || waiting.value || fromMonth(d)) return
    loading.value = fetched.value?.date !== d
    try {
      const res = await $fetch<DayResponse>('/api/records/day', { query: { date: d } })
      if (date.value === d) fetched.value = res
    }
    catch (error) {
      failure.value = errorMessage(error)
    }
    finally {
      loading.value = false
    }
  }
  watch(date, (d) => {
    removed.value = []
    load(d)
  }, { immediate: true })
  // PC 기록 모달에서 저장하면 다시 불러온다 (달력 데이터에서 꺼내 쓰는 중이면 달력이 새로 받는다)
  watch(useRecordModal().version, () => load(date.value))
  // 달력 데이터가 새로 오면 지운 기록 숨김을 풀고, 그래도 그 날짜가 없으면 따로 받는다
  watch(() => month?.(), () => {
    removed.value = []
    if (!day.value) load(date.value)
  })

  // 날짜를 바꿨거나 그날 데이터가 처음 왔을 때만 태그·메모 입력칸을 채운다 (그 뒤로는 입력한 값이 기준)
  watch(() => [date.value, !!day.value] as const, () => {
    const note = day.value?.note
    tags.value = note?.tags ?? []
    memo.value = savedMemo.value = note?.memo ?? ''
  }, { immediate: true })

  const sessions = computed(() => {
    const d = day.value
    if (!d) return []
    return (['morning', 'evening'] as const).map(session => ({
      session,
      rec: d[session] as RecordDto | null,
      grade: d[session] ? gradeOf(d[session]!.avg.sys, d[session]!.avg.dia) : null,
      time: measuredTime(d[session]),
    }))
  })

  const dayAvg = computed(() => {
    const recs = sessions.value.map(s => s.rec).filter((r): r is RecordDto => !!r)
    if (recs.length < 2) return null
    return `${Math.round(recs.reduce((s, r) => s + r.avg.sys, 0) / recs.length)}/${Math.round(recs.reduce((s, r) => s + r.avg.dia, 0) / recs.length)}`
  })

  async function saveNote() {
    if (!date.value) return
    failure.value = ''
    try {
      const res = await $fetch<NoteDto>('/api/notes', { method: 'PUT', body: { date: date.value, tags: tags.value, memo: memo.value } })
      savedMemo.value = res.memo
      invalidatePrefetch()
      onChanged()
    }
    catch (error) {
      failure.value = errorMessage(error)
    }
  }

  function toggleTag(tag: string) {
    tags.value = tags.value.includes(tag) ? tags.value.filter(t => t !== tag) : [...tags.value, tag]
    saveNote()
  }

  function onMemoBlur() {
    if (memo.value.trim() !== savedMemo.value) saveNote()
  }

  async function remove(session: Session) {
    if (!date.value || !day.value) return
    if (!confirm(`${SESSION_LABEL[session]} 기록을 지울까요?`)) return
    try {
      await $fetch('/api/records', { method: 'DELETE', body: { date: date.value, session } })
      removed.value = [...removed.value, session]
      invalidatePrefetch()
      onChanged()
    }
    catch (error) {
      failure.value = errorMessage(error)
    }
  }

  return { day, loading, failure, tags, memo, sessions, dayAvg, toggleTag, onMemoBlur, remove }
}

// 나중에 몰아서 넣은 기록은 저장 시각이 측정 시각이 아니므로 그날 저장한 것만 시각을 보여준다
function measuredTime(rec: RecordDto | null) {
  if (!rec) return ''
  const at = new Date(rec.measuredAt)
  if (toKstDate(at) !== rec.date && !(rec.session === 'evening' && toKstDate(at) === addDays(rec.date, 1) && kstHour(at) < 4)) return ''
  return at.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' })
}
