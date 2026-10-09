import { MongoServerError } from 'mongodb'
import type { UserDoc } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  await rateLimit(event, 'signup', 5, 60 * 60)

  const body = await readBody<Record<string, unknown>>(event)
  if (body?.agreeTerms !== true || body?.agreeHealth !== true) {
    throw createError({ statusCode: 400, message: '필수 항목에 모두 동의해야 가입할 수 있어요.' })
  }
  const username = readUsername(body.username)
  const password = readPassword(body.password)
  const nickname = readNickname(body.nickname)

  const { users } = await useCollections()
  const now = new Date()
  const doc = {
    username,
    passwordHash: await hashPassword(password),
    nickname,
    consent: { termsAt: now, healthAt: now },
    createdAt: now,
    lastSeenAt: now,
  } as UserDoc

  try {
    const { insertedId } = await users.insertOne(doc)
    await createSession(event, insertedId, body.remember !== false)
    return { ok: true, user: toMeUser(doc) }
  }
  catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw createError({ statusCode: 409, message: '이미 쓰고 있는 아이디예요. 다른 아이디를 골라 주세요.' })
    }
    throw error
  }
})
