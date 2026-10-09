<script setup lang="ts">
// 기록 입력처럼 한 가지 일만 하는 화면: 휴대폰은 메뉴 없이 꽉 차게, PC는 사이드바를 그대로 둔다
const { isMobile } = useDevice()
</script>

<template>
  <MobilePlain v-if="isMobile"><slot /></MobilePlain>
  <DesktopShell v-else><slot /></DesktopShell>
</template>
