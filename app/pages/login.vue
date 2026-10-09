<script setup lang="ts">
import type { MeUser } from '#shared/types'

definePageMeta({ layout: 'plain' })
useHead({ title: '로그인 · bp-log' })

const route = useRoute()
const { setUser } = useMe()
const { isMobile } = useDevice()
const DesktopAuthFrame = resolveComponent('DesktopAuthFrame')

const username = ref('')
const password = ref('')
const remember = ref(true)
const show = ref(false)
const busy = ref(false)
const failure = ref('')

// 모바일 소개용 막대: 혈압이 내려가는 모양
const BARS = [146, 149, 144, 147, 141, 139, 142, 136, 133, 131, 127, 124, 121, 117]
const bars = BARS.map(v => ({ height: `${Math.round((v - 112) * 1.3)}px`, background: gradeVar(gradeOf(v, 78)) }))

async function login() {
  failure.value = ''
  busy.value = true
  try {
    const res = await $fetch<{ user: MeUser }>('/api/auth/login', { method: 'POST', body: { username: username.value, password: password.value, remember: remember.value } })
    password.value = ''
    setUser(res.user)
    await navigateTo(safeNext(route.query.next))
  }
  catch (error) {
    failure.value = errorMessage(error)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <component :is="isMobile ? 'div' : DesktopAuthFrame" :class="isMobile ? 'auth m' : 'auth d'">
    <section v-if="isMobile" class="intro" aria-label="소개">
      <div class="brand">
        <img src="/favicon.svg" alt="" width="40" height="40">
        <span>bp-log</span>
      </div>
      <h1 class="headline">아침·저녁 혈압,<br>하루 30초면 기록 끝</h1>
      <div class="bars" aria-hidden="true">
        <span v-for="(b, i) in bars" :key="i" :style="b" />
      </div>
      <p class="lead">달력에 쌓이고, 좋아지는지 한눈에 보여드려요.</p>
    </section>
    <header v-else class="d-head">
      <h2 class="d-title">로그인</h2>
      <p class="d-sub">다시 오셨네요. 오늘 혈압도 기록해 볼까요?</p>
    </header>

    <form class="form" novalidate @submit.prevent="login">
      <p v-if="failure" class="error" role="alert">{{ failure }}</p>
      <label class="field">
        아이디
        <input v-model="username" class="input" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="아이디" required>
      </label>
      <label class="field">
        비밀번호
        <span class="pw">
          <input v-model="password" class="input" :type="show ? 'text' : 'password'" autocomplete="current-password" placeholder="비밀번호" required>
          <button type="button" class="icon-btn eye" :aria-label="show ? '비밀번호 숨기기' : '비밀번호 보기'" @click="show = !show">
            <AppIcon :name="show ? 'eye-off' : 'eye'" />
          </button>
        </span>
      </label>
      <label class="check">
        <input v-model="remember" type="checkbox">
        로그인 상태 유지 (30일)
      </label>
      <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="busy || !username || !password">
        {{ busy ? '로그인 중…' : '로그인' }}
      </button>
    </form>

    <p class="foot">
      처음이세요?
      <NuxtLink :to="{ path: '/signup', query: route.query.next ? { next: route.query.next } : undefined }">회원가입</NuxtLink>
    </p>
  </component>
</template>

<style scoped>
.auth.m { flex: 1; display: flex; flex-direction: column; }
.intro { display: flex; flex-direction: column; gap: 20px; padding: 48px 4px 32px; }
.brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 700; }
.headline { font-size: 30px; line-height: 1.3; font-weight: 700; letter-spacing: -0.03em; }
.bars { display: flex; align-items: flex-end; gap: 6px; height: 52px; }
.bars span { flex: 1; border-radius: 4px; }
.lead { font-size: 15px; color: var(--text-2); }
.d-title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
.d-sub { font-size: 15px; color: var(--sub); }
.form { display: flex; flex-direction: column; gap: 12px; }
.pw { position: relative; display: flex; }
.pw .input { padding-right: 52px; }
.eye { position: absolute; right: 4px; top: 4px; background: transparent; color: var(--sub); }
.foot { display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 14px; color: var(--sub); }
.m .foot { margin-top: auto; padding-top: 28px; }
.foot a { display: inline-flex; align-items: center; min-height: 44px; font-weight: 700; text-decoration: none; }
</style>
