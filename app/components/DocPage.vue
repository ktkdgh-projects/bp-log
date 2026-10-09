<script setup lang="ts">
defineProps<{ title: string, updated: string }>()
const router = useRouter()
const { isMobile } = useDevice()
</script>

<template>
  <article class="doc" :class="{ desk: !isMobile }">
    <header class="head">
      <button type="button" class="icon-btn" aria-label="뒤로" @click="router.back()"><AppIcon name="chevron-left" /></button>
      <div>
        <h1 class="title">{{ title }}</h1>
        <p class="updated">시행일 {{ updated }}</p>
      </div>
    </header>
    <div class="card body">
      <slot />
    </div>
  </article>
</template>

<style scoped>
/* 긴 글은 본문 카드 안에서만 스크롤한다 */
.doc { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 16px; }
.head { display: flex; align-items: center; gap: 10px; }
.title { font-size: 22px; font-weight: 700; }
.updated { font-size: 13px; color: var(--sub); }
.body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px; font-size: 14px; line-height: 1.7; color: var(--text-2); }
.desk { width: 100%; height: 100dvh; max-width: 820px; margin: 0 auto; padding: 32px 24px; }
.desk .title { font-size: 28px; }
.desk .body { padding: 32px 40px; font-size: 15px; }
</style>
