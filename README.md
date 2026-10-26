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
- **수정 기한**: 혈압 기록과 메모·태그는 오늘·어제·그제(3일) 안에만 넣고 고치고 지울 수 있다. 서버도 막는다(`shared/utils/bp.ts`의 `EDIT_DAYS`). 지난 날짜는 기록·메모 모두 보기만 된다
- **추이**: 달별 그래프(수축기/이완기, 아침·저녁 선마다 최고·최저 점에 숫자 표시)와 그 달 아침·저녁 평균·최저·최고, 기록률. 날짜와 상관없이 오늘 기준 최근 7일 기록표·평균·지난주 대비 동향·메모 태그 비교
- **약관**: 이용약관·개인정보처리방침은 모달(휴대폰은 아래 시트)로 열고, /terms·/privacy 주소도 그대로 둔다
- **설정**: 닉네임·비밀번호 변경(다른 기기 로그아웃), 측정 가이드, 로그아웃, 탈퇴(기록 즉시 삭제)
- **운영**: `NUXT_ADMIN_USERNAMES`에 적은 아이디만 설정에서 '운영'이 보인다(`/admin`). 전체·신규 가입자, 7일·30일 접속, 오늘 기록한 사람, 누적 가입자 추이, 날마다 기록한 사람 수(30·90일). 합계만 보여 주고 개인 기록은 보여 주지 않는다. 이 아이디들은 새로 가입할 수 없다

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
├ composables/           # 화면 공용 로직: useDevice, useMe, useHome, useDay, useRecordForm, useRecordModal, useTrend, useMonthKeys(← → 달 넘기기), useAccount
├ utils/cache.ts         # 탭·달을 오갈 때 받아 둔 데이터를 먼저 보여 주고 뒤에서 새로 받기, 앞뒤 달 미리 받기
├ middleware/auth.global.ts  # 비로그인 → /login
├ layouts/               # default(모바일 하단 메뉴 / PC 사이드바), focus(입력), plain(로그인·약관)
└ pages/                 # index(달력), record, trend, settings, login, signup, terms, privacy
shared/
├ types/                 # 앱·서버 공용 타입
└ utils/                 # kst(한국 날짜), bp(등급·평균), insights(동향 계산), user(내 정보 응답)
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
- 세션 토큰은 httpOnly 쿠키, DB엔 sha256만 저장. 7일마다 토큰 교체, 다시 로그인하면 옛 세션 삭제
- 서버 렌더링 중 내부 API 호출이 세션을 또 읽지 않게 같은 인스턴스에서 5초 캐시 (로그아웃·비밀번호 변경·탈퇴 시 바로 비움)
- 로그인 잠금: 한 IP에서 같은 아이디 5번 실패 → 그 IP만 10분, IP와 상관없이 같은 아이디 20번 실패 → 아이디 전체 30분 (남이 일부러 틀려서 주인을 막는 것과 여러 IP로 나눠 하는 대입 공격 둘 다 막는다)
- 요청 제한: IP별(가입 5회/시간, 로그인 20회/분), 로그인한 사용자별(비밀번호 변경·탈퇴 10회/시간, 기록·메모 60회/분). IP는 Vercel이 넣는 `x-real-ip`로 센다
- 쓰기 요청은 같은 출처 + JSON만 허용, 본문 16KB 넘으면 거절, 128자 넘는 비밀번호는 해시 계산 전에 거절
- API 응답은 `Cache-Control: private, no-store`(건강 기록이 캐시에 남지 않게), 페이지는 `private, no-cache`
- 운영 헤더: CSP, HSTS, Permissions-Policy, X-Frame-Options, COOP, nosniff
- 로그인 뒤 돌아갈 주소(`next`)는 같은 사이트 경로만(`//`, 역슬래시, 제어 문자 막음)
- robots.txt로 AI 학습 크롤러는 전부, 일반 검색은 로그인·약관 빼고 막는다

## 배포 (Vercel)

- 프로젝트: `ktkdghs-projects-70ff8764/bp-log`, 운영 도메인 https://bp-log-six.vercel.app
- GitHub `main`에 push하면 Production, 다른 브랜치는 Preview로 자동 배포된다
- 서버 함수는 `vercel.json`에서 서울(`icn1`)로 고정한다. Atlas 클러스터가 서울(AWS ap-northeast-2)이라, 기본 지역(미국 동부)에서 돌면 DB를 오갈 때마다 태평양을 건넌다
- 환경 변수는 Vercel 프로젝트 설정에 둔다 (`NUXT_MONGO_URI` — Production·Preview·Development, Sensitive / `NUXT_ADMIN_USERNAMES` — 운영자 아이디)
- 변수를 추가하면 `.env.example`에 이름을 적고 `vercel env add <NAME> <env>`로 등록한 뒤 재배포한다
- Vercel은 고정 IP가 없어서 Atlas Network Access에 `0.0.0.0/0`이 열려 있어야 한다
- 배포 확인: `GET https://bp-log-six.vercel.app/api/health`

## 커밋 규칙

`type(scope): 간단한 설명`

예: `feat(login): 로그인 화면 추가`, `fix(api): 날짜 계산 수정`
