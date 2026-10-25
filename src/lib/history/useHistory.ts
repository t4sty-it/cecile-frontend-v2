import { useRef, useState } from "react"
import { init, push as pushHistory, navigate as navigateHistory, present } from "."

type Push<T> = (value: React.SetStateAction<T>) => void
type Commit = () => void
type Navigate<T> = (steps: number) => T

export const useHistory = <T>(initialValue: T): [T, Push<T>, Commit, Navigate<T>] => {

  const [state, setState] = useState(initialValue)
  // tracked synchronously so push + commit in the same handler sees the pushed value
  const latest = useRef(initialValue)
  const history = useRef(init(initialValue))

  const push: Push<T> = value => {
    latest.current = value instanceof Function ? value(latest.current) : value
    setState(latest.current)
  }

  const commit: Commit = () => {
    history.current = pushHistory(history.current, latest.current)
  }

  const navigate: Navigate<T> = steps => {
    const dirty = latest.current !== present(history.current)
    // an uncommitted draft counts as the first undo step
    history.current = navigateHistory(history.current, dirty && steps < 0 ? steps + 1 : steps)
    latest.current = present(history.current)
    setState(latest.current)
    return latest.current
  }

  return [state, push, commit, navigate]
}
