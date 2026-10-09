<script setup lang="ts">
useHead({ title: '설정 · bp-log' })
const { isMobile } = useDevice()
</script>

<template>
  <MobileSettings v-if="isMobile" />
  <DesktopSettings v-else />
</template>
