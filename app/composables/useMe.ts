import type { MeResponse, MeUser } from '#shared/types'

// 라우트 미들웨어에서도 쓰므로 useFetch 대신 상태 + 요청 함수로 둔다
export function useMe() {
  const me = useState<MeUser | null | undefined>('me', () => undefined)

  async function refresh() {
    const res = await $fetch<MeResponse>('/api/me')
    me.value = res.user
    return res.user
  }

  async function ensure() {
    if (me.value !== undefined) return me.value
    // 서버 렌더링 때는 서버 미들웨어가 이미 읽어 둔 사용자를 쓴다 (/api/me를 한 번 더 부르지 않게)
    if (import.meta.server) {
      const user = useRequestEvent()?.context.user
      me.value = user ? toMeUser(user) : null
      return me.value
    }
    return await refresh()
  }

  // 로그인·가입·로그아웃·탈퇴로 사람이 바뀌면 앞 사람이 보던 기록 캐시를 비운다
  function setUser(user: MeUser | null) {
    clearUserData()
    me.value = user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    await navigateTo('/login')
  }

  return { me, refresh, ensure, setUser, logout }
}
