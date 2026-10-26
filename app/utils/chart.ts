// 그래프 공용: 점들을 지나는 부드러운 곡선 SVG 경로
// 점을 지나는 부드러운 곡선 (단조 3차 보간: 점 사이에서 위아래로 튀지 않는다)
export function smoothPath(pts: { cx: number, cy: number }[]): string {
  if (pts.length < 2) return ''
  const n = pts.length
  const slope: number[] = []
  for (let k = 0; k < n - 1; k++) slope.push((pts[k + 1]!.cy - pts[k]!.cy) / (pts[k + 1]!.cx - pts[k]!.cx))
  const tan = pts.map((_, k) => (k === 0 ? slope[0]! : k === n - 1 ? slope[n - 2]! : slope[k - 1]! * slope[k]! <= 0 ? 0 : (slope[k - 1]! + slope[k]!) / 2))
  for (let k = 0; k < n - 1; k++) {
    if (slope[k] === 0) {
      tan[k] = 0
      tan[k + 1] = 0
      continue
    }
    const a = tan[k]! / slope[k]!
    const b = tan[k + 1]! / slope[k]!
    const h = a * a + b * b
    if (h > 9) {
      const t = 3 / Math.sqrt(h)
      tan[k] = t * a * slope[k]!
      tan[k + 1] = t * b * slope[k]!
    }
  }
  const f = (v: number) => v.toFixed(1)
  let d = `M${f(pts[0]!.cx)},${f(pts[0]!.cy)}`
  for (let k = 0; k < n - 1; k++) {
    const p = pts[k]!
    const q = pts[k + 1]!
    const dx = (q.cx - p.cx) / 3
    d += ` C${f(p.cx + dx)},${f(p.cy + tan[k]! * dx)} ${f(q.cx - dx)},${f(q.cy - tan[k + 1]! * dx)} ${f(q.cx)},${f(q.cy)}`
  }
  return d
}
