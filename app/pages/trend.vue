<script setup lang="ts">
useHead({ title: '추이 · bp-log' })
const { isMobile } = useDevice()
</script>

<template>
  <MobileTrend v-if="isMobile" />
  <DesktopTrend v-else />
</template>
