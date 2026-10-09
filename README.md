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

## 배포 (Vercel)

- 프로젝트: `ktkdghs-projects-70ff8764/bp-log`, 운영 도메인 https://bp-log-six.vercel.app
- GitHub `main`에 push하면 Production, 다른 브랜치는 Preview로 자동 배포된다
- 환경 변수는 Vercel 프로젝트 설정에 둔다 (`NUXT_MONGO_URI` — Production·Preview·Development, Sensitive)
- 변수를 추가하면 `.env.example`에 이름을 적고 `vercel env add <NAME> <env>`로 등록한 뒤 재배포한다
- Vercel은 고정 IP가 없어서 Atlas Network Access에 `0.0.0.0/0`이 열려 있어야 한다
- 배포 확인: `GET https://bp-log-six.vercel.app/api/health`

## 커밋 규칙

`type(scope): 간단한 설명`

예: `feat(login): 로그인 화면 추가`, `fix(api): 날짜 계산 수정`
