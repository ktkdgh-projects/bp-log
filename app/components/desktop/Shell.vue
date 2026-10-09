<script setup lang="ts">
const route = useRoute()
const { me, logout } = useMe()
const slot = useSlot()
const { open } = useRecordModal()

const NAV = [
  { to: '/', label: '달력', icon: 'calendar' },
  { to: '/trend', label: '추이 · 리포트', icon: 'trend' },
  { to: '/settings', label: '설정', icon: 'settings' },
]
</script>

<template>
  <div class="shell">
    <aside class="side">
      <NuxtLink to="/" class="logo" aria-label="bp-log 홈">
        <img src="/favicon.svg" alt="" width="32" height="32">
        <span>bp-log</span>
      </NuxtLink>

      <button type="button" class="btn btn-primary btn-block record-btn" @click="open(slot.date, slot.session)">
        <AppIcon :name="slot.session === 'morning' ? 'sun' : 'moon'" :size="18" :stroke="2.2" />
        {{ SESSION_LABEL[slot.session] }} 기록하기
      </button>

      <nav class="nav" aria-label="메뉴">
        <NuxtLink v-for="n in NAV" :key="n.to" :to="n.to" class="nav-link" :class="{ active: route.path === n.to }" :aria-current="route.path === n.to ? 'page' : undefined">
          <AppIcon :name="n.icon" :size="20" />
          {{ n.label }}
        </NuxtLink>
      </nav>

      <div class="grow" />

      <div v-if="me" class="me">
        <span class="avatar"><AppIcon name="user" :size="18" /></span>
        <span class="who">
          <b>{{ me.nickname }}</b>
          <span>@{{ me.username }}</span>
        </span>
        <button type="button" class="icon-btn out" aria-label="로그아웃" title="로그아웃" @click="logout">
          <AppIcon name="logout" :size="18" />
        </button>
      </div>
    </aside>

    <main class="main">
      <div class="main-in">
        <slot />
      </div>
    </main>

    <DesktopRecordModal />
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  min-height: 100dvh;
}
.side {
  position: sticky;
  top: 0;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 16px 16px;
  background: var(--card);
  border-right: 1px solid var(--line);
}
.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  color: var(--accent);
  font-size: 19px;
  font-weight: 700;
  text-decoration: none;
}
.record-btn { height: 48px; font-size: 15px; border-radius: 14px; }
.nav { display: flex; flex-direction: column; gap: 2px; }
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  color: var(--text-2);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: background var(--fast) ease;
}
.nav-link:hover { background: var(--soft); color: var(--text); }
.nav-link.active { background: var(--accent-soft); color: var(--accent); font-weight: 700; }
.grow { flex: 1; }
.me {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 8px 4px 10px;
  border-top: 1px solid var(--line);
}
.avatar { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; }
.who { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
.who b { font-size: 14px; }
.who span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--sub); }
.out { width: 36px; height: 36px; color: var(--sub); }
/* 페이지마다 한 화면에 들어가게: 높이를 화면에 고정하고 각 페이지가 남는 높이를 나눠 쓴다 */
.main { min-width: 0; height: 100dvh; overflow-y: auto; }
.main-in {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 640px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px;
}
.main-in > :deep(*) { flex: 1; min-height: 0; }
</style>
