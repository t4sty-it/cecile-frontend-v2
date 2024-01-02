import './App.scss'
import AppGraph from './components/AppGraph/AppGraph'

import { useEffect, useState } from 'react'
import ConsoleInput from './components/ConsoleInput/ConsoleInput'
import { fuzzyFind } from './utils/fuzzyFind'
import { useGraphData } from './hooks/useGraphData'
import { useMousePosition } from './hooks/useMousePosition'
import { buildNode } from './lib/commands/node'
import { commands } from './lib/commands'
import { AudioGraph } from './lib/audio_graph/AudioGraph'
import { nodes } from './lib/commands/node/nodes'
import { project } from './lib/record'
import { Graph } from './data/Graph'

const audioGraph = new AudioGraph(
  project(nodes, n => n.build)
)

function App() {
  const graph = useGraphData()

  const [initialized, setInitialized] = useState(false)
  const initAudioGraph = () => {
    audioGraph.init()
    setInitialized(true)
  }

  useEffect(() => {
    window.addEventListener('click', initAudioGraph)
    return () => window.removeEventListener('click', initAudioGraph)
  }, [])

  useEffect(() => {
    if (initialized) {
      audioGraph.reconcile(new Graph(
        graph.nodes,
        graph.params,
        graph.edges,
      ))
    }
  }, [graph.nodes, graph.params, graph.edges])

  const mousePosition = useMousePosition()

  const onCommand = (cmd: string) => {
    const actualCmd = fuzzyFind(cmd, commands)[0]
    if (actualCmd == null) throw 'Command not found'
    execCommand(actualCmd)
  }

  const execCommand = (cmd: string) => {
    const [node, params] = buildNode(
      cmd,
      {
        nodeOverrides: {
          name: cmd,
          position: mousePosition
        }
      }
    )

    graph.addNode(node, params)
  }
  
  const [hints, setHints] = useState<string[]>([])
  const onInput = (input: string) => {
    if (input.length > 0)
      setHints(fuzzyFind(input, commands))
    else setHints([])
  }

  return (
    <div className='app'>
      <AppGraph
        nodes={graph.nodes}
        params={graph.params}
        edges={graph.edges}
        onMoveNode={graph.moveNode}
        onToggleConnection={graph.toggleConnection}
        onUpdateParam={graph.updateParam}
      />

      <ConsoleInput
        onCommand={onCommand}
        onInput={onInput}
        hints={hints}
      />
    </div>
  )
}

export default App
