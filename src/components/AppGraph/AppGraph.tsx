import { Edge } from '@/data/Edge'
import { Node } from '@/data/Node'
import AppGraphEdge from './AppGraphEdge'

import './AppGraph.scss'
import AppNode from '@/components/AppNode/AppNode'
import AppParam from '@/components/AppParam/AppParam'
import { Param } from '@/data/Param'
import { Graph } from '@/data/Graph'
import { Point } from '@/data/Point'

export default function AppGraph({
  nodes,
  params,
  edges,
  onMoveNode,
}: {
  nodes: Node[],
  params: Param[],
  edges: Edge[],
  onMoveNode: (n: Node, p: Point) => void
}) {

  const graph = new Graph(nodes, params, edges)

  return (
    <div className='app-graph'>
      <svg className='app-graph__edges'>
        {edges?.map(edge =>
          <AppGraphEdge
            key={edge.src.id + edge.dst.id}
            src={graph.edgeSrcPos(edge)}
            dst={graph.edgeDstPos(edge)}
          />
        )}
      </svg>

      <div className="app-graph__nodes">
        {nodes?.map(node => 
          <AppNode
            key={node.id}
            name={node.name}  
            
            inputParams={graph.inputParams(node).map(param =>
              <AppParam key={param.id} name={param.name} />
            )}
            
            outputParams={graph.outputParams(node).map(param =>
              <AppParam key={param.id} name={param.name} />
            )}

            onMove={(point: Point) => onMoveNode(node, point)}
            
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