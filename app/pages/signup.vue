<script setup lang="ts">
definePageMeta({ layout: 'plain' })
useHead({ title: '회원가입 · bp-log' })

const route = useRoute()
const { refresh } = useMe()

const email = ref('')
const password = ref('')
const password2 = ref('')
const nickname = ref('')
const agreeTerms = ref(false)
const agreeHealth = ref(false)
const busy = ref(false)
const failure = ref('')

const lenOk = computed(() => password.value.length >= 8)
const mixOk = computed(() => /[A-Za-z]/.test(password.value) && /[0-9]/.test(password.value))
const mismatch = computed(() => password2.value.length > 0 && password2.value !== password.value)
const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const valid = computed(() => emailOk.value && lenOk.value && mixOk.value && password2.value === password.value
  && !!nickname.value.trim() && agreeTerms.value && agreeHealth.value)

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
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        nickname: nickname.value,
        agreeTerms: agreeTerms.value,
        agreeHealth: agreeHealth.value,
        remember: true,
      },
    })
    password.value = ''
    password2.value = ''
    await refresh()
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
  <div class="signup">
    <header class="head">
      <NuxtLink to="/login" class="icon-btn" aria-label="로그인으로 돌아가기"><AppIcon name="chevron-left" /></NuxtLink>
      <div>
        <h1 class="title">회원가입</h1>
        <p class="sub">내 기록은 나만 볼 수 있어요.</p>
      </div>
    </header>

    <form class="form" novalidate @submit.prevent="signup">
      <p v-if="failure" class="error" role="alert">{{ failure }}</p>
      <label class="field">
        이메일
        <input v-model="email" class="input" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required>
      </label>
      <label class="field">
        비밀번호
        <input v-model="password" class="input" type="password" autocomplete="new-password" placeholder="8자 이상" required aria-describedby="pw-rules">
      </label>
      <div id="pw-rules" class="rules">
        <span :class="{ ok: lenOk }"><AppIcon name="check" :size="14" :stroke="3" /> 8자 이상</span>
        <span :class="{ ok: mixOk }"><AppIcon name="check" :size="14" :stroke="3" /> 영문 + 숫자</span>
      </div>
      <label class="field">
        비밀번호 확인
        <input v-model="password2" class="input" type="password" autocomplete="new-password" placeholder="한 번 더" :aria-invalid="mismatch" required>
        <span v-if="mismatch" class="mismatch">비밀번호가 달라요</span>
      </label>
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
          <NuxtLink to="/terms" target="_blank" class="see">보기</NuxtLink>
        </label>
        <label class="check">
          <input v-model="agreeHealth" type="checkbox">
          <span class="grow">[필수] 건강정보(혈압) 수집·이용</span>
          <NuxtLink to="/privacy" target="_blank" class="see">보기</NuxtLink>
        </label>
      </fieldset>

      <button type="submit" class="btn btn-primary btn-lg btn-block submit" :disabled="!valid || busy">
        {{ busy ? '가입 중…' : '가입하고 시작하기' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.signup { display: flex; flex-direction: column; gap: 20px; flex: 1; }
.head { display: flex; align-items: center; gap: 10px; }
.title { font-size: 22px; font-weight: 700; letter-spacing: -0.03em; }
.sub { font-size: 13px; color: var(--sub); }
.form { display: flex; flex-direction: column; gap: 12px; flex: 1; }
.rules { display: flex; gap: 14px; margin-top: -4px; font-size: 12px; font-weight: 600; color: var(--mute); }
.rules span { display: inline-flex; align-items: center; gap: 4px; }
.rules .ok { color: var(--accent); }
.mismatch { font-size: 12px; color: var(--danger); }
.agree { display: flex; flex-direction: column; margin: 4px 0 0; padding: 4px 14px; border: 0; border-radius: 16px; }
.agree .all { font-size: 15px; font-weight: 700; color: var(--text); border-bottom: 1px solid var(--soft-2); min-height: 48px; }
.grow { flex: 1; }
.see { font-size: 13px; color: var(--sub); }
.submit { margin-top: auto; }
</style>
