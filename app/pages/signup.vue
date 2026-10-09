<script setup lang="ts">
import type { MeUser } from '#shared/types'

definePageMeta({ layout: 'plain' })
useHead({ title: '회원가입 · bp-log' })

const route = useRoute()
const { setUser } = useMe()
const { isMobile } = useDevice()
const { openDoc } = useDocModal()
const DesktopAuthFrame = resolveComponent('DesktopAuthFrame')

const username = ref('')
const password = ref('')
const nickname = ref('')
const show = ref(false)
const agreeTerms = ref(false)
const agreeHealth = ref(false)
const busy = ref(false)
const failure = ref('')

const idOk = computed(() => /^[a-z0-9_]{4,20}$/.test(username.value.trim().toLowerCase()))
const lenOk = computed(() => password.value.length >= 8)
const mixOk = computed(() => /[A-Za-z]/.test(password.value) && /[0-9]/.test(password.value))
const valid = computed(() => idOk.value && lenOk.value && mixOk.value && !!nickname.value.trim() && agreeTerms.value && agreeHealth.value)

const all = computed({
  get: () => agreeTerms.value && agreeHealth.value,
  set: (v: boolean) => {
    agreeTerms.value = v
    agreeHealth.value = v
  },
})

async function signup() {
  if (!valid.value) return
  failure.value = ''
  busy.value = true
  try {
    const res = await $fetch<{ user: MeUser }>('/api/auth/signup', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value,
        nickname: nickname.value,
        agreeTerms: agreeTerms.value,
        agreeHealth: agreeHealth.value,
        remember: true,
      },
    })
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
  <component :is="isMobile ? 'div' : DesktopAuthFrame" :class="isMobile ? 'signup m' : 'signup d'">
    <header class="head">
      <NuxtLink v-if="isMobile" to="/login" class="icon-btn" aria-label="로그인으로 돌아가기"><AppIcon name="chevron-left" /></NuxtLink>
      <div>
        <h1 class="title">회원가입</h1>
        <p class="sub">아이디·비밀번호·닉네임만 있으면 돼요.</p>
      </div>
    </header>

    <form class="form" novalidate @submit.prevent="signup">
      <p v-if="failure" class="error" role="alert">{{ failure }}</p>
      <label class="field">
        아이디
        <input v-model="username" class="input" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="20" placeholder="영문 소문자·숫자 4–20자" required>
      </label>
      <label class="field">
        비밀번호
        <span class="pw">
          <input v-model="password" class="input" :type="show ? 'text' : 'password'" autocomplete="new-password" placeholder="8자 이상, 영문+숫자" required aria-describedby="pw-rules">
          <button type="button" class="icon-btn eye" :aria-label="show ? '비밀번호 숨기기' : '비밀번호 보기'" @click="show = !show">
            <AppIcon :name="show ? 'eye-off' : 'eye'" />
          </button>
        </span>
      </label>
      <div id="pw-rules" class="rules">
        <span :class="{ ok: idOk }"><AppIcon name="check" :size="14" :stroke="3" /> 아이디 4자 이상</span>
        <span :class="{ ok: lenOk }"><AppIcon name="check" :size="14" :stroke="3" /> 비밀번호 8자 이상</span>
        <span :class="{ ok: mixOk }"><AppIcon name="check" :size="14" :stroke="3" /> 영문 + 숫자</span>
      </div>
      <label class="field">
        닉네임
        <input v-model="nickname" class="input" type="text" autocomplete="nickname" maxlength="12" placeholder="화면에 표시돼요" required>
      </label>

      <fieldset class="agree card">
        <legend class="sr-only">약관 동의</legend>
        <label class="check all"><input v-model="all" type="checkbox"> 전체 동의</label>
        <label class="check">
          <input v-model="agreeTerms" type="checkbox">
          <span class="grow">[필수] 이용약관</span>
          <button type="button" class="see" @click.prevent="openDoc('terms')">보기</button>
        </label>
        <label class="check">
          <input v-model="agreeHealth" type="checkbox">
          <span class="grow">[필수] 건강정보(혈압) 수집·이용</span>
          <button type="button" class="see" @click.prevent="openDoc('privacy')">보기</button>
        </label>
      </fieldset>

      <button type="submit" class="btn btn-primary btn-lg btn-block submit" :disabled="!valid || busy">
        {{ busy ? '가입 중…' : '가입하고 시작하기' }}
      </button>
    </form>

    <p v-if="!isMobile" class="foot">이미 계정이 있나요? <NuxtLink :to="{ path: '/login', query: route.query.next ? { next: route.query.next } : undefined }">로그인</NuxtLink></p>
  </component>
</template>

<style scoped>
.signup.m { display: flex; flex-direction: column; gap: 16px; flex: 1; }
.head { display: flex; align-items: center; gap: 10px; }
.title { font-size: 22px; font-weight: 700; letter-spacing: -0.03em; }
.sub { font-size: 13px; color: var(--sub); }
.d .title { font-size: 28px; }
.d .sub { font-size: 15px; }
.form { display: flex; flex-direction: column; gap: 12px; flex: 1; }
.pw { position: relative; display: flex; }
.pw .input { padding-right: 52px; }
.eye { position: absolute; right: 4px; top: 4px; background: transparent; color: var(--sub); }
.rules { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: -4px; font-size: 12px; font-weight: 600; color: var(--mute); }
.rules span { display: inline-flex; align-items: center; gap: 4px; }
.rules .ok { color: var(--accent); }
.agree { display: flex; flex-direction: column; margin: 0; padding: 2px 14px; border: 0; border-radius: 16px; }
.agree .all { font-size: 15px; font-weight: 700; color: var(--text); border-bottom: 1px solid var(--soft-2); }
.grow { flex: 1; }
.see { min-height: 36px; padding: 0 4px; border: 0; background: none; font-size: 13px; color: var(--sub); text-decoration: underline; }
.m .submit { margin-top: auto; }
.d .submit { margin-top: 4px; }
.foot { display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 14px; color: var(--sub); }
.foot a { font-weight: 700; text-decoration: none; }
</style>
