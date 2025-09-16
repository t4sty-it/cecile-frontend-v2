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
import { useSelectionStore } from '@/contexts/SelectionContext'
import { useSelectionEvents } from './useSelectionEvents'

export default function AppGraph({
  nodes,
  params,
  edges,
  onMoveNodes,
  onDeleteNode,
  onToggleConnection,
  onUpdateParam,
}: {
  nodes: Node[],
  params: Param[],
  edges: Edge[],
  onUpdateParam: (id: string, value: string | number) => void,
  onMoveNodes: (nodeIds: string[], delta: Point) => void,
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

  const { nodes: selectedNodes } = useSelectionStore()

  const move = (node: Node, delta: Point) => {
    onMoveNodes([node.id, ...selectedNodes], delta)
  }

  const onParamChange = (param: Param) => (value: string) => {
    console.log(`Param ${param.name} changed to ${value}`)
    if (param.dataType == 'signal') throw 'Trying to update a signal param'
    const castedValue = param.dataType == 'number' ? parseFloat(value) : value
    onUpdateParam(param.id, castedValue)
  }

  const {updateSelection, selectionStart, beginSelection, endSelection} = useSelectionEvents(nodes)
  const { remove: removeFromSelection } = useSelectionStore()
  const deleteNode = (nodeId: string) => {
    removeFromSelection(nodeId)
    onDeleteNode(nodeId)
  }

  const onMouseUp: React.MouseEventHandler = e => {
    cancelConnection()
    selectionStart && updateSelection(selectionStart, mouse, {additive: e.shiftKey})
    endSelection()
  }

  const onMouseMove: React.MouseEventHandler = e => {
    if (selectionStart) {
      updateSelection(selectionStart, mouse, {additive: e.shiftKey})
    }
  }

  return (
    <div className='app-graph'
      onMouseDown={() => beginSelection(mouse)}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
    >
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

      <div className="app-graph__nodes" onMouseDown={e => e.stopPropagation()}>
        {nodes?.map(node => 
          <AppNode
            key={node.id}
            id={node.id}
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

            onDelete={() => deleteNode(node.id)}
            
            style={{
              left: node.position.x,
              top: node.position.y,
            }}
          />
        )}
      </div>

      {selectionStart &&
        <svg
          className='app-graph__selection'
        >
          <rect
            stroke='white'
            strokeWidth={1}
            fill='white'
            fillOpacity={0.25}
            x={Math.min(selectionStart!.x, mouse.x)} y={Math.min(selectionStart!.y, mouse.y)}
            width={Math.abs(mouse.x - selectionStart!.x)}
            height={Math.abs(mouse.y - selectionStart!.y)}
            style={{zIndex: 999}}
          />
        </svg>
        }
    </div>
  )
}