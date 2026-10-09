<script setup lang="ts">
import type { DayResponse, NoteDto, RecordDto, Session } from '#shared/types'

const props = defineProps<{ date: string | null }>()
const emit = defineEmits<{ close: [], changed: [] }>()

const day = ref<DayResponse | null>(null)
const loading = ref(false)
const failure = ref('')
const tags = ref<string[]>([])
const memo = ref('')
const savedMemo = ref('')
const closeBtn = ref<HTMLButtonElement | null>(null)

watch(() => props.date, async (date) => {
  day.value = null
  failure.value = ''
  if (!date) return
  loading.value = true
  try {
    const res = await $fetch<DayResponse>('/api/records/day', { query: { date } })
    if (props.date !== date) return
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
  await nextTick()
  closeBtn.value?.focus()
}, { immediate: true })

// 나중에 몰아서 넣은 기록은 저장 시각이 측정 시각이 아니므로 그날 저장한 것만 시각을 보여준다
function measuredTime(rec: RecordDto | null) {
  if (!rec) return ''
  const at = new Date(rec.measuredAt)
  if (toKstDate(at) !== rec.date && !(rec.session === 'evening' && toKstDate(at) === addDays(rec.date, 1) && kstHour(at) < 4)) return ''
  return at.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' })
}

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
  if (!props.date) return
  failure.value = ''
  try {
    const res = await $fetch<NoteDto>('/api/notes', { method: 'PUT', body: { date: props.date, tags: tags.value, memo: memo.value } })
    savedMemo.value = res.memo
    emit('changed')
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
  if (!props.date || !day.value) return
  if (!confirm(`${SESSION_LABEL[session]} 기록을 지울까요?`)) return
  try {
    await $fetch('/api/records', { method: 'DELETE', body: { date: props.date, session } })
    day.value = { ...day.value, [session]: null }
    emit('changed')
  }
  catch (error) {
    failure.value = errorMessage(error)
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.date) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="date" class="backdrop" @click.self="emit('close')">
        <section class="sheet" role="dialog" aria-modal="true" :aria-label="formatDate(date)">
          <span class="grip" aria-hidden="true" />
          <header class="head">
            <div>
              <h2 class="title">{{ formatDate(date) }}</h2>
              <p class="sub">{{ dayAvg ? `하루 평균 ${dayAvg}` : '아침·저녁 2회 평균' }}</p>
            </div>
            <button ref="closeBtn" type="button" class="icon-btn soft" aria-label="닫기" @click="emit('close')">
              <AppIcon name="close" />
            </button>
          </header>

          <p v-if="failure" class="error" role="alert">{{ failure }}</p>

          <div v-if="loading" class="loading">불러오는 중…</div>
          <template v-else-if="day">
            <article v-for="s in sessions" :key="s.session" class="rec card">
              <div class="rec-head">
                <span class="rec-title">
                  <AppIcon :name="s.session === 'morning' ? 'sun' : 'moon'" :size="18" :class="s.session" />
                  {{ SESSION_LABEL[s.session] }}
                  <span v-if="s.time" class="time">{{ s.time }}</span>
                </span>
                <GradeChip v-if="s.grade" :grade="s.grade" />
              </div>
              <template v-if="s.rec">
                <div class="big">
                  <span class="nums">{{ s.rec.avg.sys }}/{{ s.rec.avg.dia }}</span>
                  <span v-if="s.rec.avg.pulse" class="pulse">맥박 {{ s.rec.avg.pulse }}</span>
                </div>
                <ul class="readings">
                  <li v-for="(r, i) in s.rec.readings" :key="i">
                    <span class="label">{{ i + 1 }}회차</span>
                    <b>{{ r.sys }}/{{ r.dia }}<template v-if="r.pulse"> · {{ r.pulse }}</template></b>
                  </li>
                </ul>
                <div class="rec-actions">
                  <NuxtLink :to="{ path: '/record', query: { date, session: s.session } }" class="btn btn-soft small">
                    <AppIcon name="edit" :size="16" /> 수정
                  </NuxtLink>
                  <button type="button" class="btn btn-ghost small" @click="remove(s.session)">
                    <AppIcon name="trash" :size="16" /> 삭제
                  </button>
                </div>
              </template>
              <NuxtLink v-else :to="{ path: '/record', query: { date, session: s.session } }" class="btn btn-soft btn-block add">
                <AppIcon name="plus" :size="18" /> {{ SESSION_LABEL[s.session] }} 기록하기
              </NuxtLink>
            </article>

            <div class="note">
              <span class="note-title">그날 메모</span>
              <div class="tags">
                <button
                  v-for="t in TAGS"
                  :key="t"
                  type="button"
                  class="tag"
                  :class="{ on: tags.includes(t) }"
                  :aria-pressed="tags.includes(t)"
                  @click="toggleTag(t)"
                >
                  {{ t }}
                </button>
              </div>
              <label class="sr-only" for="memo">메모</label>
              <textarea id="memo" v-model="memo" class="memo" rows="2" maxlength="200" placeholder="한 줄 메모 (선택)" @blur="onMemoBlur" />
            </div>
          </template>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgb(23 32 29 / 0.45);
}
.sheet {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 520px;
  max-height: 92dvh;
  overflow-y: auto;
  padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
  border-radius: 24px 24px 0 0;
  background: var(--bg);
}
.grip { align-self: center; width: 40px; height: 5px; border-radius: 3px; background: #c9cfcb; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.title { font-size: 20px; font-weight: 700; }
.sub { font-size: 13px; color: var(--sub); }
.icon-btn.soft { background: var(--card); }
.loading { padding: 40px 0; text-align: center; color: var(--sub); }
.rec { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 18px; }
.rec-head { display: flex; align-items: center; justify-content: space-between; }
.rec-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
.rec-title .morning { color: #9a5b0b; }
.rec-title .evening { color: #2e6399; }
.time { font-size: 13px; font-weight: 500; color: var(--sub); }
.big { display: flex; align-items: baseline; gap: 8px; }
.nums { font-size: 32px; font-weight: 700; letter-spacing: -0.03em; }
.pulse { font-size: 13px; color: var(--sub); }
.readings { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin: 0; padding: 0; list-style: none; font-size: 13px; }
.readings li { display: flex; justify-content: space-between; padding: 10px 12px; border-radius: 12px; background: var(--soft); }
.readings .label { color: var(--sub); }
.rec-actions { display: flex; gap: 6px; }
.btn.small { height: 40px; padding: 0 14px; font-size: 14px; border-radius: 12px; }
.add { height: 48px; font-size: 15px; }
.note { display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
.note-title { font-size: 13px; font-weight: 600; color: var(--sub); }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag {
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--card);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  transition: background var(--fast) ease, color var(--fast) ease;
}
.tag.on { border-color: var(--accent); background: var(--accent); color: #fff; font-weight: 600; }
.memo {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--card);
  font-size: 15px;
  resize: none;
}
.memo:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--focus); }

.sheet-enter-active, .sheet-leave-active { transition: opacity var(--normal) ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform var(--normal) var(--ease); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(40px); }

@media (min-width: 900px) {
  .backdrop { align-items: center; }
  .sheet { border-radius: 24px; padding: 16px 20px 20px; }
  .grip { display: none; }
}
</style>
