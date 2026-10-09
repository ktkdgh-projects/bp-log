<template>
  <main class="plain">
    <slot />
  </main>
</template>

<style scoped>
.plain {
  height: 100dvh;
  overflow-y: auto;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: calc(12px + env(safe-area-inset-top)) 20px calc(20px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
}
</style>
