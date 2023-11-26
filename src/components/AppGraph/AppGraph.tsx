import { Edge } from '@/data/Edge'
import { Node } from '@/data/Node'
import AppGraphEdge from './AppGraphEdge'

import './AppGraph.scss'
import AppNode from '@/components/AppNode/AppNode'
import AppParam from '@/components/AppParam/AppParam'
import { Param } from '@/data/Param'
import { Graph } from '@/data/Graph'
import { Point } from '@/data/Point'
import { useCallback, useState } from 'react'
import { useMousePosition } from '@/hooks/useMousePosition'
import { useConnectionEvents } from './useConnectionEvents'

export default function AppGraph({
  nodes,
  params,
  edges,
  onMoveNode,
  onToggleConnection,
}: {
  nodes: Node[],
  params: Param[],
  edges: Edge[],
  onMoveNode: (n: Node, p: Point) => void,
  onToggleConnection: (src: Param, dst: Param) => void
}) {

  const graph = new Graph(nodes, params, edges)
  
  const {
    connectionStart,
    connectionStarted,
    startConnection,
    endConnection,
    cancelConnection
  } = useConnectionEvents(onToggleConnection)
  
  const mouse = useMousePosition()

  const move = (node: Node, position: Point) => {
    onMoveNode(node, position)
  }

  return (
    <div className='app-graph' onMouseUp={cancelConnection}>
      <svg className='app-graph__edges'>
        {edges?.map(edge =>
          <AppGraphEdge
            key={edge.src.id + edge.dst.id}
            src={graph.edgeSrcPos(edge)}
            dst={graph.edgeDstPos(edge)}
          />
        )}

        {connectionStarted() &&
          <AppGraphEdge
            src={graph.paramOffsetPosition(connectionStart!)}
            dst={mouse}
          />
        }
      </svg>

      <div className="app-graph__nodes">
        {nodes?.map(node => 
          <AppNode
            key={node.id}
            name={node.name}  
            
            inputParams={graph.inputParams(node).map(param =>
              <AppParam
                key={param.id}
                name={param.name}
                onMouseUp={() => endConnection(param)}
              />
            )}
            
            outputParams={graph.outputParams(node).map(param =>
              <AppParam
                key={param.id}
                name={param.name}
                onMouseDown={() => startConnection(param)}
              />
            )}

            onMove={(point: Point) => move(node, point)}
            
            style={{
              left: node.position.x,
              top: node.position.y,
            }}
          />
        )}
      </div>
    </div>
  )
}