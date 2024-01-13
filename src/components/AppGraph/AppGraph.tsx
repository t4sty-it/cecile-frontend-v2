import { Edge } from '@/data/Edge'
import { Node } from '@/data/Node'
import AppGraphEdge from './AppGraphEdge'

import './AppGraph.scss'
import AppNode from '@/components/AppNode/AppNode'
import AppParam from '@/components/AppParam/AppParam'
import { Param } from '@/data/Param'
import { Graph } from '@/data/Graph'
import { Point } from '@/data/Point'
import { useMousePosition } from '@/hooks/useMousePosition'
import { useConnectionEvents } from './useConnectionEvents'

export default function AppGraph({
  nodes,
  params,
  edges,
  onMoveNode,
  onDeleteNode,
  onToggleConnection,
  onUpdateParam,
}: {
  nodes: Node[],
  params: Param[],
  edges: Edge[],
  onUpdateParam: (id: string, value: string | number) => void,
  onMoveNode: (nodeId: string, point: Point) => void,
  onDeleteNode: (nodeId: string) => void,
  onToggleConnection: (src: Param, dst: Param) => void,
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
    onMoveNode(node.id, position)
  }

  const onParamChange = (param: Param) => (value: string) => {
    console.log(`Param ${param.name} changed to ${value}`)
    if (param.dataType == 'signal') throw 'Trying to update a signal param'
    const castedValue = param.dataType == 'number' ? parseFloat(value) : value
    onUpdateParam(param.id, castedValue)
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
            label={node.label}
            
            inputParams={graph.inputParams(node).map(param =>
              <AppParam
                key={param.id}
                name={param.name}
                value={param.value?.toString()}
                options={param.options}
                showInput={param.dataType != 'signal'}
                connectable={param.type == 'input' && param.dataType != 'string'}
                onMouseUp={() => endConnection(param)}
                onChange={onParamChange(param)}
                type='input'
              />
            )}
            
            outputParams={graph.outputParams(node).map(param =>
              <AppParam
                key={param.id}
                name={param.name}
                showInput={false}
                onMouseDown={() => startConnection(param)}
                type='output'
              />
            )}

            onMove={(point: Point) => move(node, point)}

            onDelete={() => onDeleteNode(node.id)}
            
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