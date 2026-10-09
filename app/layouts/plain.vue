<script setup lang="ts">
// 로그인·약관처럼 로그인 전 화면. PC 화면 배치는 각 페이지가 직접 잡는다
const { isMobile } = useDevice()
</script>

<template>
  <MobilePlain v-if="isMobile"><slot /></MobilePlain>
  <main v-else class="desk-plain"><slot /></main>
</template>

<style scoped>
.desk-plain { min-height: 100dvh; display: flex; flex-direction: column; }
</style>
