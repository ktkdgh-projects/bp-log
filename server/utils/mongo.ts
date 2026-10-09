import { MongoClient, type Db } from 'mongodb'

// 서버리스 인스턴스와 dev HMR 재로드 사이에서 연결을 재사용하려고 전역에 둔다
const globalForMongo = globalThis as typeof globalThis & {
  __mongoClient?: Promise<MongoClient>
  __mongoIndexes?: Promise<void>
}

function getClient(): Promise<MongoClient> {
  if (!globalForMongo.__mongoClient) {
    const { mongoUri } = useRuntimeConfig()
    if (!mongoUri) throw new Error('NUXT_MONGO_URI가 설정되지 않았습니다')

    globalForMongo.__mongoClient = new MongoClient(mongoUri, { maxPoolSize: 10 })
      .connect()
      .catch((error) => {
        // 실패한 Promise를 캐시하면 이후 요청이 전부 실패하므로 비운다
        globalForMongo.__mongoClient = undefined
        throw error
      })
  }
  return globalForMongo.__mongoClient
}

// 컬렉션이 생기면 여기에 인덱스를 추가한다
async function ensureIndexes(_db: Db) {
  await Promise.all([])
}

// DB 이름은 연결 문자열 경로(…mongodb.net/<db>)에서 가져온다
export async function useDb(): Promise<Db> {
  const db = (await getClient()).db()
  globalForMongo.__mongoIndexes ??= ensureIndexes(db).catch((error) => {
    globalForMongo.__mongoIndexes = undefined
    throw error
  })
  await globalForMongo.__mongoIndexes
  return db
}

export async function useCollections() {
  const db = await useDb()
  return {}
}
