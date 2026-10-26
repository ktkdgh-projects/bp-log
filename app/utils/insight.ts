import type { InsightTone } from '#shared/types'

// 동향 문구의 성격(좋아짐·주의·경고…)마다 쓰는 아이콘과 색
export const INSIGHT_TONE: Record<InsightTone, { icon: string, bg: string, fg: string }> = {
  good: { icon: 'down', bg: 'var(--g-normal-bg)', fg: 'var(--g-normal-fg)' },
  steady: { icon: 'check', bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  caution: { icon: 'info', bg: 'var(--g-prehigh-bg)', fg: 'var(--g-prehigh-fg)' },
  up: { icon: 'up', bg: 'var(--g-stage1-bg)', fg: 'var(--g-stage1-fg)' },
  warn: { icon: 'alert', bg: 'var(--g-stage2-bg)', fg: 'var(--g-stage2-fg)' },
  info: { icon: 'pulse', bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  empty: { icon: 'plus', bg: 'var(--soft-2)', fg: 'var(--sub)' },
}
