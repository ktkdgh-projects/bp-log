<script setup lang="ts">
const route = useRoute()

const NAV = [
  { to: '/', label: '달력', icon: 'calendar' },
  { to: '/trend', label: '추이', icon: 'trend' },
  { to: '/settings', label: '설정', icon: 'settings' },
]
</script>

<template>
  <div class="shell">
    <main class="main">
      <slot />
    </main>

    <nav class="bottom" aria-label="하단 메뉴">
      <NuxtLink v-for="n in NAV" :key="n.to" :to="n.to" class="tab" :class="{ active: route.path === n.to }" :aria-current="route.path === n.to ? 'page' : undefined">
        <AppIcon :name="n.icon" :size="22" />
        {{ n.label }}
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
/* 페이지마다 한 화면: 하단 메뉴를 뺀 높이를 페이지가 나눠 쓴다 */
.shell { height: 100dvh; display: flex; flex-direction: column; }
.main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  overflow-y: auto;
  padding: calc(10px + env(safe-area-inset-top)) 16px calc(var(--nav-h) + 12px + env(safe-area-inset-bottom));
}
.main > :deep(*) { flex: 1; min-height: 0; }
.bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  height: calc(var(--nav-h) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: rgb(255 255 255 / 0.94);
  border-top: 1px solid var(--line);
  backdrop-filter: blur(12px);
}
.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--sub);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
}
.tab.active { color: var(--accent); font-weight: 700; }
</style>
