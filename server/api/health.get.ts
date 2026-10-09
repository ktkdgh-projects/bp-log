// DB 연결 확인용
export default defineEventHandler(async () => {
  const db = await useDb()
  await db.command({ ping: 1 })
  return { ok: true, db: db.databaseName }
})
