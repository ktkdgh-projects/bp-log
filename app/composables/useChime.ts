// 쉬는 시간이 끝나면 울리는 "띠링띠링" 알림음. 소리 파일 없이 브라우저에서 바로 만든다 (Web Audio)
// 브라우저는 사람이 화면을 한 번 누른 뒤에만 소리를 내 준다. plugins/chime.client.ts가 첫 터치 때 열어 둔다
let ctx: AudioContext | null = null
const STORAGE_KEY = 'bp-chime'
// 소리를 낼 수 있는 상태인지. 새로고침 직후처럼 아직 아무것도 안 누른 화면에서는 브라우저가 막아 둔다
// (브라우저에서만 바뀐다. 쉬는 시간 모달이 보고 '한 번 눌러 주세요' 안내를 띄운다)
const ready = ref(false)

export function unlockChime() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  const audio = ctx
  ready.value = audio.state === 'running'
  audio.addEventListener('statechange', () => { ready.value = audio.state === 'running' })
  // 아이폰은 첫 터치 때 소리를 한 번 내야 열린다 (들리지 않는 아주 짧은 소리)
  const buffer = ctx.createBuffer(1, 1, 22050)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.connect(ctx.destination)
  src.start(0)
}

// 맑은 종소리 한 음: 기본음에 한 옥타브 위 소리를 살짝 섞고 빠르게 울렸다가 길게 사라진다
function bell(audio: AudioContext, freq: number, start: number) {
  for (const [mult, level] of [[1, 0.24], [2, 0.06]] as const) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq * mult
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(level, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7)
    osc.connect(gain).connect(audio.destination)
    osc.start(start)
    osc.stop(start + 0.75)
  }
}

// 띠-링, 띠-링 (낮은 음에서 높은 음으로 두 번)
function ring(audio: AudioContext) {
  const t = audio.currentTime + 0.02
  for (const offset of [0, 0.45]) {
    bell(audio, 1046.5, t + offset)
    bell(audio, 1568, t + offset + 0.12)
  }
}

export function useChime() {
  // 소리 켜기/끄기는 이 기기에만 기억한다
  const enabled = useState('chime-enabled', () => {
    if (import.meta.server) return true
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'off'
    }
    catch {
      return true
    }
  })

  function toggle() {
    enabled.value = !enabled.value
    try {
      localStorage.setItem(STORAGE_KEY, enabled.value ? 'on' : 'off')
    }
    catch {
      // 저장이 막힌 브라우저면 이번만 바뀐다
    }
    // 켤 때 한 번 들려줘서 소리 크기를 알 수 있게
    play()
  }

  function play() {
    if (!enabled.value) return
    // 첫 터치 때 못 열었으면 지금 연다. 아직 아무것도 안 누른 화면이면 막혀 있다가, 한 번 누르면 풀린다
    if (!ctx) unlockChime()
    const audio = ctx
    if (!audio) return
    if (audio.state === 'running') {
      ring(audio)
      return
    }
    // 화면이 잠깐 쉬어서 멈춘 경우면 바로 깨어난다. 아직 아무것도 안 눌러서 막힌 경우는 깨어나지 않으니
    // 나중에 누르는 순간 뒤늦게 울리지 않게, 잠깐 안에 깨어날 때만 울린다
    const asked = performance.now()
    audio.resume().then(() => {
      if (performance.now() - asked < 500) ring(audio)
    }).catch(() => {})
  }

  return { enabled, ready, toggle, play }
}
