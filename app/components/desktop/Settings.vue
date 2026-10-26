<script setup lang="ts">
const a = useAccount()
const { openDoc } = useDocModal()
</script>

<template>
  <div class="settings">
    <header class="page-head">
      <h1 class="title">설정</h1>
    </header>

    <section class="card profile">
      <span class="avatar"><AppIcon name="user" :size="26" /></span>
      <div class="who">
        <b class="name">{{ a.me?.nickname }}</b>
        <p class="meta">@{{ a.me?.username }} · {{ a.joined }} 가입</p>
      </div>
      <button type="button" class="btn btn-soft" @click="a.logout"><AppIcon name="logout" :size="16" /> 로그아웃</button>
    </section>

    <div class="cols">
      <div class="col">
        <form class="card block" @submit.prevent="a.saveNickname">
          <h2 class="h2">닉네임</h2>
          <div class="inline">
            <label class="field grow">
              <span class="sr-only">닉네임</span>
              <input v-model="a.nickname" class="input" maxlength="12" autocomplete="nickname">
            </label>
            <button type="submit" class="btn btn-soft" :disabled="a.nickBusy || !a.nickDirty">저장</button>
          </div>
          <p v-if="a.nickMsg" class="msg" role="status">{{ a.nickMsg }}</p>
        </form>

        <form class="card block" @submit.prevent="a.changePassword">
          <h2 class="h2">비밀번호 바꾸기</h2>
          <input type="text" class="sr-only" autocomplete="username" :value="a.me?.username" tabindex="-1" aria-hidden="true" readonly>
          <div class="two">
            <label class="field">
              지금 비밀번호
              <input v-model="a.current" class="input" type="password" autocomplete="current-password">
            </label>
            <label class="field">
              새 비밀번호 (8자 이상, 영문+숫자)
              <input v-model="a.next" class="input" type="password" autocomplete="new-password">
            </label>
          </div>
          <p v-if="a.pwErr" class="error" role="alert">{{ a.pwErr }}</p>
          <p v-if="a.pwMsg" class="msg" role="status">{{ a.pwMsg }}</p>
          <button type="submit" class="btn btn-soft end" :disabled="a.pwBusy || !a.current || !a.next">바꾸기</button>
        </form>

        <section class="card block danger">
          <h2 class="h2">회원 탈퇴</h2>
          <p class="warn">모든 혈압 기록과 메모가 바로 지워지고 되돌릴 수 없어요.</p>
          <button v-if="!a.withdrawOpen" type="button" class="btn btn-ghost withdraw" @click="a.withdrawOpen = true">탈퇴 진행</button>
          <form v-else class="inline" @submit.prevent="a.withdraw">
            <label class="field grow">
              <span class="sr-only">비밀번호 확인</span>
              <input v-model="a.withdrawPw" class="input" type="password" autocomplete="current-password" placeholder="비밀번호 확인">
            </label>
            <button type="button" class="btn btn-soft" @click="a.withdrawOpen = false">취소</button>
            <button type="submit" class="btn btn-danger" :disabled="a.withdrawBusy || !a.withdrawPw">탈퇴하기</button>
          </form>
          <p v-if="a.withdrawErr" class="error" role="alert">{{ a.withdrawErr }}</p>
        </section>
      </div>

      <div class="col">
        <section class="card block">
          <h2 class="h2"><AppIcon name="book" :size="18" /> 바르게 재는 법</h2>
          <MeasureGuide />
        </section>
        <NuxtLink v-if="a.me?.isAdmin" to="/admin" class="card admin-link">
          <span class="admin-icon"><AppIcon name="trend" :size="20" :stroke="2.2" /></span>
          <span class="admin-text"><b>운영</b><small>가입자 수와 활동 추이를 봐요 (운영자만 보여요)</small></span>
          <AppIcon name="chevron-right" :size="18" class="go" />
        </NuxtLink>
        <section class="card links">
          <button type="button" class="link" @click="openDoc('terms')">이용약관 <AppIcon name="chevron-right" :size="16" /></button>
          <button type="button" class="link" @click="openDoc('privacy')">개인정보처리방침 <AppIcon name="chevron-right" :size="16" /></button>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings { display: flex; flex-direction: column; gap: 16px; }
.title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
.profile { display: flex; align-items: center; gap: 16px; padding: 20px 24px; }
.avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; }
.who { flex: 1; }
.name { font-size: 19px; }
.meta { font-size: 14px; color: var(--sub); }
.cols { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 16px; align-items: start; }
.col { display: flex; flex-direction: column; gap: 16px; }
.block { display: flex; flex-direction: column; gap: 12px; padding: 20px 24px; }
.h2 { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 700; }
.inline { display: flex; align-items: center; gap: 8px; }
.grow { flex: 1; }
.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.msg { font-size: 13px; color: var(--accent); font-weight: 600; }
.btn { height: 48px; font-size: 15px; border-radius: 12px; }
.end { align-self: flex-end; }
.links { display: flex; flex-direction: column; padding: 4px 24px; }
.link { width: 100%; border: 0; border-bottom: 1px solid var(--soft-2); background: none; text-align: left; display: flex; align-items: center; justify-content: space-between; min-height: 52px; border-bottom: 1px solid var(--soft-2); color: var(--text); font-size: 15px; text-decoration: none; }
.link:last-child { border-bottom: 0; }
.link:hover { color: var(--accent); }
.warn { font-size: 14px; color: var(--sub); }
/* 운영자에게만 보이는 운영 페이지 입구 */
.admin-link { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border: 1px solid var(--accent-soft); background: linear-gradient(135deg, var(--accent-soft) 0%, var(--card) 70%); color: var(--text); text-decoration: none; transition: border-color var(--fast) ease; }
.admin-link:hover { border-color: var(--accent); }
.admin-icon { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--accent); color: #fff; }
.admin-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.admin-text b { font-size: 16px; }
.admin-text small { font-size: 13px; color: var(--sub); }
.admin-link .go { color: var(--mute); }
.withdraw { align-self: flex-start; color: var(--danger); padding: 0 4px; }
</style>
