import type { MeResponse } from '#shared/types'

export default defineEventHandler((event): MeResponse => {
  const user = event.context.user
  if (!user) return { user: null }
  return {
    user: { email: user.email, nickname: user.nickname, createdAt: user.createdAt.toISOString() },
  }
})
