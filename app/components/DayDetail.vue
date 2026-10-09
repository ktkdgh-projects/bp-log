<script setup lang="ts">
import type { MonthResponse } from '#shared/types'

// 날짜 하나의 아침·저녁 기록과 메모. 모바일은 아래 시트, 데스크톱은 옆 패널이 감싼다
// month: 달력이 들고 있는 그 달 데이터. 있으면 따로 불러오지 않는다
const props = defineProps<{ date: string, wide?: boolean, month?: MonthResponse | null }>()
const emit = defineEmits<{ changed: [] }>()

const { loading, failure, tags, memo, sessions, dayAvg, toggleTag, onMemoBlur, remove, day } = useDay(toRef(props, 'date'), () => emit('changed'), () => props.month)
// PC(wide)는 기록 모달을 띄우고, 휴대폰은 입력 페이지로 간다
const { open } = useRecordModal()
const NuxtLink = resolveComponent('NuxtLink')
// 혈압 기록은 3일이 지나면 고칠 수 없다 (메모·태그는 계속 고칠 수 있다)
const editable = computed(() => canEditRecord(props.date, kstToday()))
function editProps(session: 'morning' | 'evening') {
  return props.wide
    ? { type: 'button', onClick: () => open(props.date, session) }
    : { to: { path: '/record', query: { date: props.date, session } } }
}
</script>

<template>
  <div class="detail" :class="{ wide }">
    <header class="head">
      <div>
        <h2 class="title">{{ formatDate(date) }}</h2>
        <p class="sub">{{ dayAvg ? `하루 평균 ${dayAvg}` : '아침·저녁 2회 평균' }}</p>
      </div>
      <slot name="actions" />
    </header>

    <p v-if="failure" class="error" role="alert">{{ failure }}</p>

    <div v-if="loading || !day" class="loading">불러오는 중…</div>
    <template v-else>
      <article v-for="s in sessions" :key="s.session" class="rec">
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
          <div v-if="editable" class="rec-actions">
            <component :is="wide ? 'button' : NuxtLink" v-bind="editProps(s.session)" class="btn btn-soft small">
              <AppIcon name="edit" :size="16" /> 수정
            </component>
            <button type="button" class="btn btn-ghost small" @click="remove(s.session)">
              <AppIcon name="trash" :size="16" /> 삭제
            </button>
          </div>
        </template>
        <component :is="wide ? 'button' : NuxtLink" v-bind="editProps(s.session)" v-else-if="editable" class="btn btn-soft btn-block add">
          <AppIcon name="plus" :size="18" /> {{ SESSION_LABEL[s.session] }} 기록하기
        </component>
        <p v-else class="none">기록 없음</p>
      </article>

      <p v-if="!editable && sessions.some(x => x.rec)" class="locked"><AppIcon name="lock" :size="14" /> {{ EDIT_DAYS }}일이 지난 기록은 고칠 수 없어요</p>

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
        <label class="sr-only" :for="`memo-${date}`">메모</label>
        <textarea :id="`memo-${date}`" v-model="memo" class="memo" rows="2" maxlength="200" placeholder="한 줄 메모 (선택)" @blur="onMemoBlur" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail { display: flex; flex-direction: column; gap: 12px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.title { font-size: 20px; font-weight: 700; }
.sub { font-size: 13px; color: var(--sub); }
.loading { padding: 40px 0; text-align: center; color: var(--sub); }
.rec { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 18px; background: var(--card); }
.wide .rec { padding: 14px; background: var(--soft); }
.wide .nums { font-size: 28px; }
.wide { gap: 10px; }
.rec-head { display: flex; align-items: center; justify-content: space-between; }
.rec-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
.rec-title .morning { color: #9a5b0b; }
.rec-title .evening { color: #2e6399; }
.time { font-size: 13px; font-weight: 500; color: var(--sub); }
.big { display: flex; align-items: baseline; gap: 8px; }
.nums { font-size: 32px; font-weight: 700; letter-spacing: -0.03em; }
.pulse { font-size: 13px; color: var(--sub); }
.readings { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin: 0; padding: 0; list-style: none; font-size: 13px; }
.readings li { display: flex; justify-content: space-between; padding: 10px 12px; border-radius: 12px; background: var(--soft); }
.wide .readings li { background: var(--card); }
.readings .label { color: var(--sub); }
.rec-actions { display: flex; gap: 6px; }
.btn.small { height: 40px; padding: 0 14px; font-size: 14px; border-radius: 12px; }
.wide .btn-soft { background: var(--card); }
.wide .btn-soft:hover { background: var(--line); }
.add { height: 48px; font-size: 15px; }
.none { font-size: 14px; color: var(--mute); }
.locked { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--mute); }
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
.wide .tag { height: 34px; padding: 0 12px; }
.wide .tag:hover:not(.on) { border-color: var(--accent); color: var(--accent); }
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
</style>
