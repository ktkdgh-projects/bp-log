<script setup lang="ts">
useHead({ title: '설정 · bp-log' })

const { me, refresh } = useMe()

const nickname = ref(me.value?.nickname ?? '')
const nickMsg = ref('')
const nickBusy = ref(false)

const current = ref('')
const next = ref('')
const pwMsg = ref('')
const pwErr = ref('')
const pwBusy = ref(false)

const withdrawOpen = ref(false)
const withdrawPw = ref('')
const withdrawErr = ref('')
const withdrawBusy = ref(false)

const joined = computed(() => (me.value ? formatDate(toKstDate(new Date(me.value.createdAt))) : ''))

async function saveNickname() {
  nickMsg.value = ''
  nickBusy.value = true
  try {
    await $fetch('/api/me', { method: 'PATCH', body: { nickname: nickname.value } })
    await refresh()
    nickMsg.value = '바꿨어요.'
  }
  catch (error) {
    nickMsg.value = errorMessage(error)
  }
  finally {
    nickBusy.value = false
  }
}

async function changePassword() {
  pwMsg.value = ''
  pwErr.value = ''
  pwBusy.value = true
  try {
    await $fetch('/api/me/password', { method: 'PUT', body: { current: current.value, next: next.value } })
    current.value = ''
    next.value = ''
    pwMsg.value = '비밀번호를 바꿨어요. 다른 기기는 로그아웃됐어요.'
  }
  catch (error) {
    pwErr.value = errorMessage(error)
  }
  finally {
    pwBusy.value = false
  }
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  me.value = null
  await navigateTo('/login')
}

async function withdraw() {
  withdrawErr.value = ''
  withdrawBusy.value = true
  try {
    await $fetch('/api/me', { method: 'DELETE', body: { password: withdrawPw.value } })
    me.value = null
    await navigateTo('/login')
  }
  catch (error) {
    withdrawErr.value = errorMessage(error)
  }
  finally {
    withdrawBusy.value = false
  }
}
</script>

<template>
  <div class="settings">
    <h1 class="title">설정</h1>

    <section class="card block profile">
      <span class="avatar"><AppIcon name="user" :size="22" /></span>
      <div>
        <b class="name">{{ me?.nickname }}</b>
        <p class="meta">{{ me?.email }} · {{ joined }} 가입</p>
      </div>
    </section>

    <div class="grid">
      <form class="card block" @submit.prevent="saveNickname">
        <h2 class="h2">닉네임</h2>
        <label class="field">
          <span class="sr-only">닉네임</span>
          <input v-model="nickname" class="input" maxlength="12" autocomplete="nickname">
        </label>
        <p v-if="nickMsg" class="msg" role="status">{{ nickMsg }}</p>
        <button type="submit" class="btn btn-soft" :disabled="nickBusy || !nickname.trim() || nickname.trim() === me?.nickname">저장</button>
      </form>

      <form class="card block" @submit.prevent="changePassword">
        <h2 class="h2">비밀번호 바꾸기</h2>
        <input type="text" class="sr-only" autocomplete="username" :value="me?.email" tabindex="-1" aria-hidden="true" readonly>
        <label class="field">
          지금 비밀번호
          <input v-model="current" class="input" type="password" autocomplete="current-password">
        </label>
        <label class="field">
          새 비밀번호 (8자 이상, 영문+숫자)
          <input v-model="next" class="input" type="password" autocomplete="new-password">
        </label>
        <p v-if="pwErr" class="error" role="alert">{{ pwErr }}</p>
        <p v-if="pwMsg" class="msg" role="status">{{ pwMsg }}</p>
        <button type="submit" class="btn btn-soft" :disabled="pwBusy || !current || !next">바꾸기</button>
      </form>
    </div>

    <section class="card block guide">
      <h2 class="h2"><AppIcon name="book" :size="18" /> 바르게 재는 법</h2>
      <ol class="steps">
        <li><b>아침</b> 일어나서 1시간 안에, 화장실 다녀온 뒤 · 아침 식사와 약 먹기 전</li>
        <li><b>저녁</b> 잠자리에 들기 직전</li>
        <li>등을 기대고 앉아 <b>5분</b> 쉬고, 팔은 심장 높이에. 재는 동안 말하지 않기</li>
        <li><b>1분 간격으로 2번</b> 재서 둘 다 넣기. 수축기 차이가 10 이상이면 한 번 더</li>
        <li>재기 30분 전에는 커피·담배·운동 피하기</li>
      </ol>
    </section>

    <section class="card block links">
      <NuxtLink to="/terms" class="link">이용약관 <AppIcon name="chevron-right" :size="16" /></NuxtLink>
      <NuxtLink to="/privacy" class="link">개인정보처리방침 <AppIcon name="chevron-right" :size="16" /></NuxtLink>
      <button type="button" class="link" @click="logout">로그아웃 <AppIcon name="logout" :size="16" /></button>
    </section>

    <section class="block danger-zone">
      <button v-if="!withdrawOpen" type="button" class="btn btn-ghost withdraw" @click="withdrawOpen = true">회원 탈퇴</button>
      <form v-else class="card block" @submit.prevent="withdraw">
        <h2 class="h2">회원 탈퇴</h2>
        <p class="warn">모든 혈압 기록과 메모가 바로 지워지고 되돌릴 수 없어요.</p>
        <label class="field">
          비밀번호 확인
          <input v-model="withdrawPw" class="input" type="password" autocomplete="current-password">
        </label>
        <p v-if="withdrawErr" class="error" role="alert">{{ withdrawErr }}</p>
        <div class="row">
          <button type="button" class="btn btn-soft" @click="withdrawOpen = false">취소</button>
          <button type="submit" class="btn btn-danger" :disabled="withdrawBusy || !withdrawPw">탈퇴하기</button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.settings { display: flex; flex-direction: column; gap: 12px; max-width: 760px; }
.title { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; padding-top: 4px; }
.block { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.profile { flex-direction: row; align-items: center; gap: 12px; }
.avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; }
.name { font-size: 17px; }
.meta { font-size: 13px; color: var(--sub); }
.grid { display: grid; gap: 12px; }
.h2 { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; }
.msg { font-size: 13px; color: var(--accent); font-weight: 600; }
.btn { height: 46px; align-self: flex-start; font-size: 15px; border-radius: 12px; }
.steps { display: flex; flex-direction: column; gap: 8px; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.55; color: var(--text-2); }
.links { gap: 0; padding: 4px 16px; }
.link { display: flex; align-items: center; justify-content: space-between; min-height: 52px; border: 0; border-bottom: 1px solid var(--soft-2); background: none; color: var(--text); font-size: 15px; text-decoration: none; text-align: left; }
.link:last-child { border-bottom: 0; }
.link:hover { color: var(--accent); }
.danger-zone { padding: 0; }
.withdraw { color: var(--mute); font-size: 14px; }
.warn { font-size: 14px; color: var(--danger); }
.row { display: flex; gap: 8px; }

@media (min-width: 720px) {
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
