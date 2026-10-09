<script setup lang="ts">
// PC에서 기록 버튼을 누르면 페이지를 옮기지 않고 이 모달에서 입력한다
const { state, close, saved } = useRecordModal()
const form = ref<{ dirty: boolean } | null>(null)

function tryClose() {
  if (form.value?.dirty && !confirm('입력한 값이 저장되지 않아요. 닫을까요?')) return
  close()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && state.value) {
    e.preventDefault()
    tryClose()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// 모달 뒤 화면이 같이 스크롤되지 않게
watch(() => !!state.value, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="state" class="backdrop" @mousedown.self="tryClose">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="record-title">
          <DesktopRecord ref="form" :key="`${state.date}:${state.session}`" modal :date="state.date" :session="state.session" @close="tryClose" @saved="saved" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(23 32 29 / 0.45);
}
.dialog {
  width: 100%;
  max-width: 900px;
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  padding: 24px 28px 24px;
  border-radius: 24px;
  background: var(--card);
  box-shadow: 0 24px 64px rgb(23 32 29 / 0.25);
}

.modal-enter-active, .modal-leave-active { transition: opacity var(--normal) ease; }
.modal-enter-active .dialog, .modal-leave-active .dialog { transition: transform var(--normal) var(--ease); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .dialog, .modal-leave-to .dialog { transform: translateY(12px) scale(0.98); }
</style>
