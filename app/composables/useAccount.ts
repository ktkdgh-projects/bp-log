// 설정 화면의 닉네임·비밀번호·탈퇴 폼 상태
export function useAccount() {
  const { me, refresh, logout } = useMe()

  const nickname = ref(me.value?.nickname ?? '')
  const nickMsg = ref('')
  const nickBusy = ref(false)
  const nickDirty = computed(() => !!nickname.value.trim() && nickname.value.trim() !== me.value?.nickname)

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

  return reactive({
    me, joined, logout,
    nickname, nickMsg, nickBusy, nickDirty, saveNickname,
    current, next, pwMsg, pwErr, pwBusy, changePassword,
    withdrawOpen, withdrawPw, withdrawErr, withdrawBusy, withdraw,
  })
}
