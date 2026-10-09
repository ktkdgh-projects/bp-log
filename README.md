# bp-log

## 스택

- Nuxt 4 (Vue 3, TypeScript) — 화면과 서버 API를 한 프로젝트에서
- MongoDB Atlas — 공식 `mongodb` 드라이버로 직접 연결
- Vercel 배포

## 실행

```bash
npm install
cp .env.example .env   # NUXT_MONGO_URI 채우기
npm run dev
```

DB 연결 확인: `GET /api/health` → `{ "ok": true, "db": "bp-log" }`

## 구조

```
app/
├ assets/css/tokens.css  # 색·폰트 토큰
├ assets/css/base.css
├ components/
├ composables/
├ layouts/default.vue
├ pages/index.vue
└ utils/
shared/                  # 앱·서버 공용 (타입, 유틸)
server/
├ middleware/
├ utils/mongo.ts         # 연결 재사용, 인덱스, 컬렉션
└ api/health.get.ts      # DB ping
public/
```

## 환경 변수

`.env.example`에 이름만 있다. 실제 값은 `.env`(로컬)와 Vercel 환경 변수에만 두고 커밋하지 않는다.

## 커밋 규칙

`type(scope): 간단한 설명`

예: `feat(login): 로그인 화면 추가`, `fix(api): 날짜 계산 수정`
