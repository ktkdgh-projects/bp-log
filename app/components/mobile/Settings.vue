<script setup lang="ts">
// 한 화면에 들어가게 목록만 두고, 고치는 건 아래 시트에서
const a = useAccount()
const { openDoc } = useDocModal()
const sheet = ref<'nickname' | 'password' | 'guide' | 'withdraw' | null>(null)

watch(sheet, () => {
  a.nickMsg = ''
  a.pwMsg = ''
  a.pwErr = ''
  a.withdrawErr = ''
})
</script>

<template>
  <div class="settings">
    <h1 class="title">설정</h1>

    <section class="card profile">
      <span class="avatar"><AppIcon name="user" :size="22" /></span>
      <div>
        <b class="name">{{ a.me?.nickname }}</b>
        <p class="meta">@{{ a.me?.username }} · {{ a.joined }} 가입</p>
      </div>
    </section>

    <NuxtLink v-if="a.me?.isAdmin" to="/admin" class="card admin-link">
      <span class="admin-icon"><AppIcon name="trend" :size="18" :stroke="2.2" /></span>
      <span class="admin-text"><b>운영</b><small>가입자·활동 추이</small></span>
      <AppIcon name="chevron-right" :size="18" class="go" />
    </NuxtLink>

    <section class="card list">
      <button type="button" class="item" @click="sheet = 'nickname'"><AppIcon name="user" :size="18" /> 닉네임 바꾸기 <AppIcon name="chevron-right" :size="16" class="go" /></button>
      <button type="button" class="item" @click="sheet = 'password'"><AppIcon name="lock" :size="18" /> 비밀번호 바꾸기 <AppIcon name="chevron-right" :size="16" class="go" /></button>
      <button type="button" class="item" @click="sheet = 'guide'"><AppIcon name="book" :size="18" /> 바르게 재는 법 <AppIcon name="chevron-right" :size="16" class="go" /></button>
    </section>

    <section class="card list">
      <button type="button" class="item" @click="openDoc('terms')"><AppIcon name="info" :size="18" /> 이용약관 <AppIcon name="chevron-right" :size="16" class="go" /></button>
      <button type="button" class="item" @click="openDoc('privacy')"><AppIcon name="lock" :size="18" /> 개인정보처리방침 <AppIcon name="chevron-right" :size="16" class="go" /></button>
      <button type="button" class="item" @click="a.logout"><AppIcon name="logout" :size="18" /> 로그아웃</button>
    </section>

    <button type="button" class="withdraw" @click="sheet = 'withdraw'">회원 탈퇴</button>

    <MobileSheet :open="sheet === 'nickname'" title="닉네임 바꾸기" @close="sheet = null">
      <form class="form" @submit.prevent="a.saveNickname">
        <label class="field">
          <span class="sr-only">닉네임</span>
          <input v-model="a.nickname" class="input" maxlength="12" autocomplete="nickname">
        </label>
        <p v-if="a.nickMsg" class="msg" role="status">{{ a.nickMsg }}</p>
        <button type="submit" class="btn btn-primary btn-block" :disabled="a.nickBusy || !a.nickDirty">저장</button>
      </form>
    </MobileSheet>

    <MobileSheet :open="sheet === 'password'" title="비밀번호 바꾸기" @close="sheet = null">
      <form class="form" @submit.prevent="a.changePassword">
        <input type="text" class="sr-only" autocomplete="username" :value="a.me?.username" tabindex="-1" aria-hidden="true" readonly>
        <label class="field">
          지금 비밀번호
          <input v-model="a.current" class="input" type="password" autocomplete="current-password">
        </label>
        <label class="field">
          새 비밀번호 (8자 이상, 영문+숫자)
          <input v-model="a.next" class="input" type="password" autocomplete="new-password">
        </label>
        <p v-if="a.pwErr" class="error" role="alert">{{ a.pwErr }}</p>
        <p v-if="a.pwMsg" class="msg" role="status">{{ a.pwMsg }}</p>
        <button type="submit" class="btn btn-primary btn-block" :disabled="a.pwBusy || !a.current || !a.next">바꾸기</button>
      </form>
    </MobileSheet>

    <MobileSheet :open="sheet === 'guide'" title="바르게 재는 법" @close="sheet = null">
      <div class="card guide"><MeasureGuide /></div>
    </MobileSheet>

    <MobileSheet :open="sheet === 'withdraw'" title="회원 탈퇴" @close="sheet = null">
      <form class="form" @submit.prevent="a.withdraw">
        <p class="warn">모든 혈압 기록과 메모가 바로 지워지고 되돌릴 수 없어요.</p>
        <label class="field">
          비밀번호 확인
          <input v-model="a.withdrawPw" class="input" type="password" autocomplete="current-password">
        </label>
        <p v-if="a.withdrawErr" class="error" role="alert">{{ a.withdrawErr }}</p>
        <button type="submit" class="btn btn-danger btn-block" :disabled="a.withdrawBusy || !a.withdrawPw">탈퇴하기</button>
      </form>
    </MobileSheet>
  </div>
</template>

<style scoped>
.settings { display: flex; flex-direction: column; gap: 12px; }
.title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
.profile { display: flex; align-items: center; gap: 12px; padding: 16px; }
.avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; }
.name { font-size: 17px; }
.meta { font-size: 13px; color: var(--sub); }
.list { display: flex; flex-direction: column; padding: 2px 16px; }
.item { display: flex; align-items: center; gap: 12px; min-height: 54px; border: 0; border-bottom: 1px solid var(--soft-2); background: none; color: var(--text); font-size: 15px; text-decoration: none; text-align: left; }
.item:last-child { border-bottom: 0; }
.item :first-child { color: var(--sub); }
.go { margin-left: auto; color: var(--mute); }
/* 운영자에게만 보이는 운영 페이지 입구 */
.admin-link { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid var(--accent-soft); background: linear-gradient(135deg, var(--accent-soft) 0%, var(--card) 70%); color: var(--text); text-decoration: none; }
.admin-icon { display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: 11px; background: var(--accent); color: #fff; }
.admin-text { display: flex; flex-direction: column; }
.admin-text b { font-size: 15px; }
.admin-text small { font-size: 12px; color: var(--sub); }
.withdraw { align-self: center; min-height: 44px; padding: 0 12px; border: 0; background: none; color: var(--mute); font-size: 13px; }
.form { display: flex; flex-direction: column; gap: 12px; }
.msg { font-size: 13px; color: var(--accent); font-weight: 600; }
.warn { font-size: 14px; color: var(--danger); }
.guide { padding: 16px; }
</style>
