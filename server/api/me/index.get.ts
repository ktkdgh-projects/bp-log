import type { MeResponse } from '#shared/types'

export default defineEventHandler((event): MeResponse => {
  const user = event.context.user
  if (!user) return { user: null }
  return {
    user: { username: user.username, nickname: user.nickname, createdAt: user.createdAt.toISOString() },
  }
})
