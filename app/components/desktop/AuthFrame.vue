<script setup lang="ts">
const { openDoc } = useDocModal()
// PC 로그인·가입: 왼쪽 소개, 오른쪽 폼
const BARS = [146, 149, 144, 147, 141, 139, 142, 136, 133, 131, 127, 124, 121, 117, 119, 116]
const bars = BARS.map(v => ({ height: `${Math.round((v - 108) * 3.2)}px`, background: gradeVar(gradeOf(v, 78)) }))

const POINTS = [
  { icon: 'calendar', title: '달력에 쌓이는 기록', body: '아침·저녁 평균이 날짜마다 색으로 남아요' },
  { icon: 'trend', title: '좋아지는지 한눈에', body: '지난주와 비교해 동향을 문장으로 알려드려요' },
  { icon: 'lock', title: '내 기록은 나만', body: '비밀번호는 해시로만 저장하고 광고·분석 도구는 쓰지 않아요' },
]
</script>

<template>
  <div class="frame">
    <section class="art" aria-label="소개">
      <NuxtLink to="/login" class="brand">
        <img src="/favicon.svg" alt="" width="40" height="40">
        <span>bp-log</span>
      </NuxtLink>
      <div class="hero">
        <h1 class="headline">아침·저녁 혈압,<br>하루 30초면 기록 끝</h1>
        <div class="chart" aria-hidden="true">
          <span v-for="(b, i) in bars" :key="i" :style="b" />
        </div>
        <ul class="points">
          <li v-for="p in POINTS" :key="p.title">
            <span class="p-icon"><AppIcon :name="p.icon" :size="18" /></span>
            <span><b>{{ p.title }}</b><span>{{ p.body }}</span></span>
          </li>
        </ul>
      </div>
      <p class="legal">
        <button type="button" @click="openDoc('terms')">이용약관</button> · <button type="button" @click="openDoc('privacy')">개인정보처리방침</button>
      </p>
    </section>

    <section class="pane">
      <div class="pane-in">
        <slot />
      </div>
    </section>
  </div>
</template>

<style scoped>
.frame { flex: 1; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(440px, 1fr); min-height: 100dvh; }
.art {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 40px 56px;
  background: var(--accent-dark);
  color: #fff;
}
.brand { display: inline-flex; align-items: center; gap: 12px; color: #fff; font-size: 22px; font-weight: 700; text-decoration: none; }
.brand:hover { color: #fff; }
.hero { display: flex; flex-direction: column; gap: 32px; max-width: 520px; }
.headline { font-size: 40px; line-height: 1.25; font-weight: 700; letter-spacing: -0.03em; }
.chart { display: flex; align-items: flex-end; gap: 8px; height: 140px; padding: 16px; border-radius: 20px; background: rgb(255 255 255 / 0.07); }
.chart span { flex: 1; border-radius: 5px; }
.points { display: flex; flex-direction: column; gap: 16px; margin: 0; padding: 0; list-style: none; }
.points li { display: flex; gap: 14px; align-items: flex-start; }
.points b { display: block; font-size: 15px; }
.points li > span:last-child > span { font-size: 14px; color: rgb(255 255 255 / 0.72); }
.p-icon { flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: rgb(255 255 255 / 0.12); display: flex; align-items: center; justify-content: center; }
.legal { font-size: 13px; color: rgb(255 255 255 / 0.6); }
.legal button { padding: 0; border: 0; background: none; color: rgb(255 255 255 / 0.8); font-size: inherit; text-decoration: underline; }
.pane { display: flex; align-items: center; justify-content: center; padding: 40px; background: var(--bg); }
.pane-in { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 24px; }
</style>
