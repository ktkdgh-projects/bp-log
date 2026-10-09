<script setup lang="ts">
// 휴대폰 아래에서 올라오는 시트. title이 없으면 내용이 머리말을 직접 그린다 (날짜 상세)
const props = defineProps<{ open: boolean, title?: string, label?: string }>()
const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="backdrop" @click.self="emit('close')">
        <section class="sheet" role="dialog" aria-modal="true" :aria-label="title ?? label">
          <span class="grip" aria-hidden="true" />
          <header v-if="title" class="head">
            <h2 class="title">{{ title }}</h2>
            <button type="button" class="icon-btn" aria-label="닫기" @click="emit('close')"><AppIcon name="close" /></button>
          </header>
          <slot />
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; background: rgb(23 32 29 / 0.45); }
.sheet {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 560px;
  max-height: 92dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
  border-radius: 24px 24px 0 0;
  background: var(--bg);
}
.grip { align-self: center; width: 40px; height: 5px; border-radius: 3px; background: #c9cfcb; }
.head { display: flex; align-items: center; justify-content: space-between; }
.title { font-size: 19px; font-weight: 700; }
.sheet-enter-active, .sheet-leave-active { transition: opacity var(--normal) ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform var(--normal) var(--ease); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(40px); }
</style>
