const PUBLIC_PATHS = new Set(['/login', '/signup', '/terms', '/privacy'])
const GUEST_ONLY = new Set(['/login', '/signup'])

export default defineNuxtRouteMiddleware(async (to) => {
  const { ensure } = useMe()
  const user = await ensure()

  if (!user && !PUBLIC_PATHS.has(to.path)) {
    return navigateTo({ path: '/login', query: to.fullPath !== '/' ? { next: to.fullPath } : undefined })
  }
  if (user && GUEST_ONLY.has(to.path)) return navigateTo('/')
  // 운영 페이지는 운영자만 (서버 API도 따로 막는다)
  if (to.path.startsWith('/admin') && !user?.isAdmin) return navigateTo('/')
})
