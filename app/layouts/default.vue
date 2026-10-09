<script setup lang="ts">
const route = useRoute()
const { me } = useMe()

const NAV = [
  { to: '/', label: '달력', icon: 'calendar' },
  { to: '/trend', label: '추이', icon: 'trend' },
  { to: '/settings', label: '설정', icon: 'settings' },
]

// 시간대가 바뀌어도 버튼 문구가 맞도록 1분마다 다시 계산한다
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(() => (now.value = new Date()), 60_000) })
onBeforeUnmount(() => clearInterval(timer))
const slot = computed(() => defaultSlot(now.value))
</script>

<template>
  <div class="shell">
    <header class="top">
      <div class="top-in">
        <NuxtLink to="/" class="logo" aria-label="bp-log 홈">
          <img src="/favicon.svg" alt="" width="30" height="30">
          <span>bp-log</span>
        </NuxtLink>
        <nav class="top-nav" aria-label="메뉴">
          <NuxtLink v-for="n in NAV" :key="n.to" :to="n.to" class="top-link" :class="{ active: route.path === n.to }">{{ n.label }}</NuxtLink>
        </nav>
        <span class="spacer" />
        <span v-if="me" class="hello">{{ me.nickname }}님</span>
        <NuxtLink :to="{ path: '/record', query: slot }" class="btn btn-primary record-btn">
          <AppIcon name="plus" :size="18" :stroke="2.4" />
          {{ SESSION_LABEL[slot.session] }} 기록하기
        </NuxtLink>
      </div>
    </header>

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
.shell { min-height: 100dvh; display: flex; flex-direction: column; }
.top { display: none; }
.main {
  flex: 1;
  width: 100%;
  max-width: var(--page-width);
  margin: 0 auto;
  padding: calc(12px + env(safe-area-inset-top)) 16px calc(var(--nav-h) + 24px + env(safe-area-inset-bottom));
}
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
.tab:hover { color: var(--accent); }

@media (min-width: 900px) {
  .top {
    display: block;
    position: sticky;
    top: 0;
    z-index: 20;
    background: rgb(244 245 242 / 0.9);
    backdrop-filter: blur(12px);
  }
  .top-in {
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: var(--page-width);
    margin: 0 auto;
    padding: 14px 24px;
  }
  .logo { display: inline-flex; align-items: center; gap: 10px; color: var(--accent); font-size: 18px; font-weight: 700; text-decoration: none; }
  .top-nav { display: flex; gap: 4px; }
  .top-link { display: flex; align-items: center; height: 40px; padding: 0 14px; border-radius: 10px; color: var(--sub); font-size: 14px; font-weight: 500; text-decoration: none; }
  .top-link:hover { color: var(--text); background: var(--soft-2); }
  .top-link.active { background: var(--card); color: var(--text); font-weight: 700; }
  .spacer { flex: 1; }
  .hello { font-size: 14px; color: var(--sub); }
  .record-btn { height: 44px; font-size: 15px; border-radius: 12px; }
  .main { padding: 8px 24px 40px; }
  .bottom { display: none; }
}
</style>
