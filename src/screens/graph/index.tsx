import AppGraph from "@/components/AppGraph/AppGraph";
import ConsoleInput from "@/components/ConsoleInput/ConsoleInput";
import { Graph } from "@/data/Graph";
import { useGraphData } from "@/hooks/useGraphData";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { commands } from "@/lib/commands";
import { nodes } from "@/lib/commands/node/nodes";
import { project } from "@/lib/record";
import { fuzzyFind } from "@/utils/fuzzyFind";
import { useEffect, useRef, useState } from "react";
import { useAudioGraph } from "@/hooks/useAudioGraph";

import './graph-page.scss'

export default function GraphPage() {

  const [audioGraph, initialized] = useAudioGraph(project(nodes, n => n.build))
  const inputRef = useRef<HTMLInputElement>(null)

  useKeyboardShortcuts([
    [['Space'], _ => inputRef.current?.focus()]
  ])

  const graph = useGraphData()

  useEffect(() => {
    if (initialized) {
      audioGraph.current.reconcile(new Graph(
        graph.nodes,
        graph.params,
        graph.edges,
      ))
    }
  }, [graph.nodes, graph.params, graph.edges])

  const onCommand = (cmd: string) => {
    graph.execCommand(cmd)
  }
  
  const [hints, setHints] = useState<string[]>([])
  const onInput = (input: string) => {
    if (input.length > 0) {
      const tokens = input.split(/\W/)
      const tail = tokens.at(-1) ?? ''
      const head = input.length > tail.length
        ? input.slice(0, input.length - tail.length)
        : ''
      if (tail.length > 0)
        setHints(fuzzyFind(tail, commands).map(r => head + r))
      else setHints([])
    }
    else setHints([])
  }

  return (
    <div className="page graph-page">

      <AppGraph
        nodes={graph.nodes}
        params={graph.params}
        edges={graph.edges}
        onMoveNode={graph.moveNode}
        onDeleteNode={graph.removeNode}
        onToggleConnection={graph.toggleConnection}
        onUpdateParam={graph.updateParam}
      />

      <div className="graph-page__header">
        Cécile 2.0
      </div>

      <ConsoleInput
        ref={inputRef}
        onCommand={onCommand}
        onInput={onInput}
        hints={hints}
      />
    </div>
  )
}