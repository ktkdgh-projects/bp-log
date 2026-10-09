import type { DayResponse, NoteDto, RecordDto, Session } from '#shared/types'

// 날짜 하나의 기록·메모. 모바일 시트와 데스크톱 옆 패널이 같이 쓴다
export function useDay(date: Ref<string | null>, onChanged: () => void) {
  const day = ref<DayResponse | null>(null)
  const loading = ref(false)
  const failure = ref('')
  const tags = ref<string[]>([])
  const memo = ref('')
  const savedMemo = ref('')

  async function load(d: string | null) {
    failure.value = ''
    if (!d) {
      day.value = null
      return
    }
    loading.value = !day.value || day.value.date !== d
    try {
      const res = await $fetch<DayResponse>('/api/records/day', { query: { date: d } })
      if (date.value !== d) return
      day.value = res
      tags.value = res.note?.tags ?? []
      memo.value = savedMemo.value = res.note?.memo ?? ''
    }
    catch (error) {
      failure.value = errorMessage(error)
    }
    finally {
      loading.value = false
    }
  }
  watch(date, load, { immediate: true })
  // PC 기록 모달에서 저장하면 다시 불러온다
  watch(useRecordModal().version, () => load(date.value))

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
      day.value = { ...day.value, [session]: null }
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
