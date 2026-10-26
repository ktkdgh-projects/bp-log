<script setup lang="ts">
// 확인창. 휴대폰은 아래에서 올라오는 시트, PC는 가운데 작은 창 (useConfirm으로 띄운다)
const { state, answer } = useConfirm()
const { isMobile } = useDevice()

const cancelBtn = ref<HTMLButtonElement | null>(null)
watch(state, async (s) => {
  if (!s) return
  // 되돌릴 수 없는 일은 실수로 Enter를 눌러도 넘어가지 않게 '취소'에 둔다
  await nextTick()
  cancelBtn.value?.focus()
})

// 기록 모달·시트보다 먼저 받아서, Esc는 이 창만 닫는다
function onKey(e: KeyboardEvent) {
  if (!state.value || e.key !== 'Escape') return
  e.preventDefault()
  e.stopPropagation()
  answer(false)
}
onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<template>
  <Teleport to="body">
    <Transition :name="isMobile ? 'sheet' : 'pop'">
      <div v-if="state" class="backdrop" :class="{ mobile: isMobile }" @click.self="answer(false)">
        <section class="box" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" :aria-describedby="state.body ? 'confirm-body' : undefined">
          <span v-if="isMobile" class="grip" aria-hidden="true" />
          <span class="icon" :class="{ danger: state.danger }"><AppIcon :name="state.danger ? 'trash' : 'alert'" :size="24" :stroke="2.2" /></span>
          <h2 id="confirm-title" class="title">{{ state.title }}</h2>
          <p v-if="state.body" id="confirm-body" class="body">{{ state.body }}</p>
          <div v-if="state.preview" class="preview">
            <span class="p-label">{{ state.preview.label }}</span>
            <b class="p-value" :style="state.preview.grade ? { color: gradeVar(state.preview.grade, 'fg') } : undefined">{{ state.preview.value }}</b>
            <GradeChip v-if="state.preview.grade" :grade="state.preview.grade" size="sm" />
          </div>
          <div class="actions">
            <button ref="cancelBtn" type="button" class="btn cancel" @click="answer(false)">{{ state.cancelLabel ?? '취소' }}</button>
            <button type="button" class="btn ok" :class="{ danger: state.danger }" @click="answer(true)">{{ state.confirmLabel ?? '확인' }}</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgb(23 32 29 / 0.5); }
.box { width: 100%; max-width: 380px; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 26px 24px 20px; border-radius: 24px; background: var(--card); box-shadow: 0 24px 64px rgb(23 32 29 / 0.3); text-align: center; }
.grip { width: 40px; height: 5px; margin: -14px 0 6px; border-radius: 3px; background: #c9cfcb; }
.icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; background: var(--g-prehigh-bg); color: var(--g-prehigh-fg); }
.icon.danger { background: var(--danger-soft); color: var(--danger); }
.title { font-size: 19px; font-weight: 700; letter-spacing: -0.02em; }
.body { font-size: 14px; line-height: 1.5; color: var(--sub); }
.preview { display: flex; align-items: center; gap: 8px; margin-top: 2px; padding: 10px 16px; border-radius: 14px; background: var(--soft); }
.p-label { font-size: 13px; color: var(--sub); }
.p-value { font-size: 20px; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; margin-top: 8px; }
.actions .btn { height: 48px; border: 0; border-radius: 14px; font-size: 15px; font-weight: 700; }
.cancel { background: var(--soft-2); color: var(--text); }
.cancel:hover { background: var(--line); }
.ok { background: var(--accent); color: #fff; }
.ok:hover { background: var(--accent-dark); }
.ok.danger { background: var(--danger); }
.ok.danger:hover { background: #861e17; }

/* 휴대폰: 아래에서 올라오는 시트, 버튼은 위아래로 크게 */
.mobile { align-items: flex-end; padding: 0; }
.mobile .box { max-width: 560px; padding: 24px 20px calc(16px + env(safe-area-inset-bottom)); border-radius: 26px 26px 0 0; box-shadow: none; }
.mobile .actions { grid-template-columns: 1fr; }
.mobile .actions .btn { height: 54px; font-size: 16px; }
.mobile .ok { order: -1; }

.pop-enter-active, .pop-leave-active { transition: opacity var(--normal) ease; }
.pop-enter-active .box, .pop-leave-active .box { transition: transform var(--normal) var(--ease); }
.pop-enter-from, .pop-leave-to { opacity: 0; }
.pop-enter-from .box, .pop-leave-to .box { transform: scale(0.94); }
.sheet-enter-active, .sheet-leave-active { transition: opacity var(--normal) ease; }
.sheet-enter-active .box, .sheet-leave-active .box { transition: transform 260ms var(--ease); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .box, .sheet-leave-to .box { transform: translateY(100%); }
</style>
