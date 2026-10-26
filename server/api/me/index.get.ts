import type { MeResponse } from '#shared/types'

export default defineEventHandler((event): MeResponse => {
  const user = event.context.user
  return { user: user ? toMeUser(user, !!event.context.isAdmin) : null }
})
