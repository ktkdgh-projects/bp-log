import type { NuxtApp } from '#app'

// 미리 받아 둔 지 얼마 안 된 데이터는 다시 받지 않는다 (브라우저에서만 쓴다)
const PREFETCH_FRESH_MS = 30 * 1000
const prefetchedAt = new Map<string, number>()
// 로그인한 사람이 바뀔 때마다 올린다. 바뀌기 전에 나간 미리 받기 결과는 버린다
let generation = 0

// 탭을 오갈 때 지난번에 받아 둔 데이터를 바로 보여 주고, 뒤에서 새로 받아 바꾼다
export function staleWhileRevalidate(key: string, nuxtApp: NuxtApp, ctx: { cause: string }) {
  const cached = nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
  if (nuxtApp.isHydrating) return cached
  if (cached === undefined || ctx.cause === 'refresh:hook' || ctx.cause === 'refresh:manual') return
  if (Date.now() - (prefetchedAt.get(key) ?? 0) > PREFETCH_FRESH_MS) setTimeout(() => refreshNuxtData(key))
  return cached
}

// 아직 안 본 화면의 데이터를 미리 받아 캐시에 넣는다. 그 화면을 열면 staleWhileRevalidate가 바로 꺼내 쓴다
export async function prefetchData<T>(nuxtApp: NuxtApp, key: string, load: () => Promise<T>) {
  if (nuxtApp.payload.data[key] !== undefined) return
  const gen = generation
  try {
    const data = await load()
    if (gen !== generation) return
    nuxtApp.payload.data[key] ??= data
    prefetchedAt.set(key, Date.now())
  }
  catch {
    // 미리 받기는 실패해도 그 화면을 열 때 다시 받는다
  }
}

// 기록·메모를 바꾸면 미리 받아 둔 것도 낡았으니, 다음에 열 때 뒤에서 새로 받게 한다
export function invalidatePrefetch() {
  prefetchedAt.clear()
}

// 로그인·로그아웃으로 사람이 바뀌면 앞 사람이 보던 데이터를 모두 비운다
export function clearUserData() {
  generation += 1
  prefetchedAt.clear()
  clearNuxtData()
}

export const monthKey = (month: string) => `month:${month}`
export const summaryKey = (month: string) => `summary:${month}`
