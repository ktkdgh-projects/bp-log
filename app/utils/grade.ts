import type { Grade } from '#shared/types'

export function gradeVar(grade: Grade, part: '' | 'bg' | 'fg' = ''): string {
  return `var(--g-${grade}${part ? `-${part}` : ''})`
}
