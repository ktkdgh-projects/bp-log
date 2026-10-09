import type { MeUser } from '#shared/types'

// 화면에 넘길 내 정보. 서버 API와 서버 렌더링(useMe)이 같이 쓴다
export function toMeUser(user: { username: string, nickname: string, createdAt: Date }): MeUser {
  return { username: user.username, nickname: user.nickname, createdAt: user.createdAt.toISOString() }
}
