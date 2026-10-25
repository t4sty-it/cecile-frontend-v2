import AppGraph from "@/components/AppGraph/AppGraph";
import ConsoleInput, { ConsoleInputHandle } from "@/components/ConsoleInput/ConsoleInput";
import { DocsOutletContext } from "@/components/DocsOverlay/DocsOverlay";
import HelpButton from "@/components/HelpButton/HelpButton";
import MidiLearnButton from "@/components/MidiLearnButton/MidiLearnButton";
import PaletteButton from "@/components/PaletteButton/PaletteButton";
import { Graph } from "@/data/Graph";
import { Node } from "@/data/Node";
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
import { Fragment, useEffect, useRef, useState } from "react";
import { ancestry, isGroup, viewOf } from "@/lib/group";
import { useSelectionStore } from "@/contexts/SelectionContext";
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
  const placement = usePlacement(graph.moveNode, graph.commit, graph.revert)

  const selection = useSelectionStore()
  const [currentParentId, setCurrentParentId] = useState<string | undefined>()
  const view = viewOf(graph.nodes, graph.params, graph.edges, currentParentId)
  const path = ancestry(graph.nodes, currentParentId)

  const navigate = (parentId: string | undefined) => {
    selection.clear()
    setCurrentParentId(parentId)
  }

  const groupSelection = () => {
    const ids = selection.nodes.filter(id => view.nodes.some(n => n.id == id))
    if (ids.length == 0) return
    selection.set([graph.group(ids, currentParentId)])
  }

  const ungroupSelection = () => {
    const groups = view.nodes.filter(n => isGroup(n) && selection.nodes.includes(n.id))
    graph.ungroup(groups.map(n => n.id))
    selection.clear()
  }

  const selectAll = () => {
    selection.set(view.nodes.map(n => n.id))
  }

  const deselectAll = () => {
    selection.set([])
  }

  const deleteSelected = () => {
    graph.removeNodes(selection.nodes)
    selection.set([])
  }

  // the restored graph may lack the selected nodes or the group being viewed
  const restore = (nodes: Node[]) => {
    const ids = new Set(nodes.map(n => n.id))
    if (currentParentId !== undefined && !ids.has(currentParentId)) navigate(undefined)
    else selection.set(selection.nodes.filter(id => ids.has(id)))
  }

  const undo = () => restore(graph.undo().nodes)
  const redo = () => restore(graph.redo().nodes)

  const onPaletteSelect =(nodeType: string) => {
    const [node, params] = buildNode(nodeType, {
      nodeOverrides: { name: nodeType, position: mousePositionRef.current, parentId: currentParentId }
    })
    // one undo step from creation to drop; cancelling the placement reverts it
    graph.addNode(node, params, { draft: true })
    setPaletteOpen(false)
    placement.start(node.id)
  }

  const onMidiLearned = ({ nodeType, paramOverrides }: MidiLearnResult) => {
    const [node, params] = buildNode(nodeType, {
      nodeOverrides: { name: nodeType, position: mousePositionRef.current, parentId: currentParentId },
      paramOverrides
    })
    graph.addNode(node, params)
  }

  useKeyboardShortcuts([
    [['Space'], _ => inputRef.current?.focus()],
    [['m'], () => midiLearn.start(onMidiLearned)],
    [['p'], () => setPaletteOpen(true)],
    [['g'], groupSelection],
    [['Shift', 'g'], ungroupSelection],
    [['a'], selectAll],
    [['Shift', 'a'], deselectAll],
    [['Backspace'], deleteSelected],
    [['Delete'], deleteSelected],
    [['Control', 'z'], undo],
    [['Meta', 'z'], undo],
    [['Control', 'Shift', 'z'], redo],
    [['Meta', 'Shift', 'z'], redo],
    [['Control', 'y'], redo],
  ])

  useEffect(() => {
    if (initialized) {
      audioGraph.current.reconcile(new Graph(
        graph.nodes.filter(n => !isGroup(n)),
        graph.params,
        graph.edges,
      ))
    }
  }, [initialized, audioGraph, graph.nodes, graph.params, graph.edges])

  const docsContext: DocsOutletContext = {
    loadCommand: cmd => inputRef.current?.load(cmd)
  }

  const onCommand = (cmd: string) => {
    return graph.execCommand(cmd, currentParentId)
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
      const availableCommands = () => [...Object.keys(graph.definitions), ...commands]
      if (tail.length > 0)
        setHints(fuzzyFind(tail, availableCommands()).map(r => head + r))
      else setHints([])
    }
    else setHints([])
  }

  return (
    <div className="page graph-page">

      <AppGraph
        nodes={view.nodes}
        params={view.params}
        edges={view.edges}
        onMoveNodes={graph.moveNodes}
        onMoveNodesEnd={graph.commit}
        onDeleteNode={id => graph.removeNodes([id])}
        onToggleConnection={graph.toggleConnection}
        onUpdateParam={graph.updateParam}
        onEnterGroup={navigate}
      />

      <div className="graph-page__header">
        Cécile 2.0
      </div>

      {path.length > 0 &&
        <nav className="graph-page__breadcrumb">
          <button onClick={() => navigate(undefined)}>root</button>
          {path.map((n, idx) =>
            <Fragment key={n.id}>
              <span>/</span>
              <button
                onClick={() => navigate(n.id)}
                disabled={idx == path.length - 1}
              >
                {n.label ?? n.name}
              </button>
            </Fragment>
          )}
        </nav>
      }

      <HelpButton/>

      <MidiLearnButton
        learning={midiLearn.learning}
        start={midiLearn.start}
        cancel={midiLearn.cancel}
        onLearned={onMidiLearned}
      />

      <PaletteButton onClick={() => setPaletteOpen(true)}/>

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