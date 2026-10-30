export function chartMaximum(values) {
  const step = Math.max(100, ...values) / 3
  const magnitude = 10 ** Math.floor(Math.log10(step))
  return Math.ceil(step / magnitude) * magnitude * 3
}

// Horizontal control points keep each curve between its two actual bucket values.
export function chartLine(points) {
  return points
    .map(([x, y], index) => {
      if (!index) return `M${x},${y}`
      const [previousX, previousY] = points[index - 1]
      const middle = (previousX + x) / 2
      return `C${middle},${previousY} ${middle},${y} ${x},${y}`
    })
    .join(' ')
}
