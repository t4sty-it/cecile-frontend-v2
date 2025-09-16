import { createContext, ReactNode, useContext } from "react"

export const makeStore = <T,>(builder: () => T) => {

  const context = createContext<T | null>(null)

  const provider = ({children}: {children: ReactNode}) => {

    const value = builder()

    return (
      <context.Provider value={value}>{children}</context.Provider>
    )
  }

  const use = () => {
    const c = useContext(context)
    if (c == null) {
      throw 'Context not initialized'
    }

    return c
  }

  return {provider, use}
}

export const crud = <T extends {id: string},>(setItems: (cb: (tt: T[]) => T[]) => void) => ({
  add: (t: T) => setItems(tt => [...tt, t]),
  remove: (id: string) => setItems(tt => tt.filter(t => t.id != id)),
  update: (t: T) => setItems(tt => tt.map(q => q.id == t.id ? t : q))
})

export type CRUD<T extends {id: string}> = {
  add: (t: T) => void
  remove: (id: string) => void
  update: (t: T) => void
}