<script setup lang="ts">
const { isMobile } = useDevice()
</script>

<template>
  <MobileShell v-if="isMobile"><slot /></MobileShell>
  <DesktopShell v-else><slot /></DesktopShell>
</template>
