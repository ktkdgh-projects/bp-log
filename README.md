# bp-log

아침·저녁 혈압을 기록하고 달력과 추이로 한눈에 보는 개인 혈압 기록장.

## 스택

- Nuxt 4 (Vue 3, TypeScript) — 화면과 서버 API를 한 프로젝트에서
- MongoDB Atlas — 공식 `mongodb` 드라이버로 직접 연결
- Vercel 배포

## 기능

휴대폰과 PC는 화면을 따로 그린다. 서버가 User-Agent로 고르고, PC라도 창이 768px보다 좁으면 모바일 화면으로 바꾼다. 페이지마다 스크롤 없이 한 화면에 들어가게 짠다.

- **회원**: 아이디·비밀번호·닉네임 가입 (예전 이메일 가입 계정은 이메일이 아이디), 이용약관·건강정보(민감정보) 필수 동의, 로그인 유지 30일
- **달력**: 휴대폰은 날짜마다 아침·저녁 막대를 등급 색으로, PC는 숫자까지. 날짜를 누르면 회차별 값·메모 태그(휴대폰은 아래 시트, PC는 옆 패널)
- **기록 입력**: 휴대폰은 입력 화면(화면 숫자 키패드라 휴대폰 키보드는 안 뜸), PC는 모달(입력칸에 키보드로). 시간대로 아침/저녁 자동 선택, 자릿수 차면 다음 칸, 1회차 후 1분 타이머, 수축기 차이 10 이상이면 3회차 권장
- **수정 기한**: 혈압 기록은 오늘·어제·그제(3일) 안에만 넣고 고치고 지울 수 있다. 서버도 막는다(`shared/utils/bp.ts`의 `EDIT_DAYS`). 메모·태그는 기한 없음
- **추이**: 달별 그래프(수축기/이완기, 아침·저녁 선마다 최고·최저 점에 숫자 표시)와 그 달 아침·저녁 평균·최저·최고, 기록률. 날짜와 상관없이 오늘 기준 최근 7일 기록표·평균·지난주 대비 동향·메모 태그 비교
- **약관**: 이용약관·개인정보처리방침은 모달(휴대폰은 아래 시트)로 열고, /terms·/privacy 주소도 그대로 둔다
- **설정**: 닉네임·비밀번호 변경(다른 기기 로그아웃), 측정 가이드, 로그아웃, 탈퇴(기록 즉시 삭제)

## 측정·판정 기준

- 아침(기상 1시간 내, 소변 후, 식사·약 전)·저녁(취침 직전) 각 1분 간격 2회 → 평균이 그날 값
- 혈압 분류(대한고혈압학회), 수축기·이완기 중 높은 쪽 등급

| 등급 | 기준 |
|---|---|
| 정상 | 120/80 미만 |
| 주의 | 120–129 / 80 미만 |
| 고혈압 전단계 | 130–139 또는 80–89 |
| 고혈압 1기 | 140–159 또는 90–99 |
| 고혈압 2기 | 160 또는 100 이상 |

판정 로직은 `shared/utils/bp.ts`, 동향 문구는 `shared/utils/insights.ts`.

## 실행

```bash
npm install
cp .env.example .env   # NUXT_MONGO_URI 채우기
npm run dev
```

로컬에서 운영 데이터를 건드리지 않으려면 DB 이름만 바꾼 `.env.dev`(…mongodb.net/bp-log-dev)를 만들고 `npx nuxt dev --dotenv .env.dev`로 띄운다.

DB 연결 확인: `GET /api/health` → `{ "ok": true, "db": "bp-log" }`

## 구조

```
app/
├ assets/css/            # tokens.css(색·등급색), base.css(버튼·입력 공통)
├ components/
│ ├ mobile/              # 휴대폰 화면 (Shell, Home, Calendar, DaySheet, Record, Trend, Settings, Sheet)
│ ├ desktop/             # PC 화면 (Shell, Home, Calendar, Record, RecordModal, Trend, Settings, AuthFrame)
│ └ …                    # 공용: DayDetail, TrendChart, InsightList, GradeChip, MeasureGuide …
├ composables/           # 화면 공용 로직: useDevice, useMe, useHome, useDay, useRecordForm, useRecordModal, useTrend, useAccount
├ middleware/auth.global.ts  # 비로그인 → /login
├ layouts/               # default(모바일 하단 메뉴 / PC 사이드바), focus(입력), plain(로그인·약관)
└ pages/                 # index(달력), record, trend, settings, login, signup, terms, privacy
shared/
├ types/                 # 앱·서버 공용 타입
└ utils/                 # kst(한국 날짜), bp(등급·평균), insights(동향 계산)
server/
├ middleware/auth.ts     # 다른 사이트 쓰기 요청 차단 + 세션 읽기
├ utils/                 # mongo, session, crypto(scrypt), loginLock, rateLimit, validate
└ api/
  ├ auth/                # signup, login, logout
  ├ me/                  # 내 정보, 닉네임, 비밀번호, 탈퇴
  ├ records/             # 월별 조회, 날짜 조회, 저장(PUT), 삭제
  ├ notes.put.ts         # 그날 메모·태그
  └ summary.get.ts       # 추이·동향
public/                  # 아이콘, manifest(홈 화면에 추가)
```

## 보안

- 비밀번호는 scrypt 해시만 저장, 없는 아이디도 같은 시간 걸리게 가짜 해시로 비교
- 세션 토큰은 httpOnly 쿠키, DB엔 sha256만 저장. 7일마다 토큰 교체
- 같은 아이디 5번 실패 → 10분 잠금, IP별 요청 제한(가입 5회/시간, 로그인 20회/분)
- 쓰기 요청은 같은 출처만 허용, 운영에선 CSP 헤더

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
