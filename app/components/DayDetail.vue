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
// 혈압 기록과 메모·태그는 3일이 지나면 보기만 된다 (서버도 막는다)
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
      <div class="head-text">
        <h2 class="title">{{ formatDate(date) }}</h2>
        <span v-if="dayAvg" class="avg-pill" :style="{ background: gradeVar(dayAvg.grade, 'bg'), color: gradeVar(dayAvg.grade, 'fg') }">
          하루 평균 <b>{{ dayAvg.text }}</b> · {{ GRADE_LABEL[dayAvg.grade] }}
        </span>
        <p v-else class="sub">아침·저녁 각각 2회 잰 평균이에요</p>
      </div>
      <slot name="actions" />
    </header>

    <p v-if="failure" class="error" role="alert">{{ failure }}</p>

    <div v-if="loading || !day" class="loading">불러오는 중…</div>
    <template v-else>
      <article
        v-for="s in sessions"
        :key="s.session"
        class="rec"
        :class="[s.session, { empty: !s.rec }]"
        :style="s.grade ? { '--rec-c': gradeVar(s.grade), '--rec-bg': gradeVar(s.grade, 'bg'), '--rec-fg': gradeVar(s.grade, 'fg') } : undefined"
      >
        <div class="rec-head">
          <span class="badge"><AppIcon :name="s.session === 'morning' ? 'sun' : 'moon'" :size="16" :stroke="2.2" /></span>
          <span class="rec-name">{{ SESSION_LABEL[s.session] }}</span>
          <span v-if="s.time" class="time">{{ s.time }}</span>
          <GradeChip v-if="s.grade" :grade="s.grade" class="grade" />
        </div>
        <template v-if="s.rec">
          <div class="big">
            <span class="nums">{{ s.rec.avg.sys }}<i>/</i>{{ s.rec.avg.dia }}</span>
            <span class="unit">mmHg</span>
            <span v-if="s.rec.avg.pulse" class="pulse"><AppIcon name="pulse" :size="14" :stroke="2.2" />{{ s.rec.avg.pulse }}</span>
          </div>
          <div class="foot">
            <ul class="readings" :aria-label="`${SESSION_LABEL[s.session]} 회차별 값`">
              <li v-for="(r, i) in s.rec.readings" :key="i">
                <span class="label">{{ i + 1 }}회</span>{{ r.sys }}/{{ r.dia }}<span v-if="r.pulse" class="label pulse-label">· {{ r.pulse }}</span>
              </li>
            </ul>
            <div v-if="editable" class="rec-actions">
              <component :is="wide ? 'button' : NuxtLink" v-bind="editProps(s.session)" class="act" :aria-label="`${SESSION_LABEL[s.session]} 기록 수정`" title="수정">
                <AppIcon name="edit" :size="16" />
              </component>
              <button type="button" class="act danger" :aria-label="`${SESSION_LABEL[s.session]} 기록 삭제`" title="삭제" @click="remove(s.session)">
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>
        </template>
        <component :is="wide ? 'button' : NuxtLink" v-bind="editProps(s.session)" v-else-if="editable" class="add">
          <AppIcon name="plus" :size="18" :stroke="2.4" /> {{ SESSION_LABEL[s.session] }} 기록하기
        </component>
        <p v-else class="none">기록 없음</p>
      </article>

      <section v-if="!editable" class="note readonly">
        <span class="note-title"><AppIcon name="edit" :size="14" /> 그날 메모</span>
        <div v-if="tags.length" class="tags">
          <span v-for="t in tags" :key="t" class="tag on static">{{ t }}</span>
        </div>
        <p v-if="memo" class="memo-text">{{ memo }}</p>
        <p v-if="!tags.length && !memo" class="none">메모 없음</p>
      </section>

      <section v-else class="note">
        <span class="note-title"><AppIcon name="edit" :size="14" /> 그날 메모</span>
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
            <AppIcon v-if="tags.includes(t)" name="check" :size="13" :stroke="2.8" />{{ t }}
          </button>
        </div>
        <label class="sr-only" :for="`memo-${date}`">메모</label>
        <textarea :id="`memo-${date}`" v-model="memo" class="memo" rows="2" maxlength="200" placeholder="한 줄 메모 (선택)" @blur="onMemoBlur" />
      </section>

      <p v-if="!editable" class="locked"><AppIcon name="lock" :size="14" /> {{ EDIT_DAYS }}일이 지난 날짜는 기록과 메모를 고칠 수 없어요</p>
    </template>
  </div>
</template>

<style scoped>
.detail { display: flex; flex-direction: column; gap: 12px; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.head-text { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.title { font-size: 21px; font-weight: 700; letter-spacing: -0.02em; }
.sub { font-size: 13px; color: var(--sub); }
.avg-pill { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
.avg-pill b { font-size: 15px; }
.loading { padding: 40px 0; text-align: center; color: var(--sub); }

/* 기록 카드: 왼쪽 띠와 위쪽 은은한 색이 등급을 알려 준다 */
.rec {
  --rec-c: var(--line-strong);
  --rec-bg: var(--card);
  --rec-fg: var(--text);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 14px 20px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: linear-gradient(160deg, var(--rec-bg) 0%, var(--card) 62%);
}
.rec::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 5px; background: var(--rec-c); }
.rec.empty { padding-left: 16px; border-style: dashed; border-color: var(--line-strong); background: transparent; }
.rec.empty::before { display: none; }
.rec-head { display: flex; align-items: center; gap: 8px; }
.badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 9px; }
.morning .badge { background: #fdf0d8; color: #9a5b0b; }
.evening .badge { background: #e3eef8; color: #2e6399; }
.rec-name { font-size: 15px; font-weight: 700; }
.time { font-size: 13px; color: var(--sub); }
.grade { margin-left: auto; }
.big { display: flex; align-items: baseline; gap: 6px; }
.nums { font-size: 36px; font-weight: 700; line-height: 1.1; letter-spacing: -0.03em; color: var(--rec-fg); font-variant-numeric: tabular-nums; }
.nums i { margin: 0 2px; font-style: normal; font-weight: 500; opacity: 0.45; }
.unit { font-size: 12px; color: var(--mute); }
.pulse { display: inline-flex; align-items: center; gap: 3px; align-self: center; margin-left: auto; padding: 3px 9px; border-radius: 999px; background: rgb(255 255 255 / 0.75); font-size: 13px; font-weight: 600; color: var(--text-2); }
.pulse :deep(svg) { color: #c0453a; }
.foot { display: flex; align-items: center; gap: 8px; }
.readings { flex: 1; display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.readings li { padding: 5px 10px; border-radius: 999px; background: var(--soft); font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
.readings .label { margin-right: 5px; font-weight: 500; color: var(--sub); }
.readings .pulse-label { margin: 0 0 0 4px; }
.rec-actions { display: flex; gap: 4px; }
.act { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 1px solid var(--line); border-radius: 11px; background: var(--card); color: var(--sub); text-decoration: none; transition: background var(--fast) ease, color var(--fast) ease, border-color var(--fast) ease; }
.act:hover { color: var(--accent); border-color: var(--accent); }
.act.danger:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-soft); }
.add { display: flex; align-items: center; justify-content: center; gap: 6px; height: 48px; border: 0; border-radius: 13px; background: var(--accent-soft); color: var(--accent); font-size: 15px; font-weight: 700; text-decoration: none; transition: background var(--fast) ease; }
.add:hover { background: #d6e9e3; }
.none { padding: 4px 0; font-size: 14px; color: var(--mute); }
.locked { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--mute); }

.note { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 18px; background: var(--card); }
.note-title { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--text-2); }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 13px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--card);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  transition: background var(--fast) ease, color var(--fast) ease, border-color var(--fast) ease;
}
.tag:hover:not(.on) { border-color: var(--accent); color: var(--accent); }
.tag.on { border-color: var(--accent); background: var(--accent); color: #fff; font-weight: 600; }
.tag.static { height: 30px; padding: 0 12px; border-color: var(--accent-soft); background: var(--accent-soft); color: var(--accent); }
.memo-text { padding: 10px 13px; border-radius: var(--radius-sm); background: var(--soft); font-size: 15px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.note .none { padding: 0; }
.memo {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--soft);
  font-size: 15px;
  resize: none;
  transition: background var(--fast) ease, border-color var(--fast) ease;
}
.memo:focus { outline: none; border-color: var(--accent); background: var(--card); box-shadow: 0 0 0 3px var(--focus); }

/* PC 옆 패널: 조금 촘촘하게 */
.wide { gap: 10px; }
.wide .nums { font-size: 30px; }
.wide .tag { height: 32px; padding: 0 11px; }
</style>
