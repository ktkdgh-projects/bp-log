import type { H3Event } from 'h3'
import type { ObjectId } from 'mongodb'
import type { SessionDoc, UserDoc } from './mongo'

const COOKIE_NAME = 'bp_session'
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const REMEMBER_MS = 30 * DAY_MS
const SHORT_SESSION_MS = 12 * HOUR_MS
const ROTATE_AFTER_MS = 7 * DAY_MS
// 토큰 교체 직후 같은 페이지에서 동시에 나간 요청이 옛 토큰으로 끊기지 않게 잠시 허용
const ROTATE_GRACE_MS = 60 * 1000
const TOUCH_INTERVAL_MS = HOUR_MS

// 페이지를 서버에서 그릴 때 안에서 부르는 API(/api/records, /api/summary)도 미들웨어를 다시 거쳐 같은 세션을 또 읽는다
// 같은 인스턴스에서 몇 초 안에 다시 오면 DB 대신 이걸 쓴다. 로그아웃·비밀번호 변경 등으로 세션이 바뀌면 바로 비운다
const SESSION_CACHE_MS = 5 * 1000
const SESSION_CACHE_MAX = 500
const sessionCache = new Map<string, { session: SessionDoc, user: UserDoc, until: number }>()

function cacheSession(tokenHash: string, session: SessionDoc, user: UserDoc) {
  // 5초만 쓰는 값이라 다 차면 통째로 비워도 된다
  if (sessionCache.size >= SESSION_CACHE_MAX) sessionCache.clear()
  sessionCache.set(tokenHash, { session, user, until: Date.now() + SESSION_CACHE_MS })
}

export function forgetCachedSessions() {
  sessionCache.clear()
}

declare module 'h3' {
  interface H3EventContext {
    user?: UserDoc
    session?: SessionDoc
  }
}

function setSessionCookie(event: H3Event, token: string, remember: boolean) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: remember ? REMEMBER_MS / 1000 : undefined,
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

async function dropSession(event: H3Event) {
  const session = event.context.session
  if (!session) return
  const { sessions } = await useCollections()
  await sessions.deleteOne({ _id: session._id })
  forgetCachedSessions()
  event.context.session = undefined
  event.context.user = undefined
}

// 로그아웃: 이 브라우저의 세션을 지우고 쿠키도 비운다
export async function endSession(event: H3Event) {
  await dropSession(event)
  clearSessionCookie(event)
}

export async function createSession(event: H3Event, userId: ObjectId, remember: boolean) {
  // 이 브라우저에 남아 있던 옛 세션은 지우고 새로 만든다
  const [{ sessions }] = await Promise.all([useCollections(), dropSession(event)])
  const token = randomToken()
  const now = new Date()
  await sessions.insertOne({
    tokenHash: sha256(token),
    prevTokenHash: null,
    prevValidUntil: null,
    userId,
    remember,
    createdAt: now,
    lastUsedAt: now,
    rotatedAt: now,
    expiresAt: new Date(now.getTime() + (remember ? REMEMBER_MS : SHORT_SESSION_MS)),
  } as SessionDoc)
  setSessionCookie(event, token, remember)
}

export async function loadSession(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return

  const tokenHash = sha256(token)
  const cached = sessionCache.get(tokenHash)
  if (cached && cached.until > Date.now()) {
    event.context.session = cached.session
    event.context.user = cached.user
    return
  }

  const { sessions, users } = await useCollections()
  const now = new Date()
  // 모든 요청이 거치므로 세션과 사용자를 한 번에 가져온다
  const [found] = await sessions.aggregate<SessionDoc & { user: UserDoc[] }>([
    { $match: { $or: [{ tokenHash }, { prevTokenHash: tokenHash, prevValidUntil: { $gt: now } }], expiresAt: { $gt: now } } },
    { $limit: 1 },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  ]).toArray()
  if (!found) {
    clearSessionCookie(event)
    return
  }

  const { user: [user], ...session } = found
  if (!user) {
    await sessions.deleteOne({ _id: session._id })
    clearSessionCookie(event)
    return
  }

  if (session.tokenHash === tokenHash && session.remember && now.getTime() - session.rotatedAt.getTime() > ROTATE_AFTER_MS) {
    const nextToken = randomToken()
    await sessions.updateOne({ _id: session._id }, {
      $set: {
        tokenHash: sha256(nextToken),
        prevTokenHash: tokenHash,
        prevValidUntil: new Date(now.getTime() + ROTATE_GRACE_MS),
        rotatedAt: now,
        lastUsedAt: now,
        expiresAt: new Date(now.getTime() + REMEMBER_MS),
      },
    })
    setSessionCookie(event, nextToken, true)
  }
  else if (now.getTime() - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
    await Promise.all([
      sessions.updateOne({ _id: session._id }, {
        $set: {
          lastUsedAt: now,
          ...(session.remember && { expiresAt: new Date(now.getTime() + REMEMBER_MS) }),
        },
      }),
      users.updateOne({ _id: user._id }, { $set: { lastSeenAt: now } }),
    ])
  }

  cacheSession(tokenHash, session, user)
  event.context.session = session
  event.context.user = user
}

export function requireUser(event: H3Event): UserDoc {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: '로그인이 필요해요.' })
  return user
}

export async function revokeSessions(userId: ObjectId, options: { exceptId?: ObjectId } = {}) {
  const { sessions } = await useCollections()
  await sessions.deleteMany({ userId, ...(options.exceptId && { _id: { $ne: options.exceptId } }) })
  forgetCachedSessions()
}
