export type History<T> = { entries: T[], current: number }

export const init = <T>(value: T): History<T> => ({
  entries: [value],
  current: 0
})

export const navigate = <T>(h: History<T>, steps: number): History<T> =>
  (
    steps == 0 ||
    h.current == 0 && steps < 0 ||
    h.current == h.entries.length - 1 && steps > 0
  ) ? h :
  ({
    ...h,
    current: Math.max(0, Math.min(h.entries.length - 1, steps + h.current))
  })

// pushing the present value is a no-op, so committing without changes adds no step
export const push = <T>(h: History<T>, value: T): History<T> =>
  value === present(h) ? h : ({
    entries: [...h.entries.slice(0, h.current + 1), value],
    current: h.current + 1
  })

export const present = <T>(h: History<T>): T => h.entries.at(h.current)!
