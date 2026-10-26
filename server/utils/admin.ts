import type { H3Event } from 'h3'

// 운영자: NUXT_ADMIN_USERNAMES에 적힌 아이디 (쉼표로 여러 개)
// 이 아이디들은 새로 가입할 수 없게 막는다 (아직 없는 아이디를 적어 두면 남이 먼저 가입해 운영자가 되는 걸 막으려고)
// 환경 변수는 실행 중에 바뀌지 않으니 처음 한 번만 읽는다
let admins: Set<string> | undefined
export function adminUsernames(): Set<string> {
  admins ??= new Set(String(useRuntimeConfig().adminUsernames ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean))
  return admins
}

export function isAdminUser(user: { username: string } | null | undefined): boolean {
  return !!user && adminUsernames().has(user.username)
}

// 운영 API: 운영자가 아니면 있는지도 모르게 404 (운영자인지는 세션을 읽을 때 context.isAdmin에 적어 둔다)
export function requireAdmin(event: H3Event) {
  const user = requireUser(event)
  if (!event.context.isAdmin) throw createError({ statusCode: 404, message: '찾을 수 없어요.' })
  return user
}
