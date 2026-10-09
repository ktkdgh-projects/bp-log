<script setup lang="ts">
useHead({ title: '달력 · bp-log' })
const { isMobile } = useDevice()
</script>

<template>
  <MobileHome v-if="isMobile" />
  <DesktopHome v-else />
</template>
