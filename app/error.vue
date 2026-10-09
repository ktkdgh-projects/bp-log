<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
useHead({ title: notFound.value ? '페이지 없음 · bp-log' : '오류 · bp-log' })
</script>

<template>
  <main class="err">
    <img src="/favicon.svg" alt="" width="56" height="56">
    <h1>{{ notFound ? '페이지를 찾을 수 없어요' : '문제가 생겼어요' }}</h1>
    <p>{{ notFound ? '주소를 다시 확인해 주세요.' : '잠시 후 다시 시도해 주세요.' }}</p>
    <button type="button" class="btn btn-primary" @click="clearError({ redirect: '/' })">처음으로</button>
  </main>
</template>

<style scoped>
.err { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; text-align: center; }
h1 { font-size: 22px; }
p { color: var(--sub); margin-bottom: 8px; }
</style>
