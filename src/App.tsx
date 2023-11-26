import './App.scss'
import AppGraph from './components/AppGraph/AppGraph'
import { Edge } from './data/Edge'
import { Node } from './data/Node'
import { Param } from './data/Param'

import { useState } from 'react'
import { Point } from './data/Point'

function App() {

  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'n01',
      name: 'N01',
      position: {x: 100, y: 100},
    },

    {
      id: 'n02',
      name: 'N02',
      position: {x: 200, y: 200},
    }
  ])

  const params: Param[] = [
    {
      id: 'n01-out',
      name: 'OUT',
      type: 'output',
      dataType: 'number',
      parentId: nodes[0].id,
      offset: {x: 300, y: 50}
    },
    {
      id: 'n02-in',
      name: 'IN',
      type: 'input',
      dataType: 'number',
      parentId: nodes[1].id,
      offset: {x: 0, y: 50}
    }
  ]

  const [edges, setEdges] = useState<Edge[]>([
    {
      src: params[0],
      dst: params[1]
    }
  ])
  // const edges: Edge[] = [
  //   {
  //     src: params[0],
  //     dst: params[1]
  //   }
  // ]

  // const setEdges = (e: (ed: Edge[]) => void) => {}

  const move = (target: Node, point: Point) => {
    setNodes(nodes =>
      nodes.map(node =>
        node.id === target.id
          ? {...target, position: point}
          : node))
  }

  const toggleConnection = (src: Param, dst: Param) => {
    const edgeIdx = edges.findIndex(e => 
      e.src.id == src.id &&
      e.dst.id == dst.id
    )

    if (edgeIdx >= 0)
      setEdges(edges => edges.toSpliced(edgeIdx, 1))
    else
      setEdges(edges => [...edges, {src, dst}])
  }

  return (
    <div className='app'>
      <AppGraph
        nodes={nodes}
        params={params}
        edges={edges}
        onMoveNode={move}
        onToggleConnection={toggleConnection}
      />
    </div>
  )
}

export default App
