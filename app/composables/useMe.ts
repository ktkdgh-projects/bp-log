import type { MeResponse, MeUser } from '#shared/types'

// 라우트 미들웨어에서도 쓰므로 useFetch 대신 상태 + 요청 함수로 둔다
export function useMe() {
  const me = useState<MeUser | null | undefined>('me', () => undefined)

  async function refresh() {
    const fetcher = import.meta.server ? useRequestFetch() : $fetch
    const res = await fetcher<MeResponse>('/api/me')
    me.value = res.user
    return res.user
  }

  async function ensure() {
    if (me.value === undefined) await refresh()
    return me.value
  }

  return { me, refresh, ensure }
}
