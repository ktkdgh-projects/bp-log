import type { MeUser } from '#shared/types'

// 화면에 넘길 내 정보. 서버 API와 서버 렌더링(useMe)이 같이 쓴다
// isAdmin: 운영 페이지를 볼 수 있는지 (서버가 판단해서 넘긴다)
export function toMeUser(user: { username: string, nickname: string, createdAt: Date }, isAdmin = false): MeUser {
  return { username: user.username, nickname: user.nickname, createdAt: user.createdAt.toISOString(), ...(isAdmin && { isAdmin: true }) }
}
