import AppGraph from "@/components/AppGraph/AppGraph";
import ConsoleInput, { ConsoleInputHandle } from "@/components/ConsoleInput/ConsoleInput";
import { DocsOutletContext } from "@/components/DocsOverlay/DocsOverlay";
import HelpButton from "@/components/HelpButton/HelpButton";
import MidiLearnButton from "@/components/MidiLearnButton/MidiLearnButton";
import { Graph } from "@/data/Graph";
import { useGraphData } from "@/hooks/useGraphData";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMidiLearn } from "@/hooks/useMidiLearn";
import { useMousePositionRef } from "@/hooks/useMousePosition";
import { commands } from "@/lib/commands";
import { buildNode } from "@/lib/commands/node";
import { nodes } from "@/lib/commands/node/nodes";
import { MidiLearnResult } from "@/lib/midi/learn";
import { project } from "@/lib/record";
import { fuzzyFind } from "@/utils/fuzzyFind";
import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAudioGraph } from "@/hooks/useAudioGraph";
import CommandPalette from "@/components/CommandPalette/CommandPalette";
import { usePlacement } from "@/hooks/usePlacement";

import './graph-page.scss'

export default function GraphPage() {

  const [audioGraph, initialized] = useAudioGraph(project(nodes, n => n.build))
  const inputRef = useRef<ConsoleInputHandle>(null)

  const graph = useGraphData()
  const mousePositionRef = useMousePositionRef()
  const midiLearn = useMidiLearn()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const placement = usePlacement(graph.moveNode, graph.removeNode)

  const onPaletteSelect = (nodeType: string) => {
    const [node, params] = buildNode(nodeType, {
      nodeOverrides: { name: nodeType, position: mousePositionRef.current }
    })
    graph.addNode(node, params)
    setPaletteOpen(false)
    placement.start(node.id)
  }

  const onMidiLearned = ({ nodeType, paramOverrides }: MidiLearnResult) => {
    const [node, params] = buildNode(nodeType, {
      nodeOverrides: { name: nodeType, position: mousePositionRef.current },
      paramOverrides
    })
    graph.addNode(node, params)
  }

  useKeyboardShortcuts([
    [['Space'], _ => inputRef.current?.focus()],
    [['m'], () => midiLearn.start(onMidiLearned)],
    [['p'], () => setPaletteOpen(true)],
  ])

  useEffect(() => {
    if (initialized) {
      audioGraph.current.reconcile(new Graph(
        graph.nodes,
        graph.params,
        graph.edges,
      ))
    }
  }, [initialized, audioGraph, graph.nodes, graph.params, graph.edges])

  const docsContext: DocsOutletContext = {
    loadCommand: cmd => inputRef.current?.load(cmd)
  }

  const onCommand = (cmd: string) => {
    return graph.execCommand(cmd)
  }
  
  const [hints, setHints] = useState<string[]>([])
  const onInput = (input: string) => {
    if (input.length > 0) {
      graph.clearError()

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
        onMoveNodes={graph.moveNodes}
        onDeleteNode={graph.removeNode}
        onToggleConnection={graph.toggleConnection}
        onUpdateParam={graph.updateParam}
      />

      <div className="graph-page__header">
        Cécile 2.0
      </div>

      <HelpButton/>

      <MidiLearnButton
        learning={midiLearn.learning}
        start={midiLearn.start}
        cancel={midiLearn.cancel}
        onLearned={onMidiLearned}
      />

      <ConsoleInput
        ref={inputRef}
        onCommand={onCommand}
        onInput={onInput}
        hints={hints}
        error={graph.error}
      />

      {paletteOpen &&
        <CommandPalette onSelect={onPaletteSelect} onClose={() => setPaletteOpen(false)}/>
      }

      <Outlet context={docsContext}/>
    </div>
  )
}