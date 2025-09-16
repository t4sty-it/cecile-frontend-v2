import { useState } from "react";
import { makeStore } from "./store";

type StoreType = {
  nodes: string[]
  set: (n: string[]) => void
  add: (...nn: string[]) => void
  clear: () => void
  remove: (n: string) => void
}

export const {use: useSelectionStore, provider: SelectionProvider} = makeStore<StoreType>(() => {

  const [nodes, setNodes] = useState<string[]>([])

  const add = (...ids: string[]) => setNodes(nn => [...nn, ...ids])
  const clear = () => setNodes([])
  const remove = (id: string) => setNodes(nn => nn.filter(n => n != id))

  return {
    nodes, set: setNodes, add, clear, remove
  }
})