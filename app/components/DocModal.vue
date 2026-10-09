<script setup lang="ts">
// 휴대폰은 아래에서 올라오는 시트, PC는 가운데 창
const { doc, closeDoc } = useDocModal()
const { isMobile } = useDevice()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && doc.value) closeDoc()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="doc">
      <div v-if="doc" class="backdrop" :class="isMobile ? 'm' : 'd'" @click.self="closeDoc">
        <section class="box" role="dialog" aria-modal="true" :aria-label="DOC_TITLE[doc]">
          <span v-if="isMobile" class="grip" aria-hidden="true" />
          <header class="head">
            <div>
              <h2 class="title">{{ DOC_TITLE[doc] }}</h2>
              <p class="updated">시행일 {{ DOC_UPDATED }}</p>
            </div>
            <button type="button" class="icon-btn close" aria-label="닫기" @click="closeDoc"><AppIcon name="close" /></button>
          </header>
          <div class="scroll">
            <DocTerms v-if="doc === 'terms'" />
            <DocPrivacy v-else />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 70; display: flex; justify-content: center; background: rgb(23 32 29 / 0.45); }
.box { display: flex; flex-direction: column; gap: 12px; width: 100%; background: var(--card); }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.title { font-size: 20px; font-weight: 700; }
.updated { font-size: 12px; color: var(--sub); }
.close { background: var(--soft); }
.scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }

.m { align-items: flex-end; }
.m .box { max-width: 560px; height: 88dvh; padding: 10px 18px calc(16px + env(safe-area-inset-bottom)); border-radius: 24px 24px 0 0; }
.grip { align-self: center; width: 40px; height: 5px; border-radius: 3px; background: #c9cfcb; }

.d { align-items: center; padding: 32px; }
.d .box { max-width: 760px; max-height: calc(100dvh - 64px); padding: 24px 28px; border-radius: 24px; box-shadow: 0 24px 64px rgb(23 32 29 / 0.25); }
.d .title { font-size: 24px; }
.d .scroll :deep(.doc-body) { font-size: 15px; }

.doc-enter-active, .doc-leave-active { transition: opacity var(--normal) ease; }
.doc-enter-active .box, .doc-leave-active .box { transition: transform var(--normal) var(--ease); }
.doc-enter-from, .doc-leave-to { opacity: 0; }
.m.doc-enter-from .box, .m.doc-leave-to .box { transform: translateY(40px); }
.d.doc-enter-from .box, .d.doc-leave-to .box { transform: translateY(12px) scale(0.98); }
</style>
