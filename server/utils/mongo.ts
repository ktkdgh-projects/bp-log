import { MongoClient, type Db, type IndexDescription, type ObjectId } from 'mongodb'
import type { Average, Reading, Session } from '#shared/types'

export interface UserDoc {
  _id: ObjectId
  // 로그인 아이디. 이메일로 가입했던 예전 계정은 이메일이 그대로 아이디가 된다
  username: string
  email?: string
  passwordHash: string
  nickname: string
  consent: { termsAt: Date, healthAt: Date }
  createdAt: Date
  lastSeenAt: Date
}

export interface SessionDoc {
  _id: ObjectId
  tokenHash: string
  prevTokenHash: string | null
  prevValidUntil: Date | null
  userId: ObjectId
  remember: boolean
  createdAt: Date
  lastUsedAt: Date
  rotatedAt: Date
  expiresAt: Date
}

export interface RecordDoc {
  _id: ObjectId
  userId: ObjectId
  date: string
  session: Session
  readings: Reading[]
  avg: Average
  measuredAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface NoteDoc {
  _id: ObjectId
  userId: ObjectId
  date: string
  tags: string[]
  memo: string
  updatedAt: Date
}

export interface LoginFailDoc {
  _id: string
  count: number
  lockedUntil: Date | null
  expireAt: Date
}

export interface RateLimitDoc {
  _id: string
  count: number
  expireAt: Date
}

// 서버리스 인스턴스와 dev HMR 재로드 사이에서 연결을 재사용하려고 전역에 둔다
const globalForMongo = globalThis as typeof globalThis & {
  __mongoClient?: Promise<MongoClient>
  __mongoIndexes?: Promise<void>
}

function getClient(): Promise<MongoClient> {
  if (!globalForMongo.__mongoClient) {
    const { mongoUri } = useRuntimeConfig()
    if (!mongoUri) throw new Error('NUXT_MONGO_URI가 설정되지 않았습니다')

    globalForMongo.__mongoClient = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      // 서버리스 함수가 오래 쉬다 깨면 끊긴 연결을 붙잡지 않게 놀던 연결은 정리한다
      maxIdleTimeMS: 60_000,
      // DB를 못 찾으면 기본 30초 대신 빨리 실패해서 함수 시간 초과로 번지지 않게 한다
      serverSelectionTimeoutMS: 5_000,
    })
      .connect()
      .catch((error) => {
        // 실패한 Promise를 캐시하면 이후 요청이 전부 실패하므로 비운다
        globalForMongo.__mongoClient = undefined
        throw error
      })
  }
  return globalForMongo.__mongoClient
}

// 콜드 스타트마다 돈다. 한꺼번에 보내면 연결을 6개 새로 열어(TLS·인증) 첫 요청과 연결을 다투므로 하나씩 보낸다
async function ensureIndexes(db: Db) {
  const specs: [string, IndexDescription[]][] = [
    ['users', [
      { key: { username: 1 }, unique: true },
      { key: { createdAt: 1 } },
      { key: { lastSeenAt: 1 } },
    ]],
    ['sessions', [
      { key: { tokenHash: 1 }, unique: true },
      { key: { prevTokenHash: 1 } },
      { key: { userId: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ]],
    ['records', [
      { key: { userId: 1, date: 1, session: 1 }, unique: true },
      // 운영 통계: 날짜별로 몇 명이 기록했는지
      { key: { date: 1 } },
    ]],
    ['notes', [
      { key: { userId: 1, date: 1 }, unique: true },
    ]],
    ['loginFails', [
      { key: { expireAt: 1 }, expireAfterSeconds: 0 },
    ]],
    ['rateLimits', [
      { key: { expireAt: 1 }, expireAfterSeconds: 0 },
    ]],
  ]
  for (const [name, indexes] of specs) await db.collection(name).createIndexes(indexes)
}

// DB 이름은 연결 문자열 경로(…mongodb.net/<db>)에서 가져온다
export async function useDb(): Promise<Db> {
  const db = (await getClient()).db()
  // 인덱스는 이미 있으면 그대로라서, 콜드 스타트 첫 요청이 기다리지 않게 뒤에서 맞춘다
  globalForMongo.__mongoIndexes ??= ensureIndexes(db).catch((error) => {
    globalForMongo.__mongoIndexes = undefined
    console.error('[mongo] 인덱스 생성 실패', error)
  })
  return db
}

export async function useCollections() {
  const db = await useDb()
  return {
    users: db.collection<UserDoc>('users'),
    sessions: db.collection<SessionDoc>('sessions'),
    records: db.collection<RecordDoc>('records'),
    notes: db.collection<NoteDoc>('notes'),
    loginFails: db.collection<LoginFailDoc>('loginFails'),
    rateLimits: db.collection<RateLimitDoc>('rateLimits'),
  }
}
