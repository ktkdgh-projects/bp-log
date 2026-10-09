<script setup lang="ts">
defineProps<{ title: string, updated: string }>()
const router = useRouter()
</script>

<template>
  <article class="doc">
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
.doc { display: flex; flex-direction: column; gap: 16px; }
.head { display: flex; align-items: center; gap: 10px; }
.title { font-size: 22px; font-weight: 700; }
.updated { font-size: 13px; color: var(--sub); }
.body { padding: 20px; font-size: 14px; line-height: 1.7; color: var(--text-2); }
.body :deep(h2) { margin: 20px 0 6px; font-size: 15px; color: var(--text); }
.body :deep(h2:first-child) { margin-top: 0; }
.body :deep(ul) { margin: 4px 0; padding-left: 20px; }
.body :deep(table) { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 13px; }
.body :deep(th), .body :deep(td) { padding: 8px; border: 1px solid var(--line); text-align: left; vertical-align: top; }
.body :deep(th) { background: var(--soft); color: var(--text); }
</style>
