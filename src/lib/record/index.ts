export function project<IN, OUT>(record: Record<string, IN>, projection: (x: IN) => OUT): Record<string, OUT> {
  return Object.fromEntries(
    Object.entries(record)
      .map(([k, v]) => [k, projection(v)])
  )
}