import './App.scss'
import AppGraph from './components/AppGraph/AppGraph'

import { useState } from 'react'
import ConsoleInput from './components/ConsoleInput/ConsoleInput'
import { fuzzyFind } from './utils/fuzzyFind'
import { useGraphData } from './hooks/useGraphData'
import { useMousePosition } from './hooks/useMousePosition'
import { Node } from './data/Node'
import { Param } from './data/Param'

const commands = [
  'uno',
  'due',
  'tre'
]


function App() {
  const graph = useGraphData()

  const mousePosition = useMousePosition()

  const onCommand = (cmd: string) => {
    const actualCmd = fuzzyFind(cmd, commands)[0]
    if (actualCmd == null) throw 'Command not found'
    execCommand(actualCmd)
  }

  const execCommand = (cmd: string) => {
    const node: Node = {
      id: '' + Math.random(),
      name: cmd,
      position: mousePosition
    }

    const input: Param = {
      id: '' + Math.random(),
      name: 'input',
      dataType: 'number',
      parentId: node.id,
      type: 'input',
      offset: {x: 0, y: 50}
    }

    graph.addNode(node, [input])
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
