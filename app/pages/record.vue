<script setup lang="ts">
definePageMeta({ layout: 'focus' })
const { isMobile } = useDevice()
</script>

<template>
  <MobileRecord v-if="isMobile" />
  <DesktopRecord v-else />
</template>
