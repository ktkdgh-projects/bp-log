const PUBLIC_PATHS = new Set(['/login', '/signup', '/terms', '/privacy'])
const GUEST_ONLY = new Set(['/login', '/signup'])

export default defineNuxtRouteMiddleware(async (to) => {
  const { ensure } = useMe()
  const user = await ensure()

  if (!user && !PUBLIC_PATHS.has(to.path)) {
    return navigateTo({ path: '/login', query: to.fullPath !== '/' ? { next: to.fullPath } : undefined })
  }
  if (user && GUEST_ONLY.has(to.path)) return navigateTo('/')
})
