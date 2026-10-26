<script setup lang="ts">
import type { RestKind } from '~/composables/useRecordForm'

// 쉬는 시간 모달. 흐린 배경 위에 링과 남은 시간만 띄운다. 다 쉬면 '이제 재요'로 바뀐다
// settle: 재기 전 5분, between: 회차 사이 1분, retake: 두 값 차이가 커서 3회차 전 1분 (compare: 1·2회차 수축기)
const props = defineProps<{ kind: RestKind, left: number, total: number, row: number, compare?: [number, number] | null }>()
const emit = defineEmits<{ close: [], skipRetake: [] }>()

// 쉬는 동안 휴대폰 화면이 꺼지지 않게
useWakeLock()
// 다 쉬면 알림음 (켜기·끄기는 오른쪽 위 종 버튼)
const chime = useChime()
// 새로고침 직후처럼 소리가 막혀 있으면, 모달이 뜰 때 열어 보고(안 되면 그대로) 한 번 눌러 달라고 안내한다
onMounted(() => unlockChime())
const needTap = computed(() => chime.enabled.value && !chime.ready.value && !done.value)

const R = 92
const CIRCUMFERENCE = 2 * Math.PI * R
const TICKS = 60
// 4초 들이쉬고 4초 내쉰다 (CSS 숨쉬기 애니메이션 8초와 맞춘다)
const BREATH_SECONDS = 4
const BURST = 10

const done = computed(() => props.left <= 0)
const progress = computed(() => (props.total ? Math.min(1, (props.total - props.left) / props.total) : 1))
const clock = computed(() => `${Math.floor(props.left / 60)}:${String(props.left % 60).padStart(2, '0')}`)
const breathIn = computed(() => Math.floor((props.total - props.left) / BREATH_SECONDS) % 2 === 0)
const ticks = Array.from({ length: TICKS }, (_, i) => {
  const a = (i / TICKS) * 2 * Math.PI
  const r1 = i % 5 === 0 ? 103 : 106
  return { i, x1: 110 + r1 * Math.cos(a), y1: 110 + r1 * Math.sin(a), x2: 110 + 110 * Math.cos(a), y2: 110 + 110 * Math.sin(a) }
})
const passedTicks = computed(() => Math.floor(progress.value * TICKS))

const title = computed(() => {
  if (done.value) return `이제 ${props.row}회차를 재요`
  if (props.kind === 'retake') return '3회차를 재요'
  return props.kind === 'settle' ? '편히 앉아 5분 쉬어요' : `1분 쉬고 ${props.row}회차`
})
const retake = computed(() => (props.kind === 'retake' && !done.value && props.compare ? props.compare : null))

const goBtn = ref<HTMLButtonElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
watch(done, (v) => {
  if (v) nextTick(() => goBtn.value?.focus())
})

// 기록 모달(Esc로 닫힘)보다 먼저 받아서, Esc는 이 모달만 닫는다
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  e.preventDefault()
  e.stopPropagation()
  emit('close')
}
onMounted(() => {
  window.addEventListener('keydown', onKey, true)
  dialog.value?.focus()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<template>
  <Teleport to="body">
    <div ref="dialog" class="rest" :class="[kind, { done }]" role="dialog" aria-modal="true" aria-labelledby="rest-title" tabindex="-1">
      <button type="button" class="sound" :aria-pressed="chime.enabled.value" :aria-label="chime.enabled.value ? '알림음 끄기' : '알림음 켜기'" @click="chime.toggle()">
        <AppIcon :name="chime.enabled.value ? 'bell' : 'bell-off'" :size="18" :stroke="2.2" />
        {{ chime.enabled.value ? '소리 켬' : '소리 끔' }}
      </button>
      <!-- 깜빡이는 애니메이션이 끝나길 기다리지 않고 바로 사라지게 type="transition" -->
      <Transition name="fade" type="transition">
        <p v-if="needTap" class="tap-hint"><AppIcon name="bell" :size="14" :stroke="2.2" /> 화면을 한 번 눌러 주면 끝날 때 소리가 나요</p>
      </Transition>
      <Transition name="swap" mode="out-in">
        <div :key="title" class="heading">
          <h2 id="rest-title" class="title">{{ title }}</h2>
          <template v-if="retake">
            <div class="compare" :aria-label="`1회차 수축기 ${retake[0]}, 2회차 ${retake[1]}, 차이 ${Math.abs(retake[0] - retake[1])}`">
              <span class="cmp"><small>1회차</small><b>{{ retake[0] }}</b></span>
              <span class="diff" aria-hidden="true"><span class="diff-line" /><b>차이 {{ Math.abs(retake[0] - retake[1]) }}</b><span class="diff-line" /></span>
              <span class="cmp"><small>2회차</small><b>{{ retake[1] }}</b></span>
            </div>
            <p class="reason">수축기가 {{ RETAKE_GAP }} 이상 차이 나면<br>1분 쉬고 한 번 더 재서 평균을 내요</p>
          </template>
        </div>
      </Transition>

      <div class="dial">
        <template v-if="!done">
          <span class="ripple" aria-hidden="true" />
          <span class="ripple late" aria-hidden="true" />
        </template>
        <span class="breath" :class="{ still: done }" aria-hidden="true" />
        <svg viewBox="0 0 220 220" aria-hidden="true">
          <defs>
            <linearGradient id="rest-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" class="stop-a" />
              <stop offset="1" class="stop-b" />
            </linearGradient>
          </defs>
          <g class="ticks">
            <line v-for="t in ticks" :key="t.i" :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2" :class="{ on: done || t.i < passedTicks }" />
          </g>
          <circle class="track" cx="110" cy="110" :r="R" />
          <circle class="bar" cx="110" cy="110" :r="R" :stroke-dasharray="CIRCUMFERENCE" :stroke-dashoffset="CIRCUMFERENCE * (1 - progress)" />
          <g v-if="!done" class="tip" :style="{ transform: `rotate(${progress * 360}deg)` }">
            <circle cx="110" :cy="110 - R" r="12" class="tip-halo" />
            <circle cx="110" :cy="110 - R" r="6.5" class="tip-dot" />
          </g>
        </svg>
        <Transition name="swap" mode="out-in">
          <div v-if="!done" key="count" class="center">
            <b class="clock" role="timer" :aria-label="`남은 시간 ${clock}`">{{ clock }}</b>
            <Transition name="breath-text" mode="out-in">
              <span :key="String(breathIn)" class="breath-text">{{ breathIn ? '천천히 들이쉬고' : '길게 내쉬어요' }}</span>
            </Transition>
          </div>
          <div v-else key="done" class="center" role="status">
            <span class="burst" aria-hidden="true">
              <i v-for="n in BURST" :key="n" :style="{ '--a': `${(n / BURST) * 360}deg` }" />
            </span>
            <span class="check"><AppIcon name="check" :size="42" :stroke="2.8" /></span>
            <span class="breath-text">다 쉬었어요</span>
          </div>
        </Transition>
      </div>

      <div class="foot">
        <Transition name="rise" mode="out-in">
          <button v-if="done" ref="goBtn" key="go" type="button" class="go" @click="emit('close')">
            {{ row }}회차 재러 가기
            <AppIcon name="chevron-right" :size="18" :stroke="2.4" />
          </button>
          <span v-else key="skip" class="skips">
            <button type="button" class="skip" @click="emit('close')">
              {{ kind === 'retake' ? '바로 잴래요' : '건너뛰기' }}
              <AppIcon name="chevron-right" :size="16" :stroke="2.4" />
            </button>
            <button v-if="kind === 'retake'" type="button" class="skip-link" @click="emit('skipRetake')">3회차는 안 잴래요</button>
          </span>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.rest {
  --tone: #7fd3bf;
  --tone-2: #c4f0e4;
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
  background: rgb(12 22 19 / 0.72);
  backdrop-filter: blur(14px) saturate(1.2);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  color: #fff;
  text-align: center;
  outline: none;
  animation: fade-in 320ms ease both;
}
.rest.between { --tone: #8fc1f2; --tone-2: #d3e7fb; }
.rest.retake { --tone: #f3bf6b; --tone-2: #fde7c2; gap: 22px; }
.retake .dial { width: min(232px, 60vw); }
.retake .clock { font-size: 56px; }
.rest.done { --tone: #8fc1f2; --tone-2: #ffffff; }

.heading { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.sound { position: absolute; top: calc(14px + env(safe-area-inset-top)); right: 14px; display: inline-flex; align-items: center; gap: 5px; height: 36px; padding: 0 12px; border: 1px solid rgb(255 255 255 / 0.25); border-radius: 999px; background: rgb(255 255 255 / 0.08); color: rgb(255 255 255 / 0.85); font-size: 12px; font-weight: 600; }
.sound[aria-pressed="false"] { color: rgb(255 255 255 / 0.55); }
.tap-hint { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; background: rgb(255 255 255 / 0.12); color: rgb(255 255 255 / 0.85); font-size: 13px; font-weight: 600; animation: hint 1.6s ease-in-out infinite; }
@keyframes hint { 50% { background: rgb(255 255 255 / 0.2); } }
.title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; text-shadow: 0 1px 12px rgb(0 0 0 / 0.25); }
/* 3회차 안내: 두 값을 나란히, 가운데 차이 */
.compare { display: flex; align-items: center; gap: 10px; }
.cmp { display: flex; flex-direction: column; align-items: center; min-width: 76px; padding: 8px 12px; border: 1px solid rgb(255 255 255 / 0.18); border-radius: 16px; background: rgb(255 255 255 / 0.08); }
.cmp small { font-size: 12px; color: rgb(255 255 255 / 0.65); }
.cmp b { font-size: 24px; line-height: 1.2; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.diff { display: flex; align-items: center; gap: 6px; }
.diff b { padding: 4px 10px; border-radius: 999px; background: var(--tone); color: #3d2604; font-size: 13px; white-space: nowrap; }
.diff-line { width: 10px; height: 2px; border-radius: 1px; background: rgb(243 191 107 / 0.6); }
.reason { color: rgb(255 255 255 / 0.72); font-size: 14px; line-height: 1.5; }

.dial { position: relative; width: min(280px, 72vw); aspect-ratio: 1; display: grid; place-items: center; animation: zoom-in 480ms var(--ease) both; }
.dial > svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible; }
.stop-a { stop-color: var(--tone-2); }
.stop-b { stop-color: var(--tone); }
.ticks line { stroke: rgb(255 255 255 / 0.18); stroke-width: 1.6; stroke-linecap: round; transition: stroke 400ms ease; }
.ticks line.on { stroke: var(--tone); }
.track { fill: none; stroke: rgb(255 255 255 / 0.1); stroke-width: 12; }
.bar { fill: none; stroke: url(#rest-ring); stroke-width: 12; stroke-linecap: round; filter: drop-shadow(0 0 6px var(--tone)); transition: stroke-dashoffset 1s linear; }
.tip { transform-origin: 110px 110px; transition: transform 1s linear; }
.tip-halo { fill: var(--tone); animation: halo 2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.tip-dot { fill: #fff; }

/* 숨쉬기: 4초 커지고 4초 작아진다. 바깥으로 물결이 번진다 */
.breath { position: absolute; width: 62%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgb(255 255 255 / 0.16) 0%, rgb(255 255 255 / 0.05) 70%, transparent 100%); animation: breathe 8s ease-in-out infinite; }
.breath.still { animation: none; }
.ripple { position: absolute; width: 62%; aspect-ratio: 1; border-radius: 50%; border: 1.5px solid var(--tone); opacity: 0; animation: ripple 8s ease-out infinite; }
.ripple.late { animation-delay: 4s; }
@keyframes breathe {
  0%, 100% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
}
@keyframes ripple {
  0% { transform: scale(0.85); opacity: 0.5; }
  60%, 100% { transform: scale(1.3); opacity: 0; }
}
@keyframes halo {
  0%, 100% { transform: scale(1); opacity: 0.35; }
  50% { transform: scale(1.6); opacity: 0.1; }
}

.center { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.clock { font-size: 64px; font-weight: 700; line-height: 1; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; text-shadow: 0 2px 16px rgb(0 0 0 / 0.25); }
.breath-text { font-size: 15px; font-weight: 600; color: var(--tone-2); }
.check { position: relative; display: grid; place-items: center; width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, #a9d3fb, #4f8fd0); color: #fff; box-shadow: 0 0 0 8px rgb(143 193 242 / 0.18), 0 12px 32px rgb(0 0 0 / 0.3); animation: pop 520ms var(--ease) both; }
.burst { position: absolute; top: 44px; left: 50%; width: 0; height: 0; }
.burst i { position: absolute; width: 8px; height: 8px; margin: -4px; border-radius: 50%; background: var(--tone); animation: burst 760ms var(--ease) 120ms both; }
.burst i:nth-child(even) { width: 6px; height: 6px; margin: -3px; background: #f6d77b; }
@keyframes burst {
  0% { transform: rotate(var(--a)) translateY(0) scale(0.4); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: rotate(var(--a)) translateY(-78px) scale(1); opacity: 0; }
}

.foot { min-height: 96px; display: flex; align-items: center; justify-content: center; }
.skip, .go { display: inline-flex; align-items: center; justify-content: center; gap: 4px; border-radius: 999px; font-weight: 600; transition: background var(--fast) ease, transform var(--fast) ease; }
.skip { height: 48px; padding: 0 22px 0 26px; border: 1.5px solid rgb(255 255 255 / 0.4); background: rgb(255 255 255 / 0.08); color: #fff; font-size: 15px; }
.skip:hover { background: rgb(255 255 255 / 0.16); }
.skips { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.skip-link { height: 36px; padding: 0 10px; border: 0; background: none; color: rgb(255 255 255 / 0.65); font-size: 13px; text-decoration: underline; text-underline-offset: 3px; }
.skip-link:hover { color: #fff; }
.go { height: 56px; padding: 0 26px 0 30px; border: 0; background: #fff; color: #17201d; font-size: 17px; box-shadow: 0 12px 32px rgb(0 0 0 / 0.3); }
.go:hover { background: #f0f4f2; }
.skip:active, .go:active { transform: scale(0.97); }
.skip:focus-visible, .go:focus-visible { outline: 3px solid var(--tone); outline-offset: 3px; }

.swap-enter-active, .swap-leave-active { transition: opacity 200ms ease, transform 260ms var(--ease); }
.swap-enter-from, .swap-leave-to { opacity: 0; transform: scale(0.92); }
.breath-text-enter-active, .breath-text-leave-active { transition: opacity 400ms ease, transform 400ms ease; }
.breath-text-enter-from { opacity: 0; transform: translateY(4px); }
.breath-text-leave-to { opacity: 0; transform: translateY(-4px); }
.rise-enter-active, .rise-leave-active { transition: opacity 240ms ease, transform 320ms var(--ease); }
.rise-enter-from, .rise-leave-to { opacity: 0; transform: translateY(10px); }

@keyframes fade-in { from { opacity: 0; } }
@keyframes zoom-in { from { opacity: 0; transform: scale(0.9); } }
@keyframes pop {
  0% { transform: scale(0.3); opacity: 0; }
  65% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); }
}

@media (max-height: 640px) {
  .rest { gap: 18px; }
  .dial { width: min(220px, 60vw); }
  .clock { font-size: 52px; }
}
</style>
