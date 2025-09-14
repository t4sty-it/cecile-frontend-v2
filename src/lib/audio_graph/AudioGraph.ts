import { Graph } from "@/data/Graph"
import { Param, isNumberParamData, isStringParamData } from "@/data/Param"
import { setOf, subtract, innerJoin, valuesOf, valueOf, union, Set, length } from "@/lib/set"
import { Node } from "@/data/Node"
import { Box, boxOf, unbox } from "@/lib/box"
import { Edge } from "@/data/Edge"
import { AudioValue, CustomAudioNode } from "../commands/node/custom"


export type NodeBuilderFunc = (actx: AudioContext) => CustomAudioNode
const edgeId = (edge: Edge) => `${edge.src.id}:${edge.dst.id}`

type AudioParamValue = AudioNode | AudioParam | AudioValue
type AudioEdge = {src: AudioNode | AudioParam, dst: AudioNode | AudioParam}

export class AudioGraph {

  constructor(
    public readonly nodeBuilders: Record<string, NodeBuilderFunc>
  ){}

  private actx?: AudioContext

  private nodes = setOf<Box<CustomAudioNode>>([], () => '')
  private params = setOf<Box<AudioParamValue>>([], () => '')
  private edges = setOf<Box<AudioEdge>>([], () => '')

  public init() {
    if (this.actx == null) {
      this.actx = new AudioContext()
      console.log('audio context initialized')
    }
  }

  public reconcile(graph: Graph){

    this.ensureAudioContext()
    
    this.reconcileNodes(setOf(graph.nodes, n => n.id))
    this.reconcileParams(setOf(graph.params, p => p.id))
    this.reconcileEdges(setOf(graph.edges, edgeId))
  }

  private ensureAudioContext() {
    if (this.actx == null) throw 'Audio Graph not inizialized'
  }

  private reconcileEdges(graphEdges: Set<Edge>) {
    const edgesToDelete = subtract(this.edges, graphEdges)
    this.deleteAudioEdges(valuesOf(edgesToDelete))
    this.edges = subtract(this.edges, edgesToDelete)

    const edgesToCreate = subtract(graphEdges, this.edges)
    const createdEdges = setOf(
      this.createAudioEdges(valuesOf(edgesToCreate)),
      box => box.id
    )
    this.edges = union(this.edges, createdEdges)
  }

  private reconcileParams(graphParams: Set<Param>) {
    const paramsToDelete = subtract(this.params, graphParams)
    if (length(paramsToDelete) > 0)
      console.log(`deleting ${length(paramsToDelete)} params`)
    this.params = subtract(this.params, paramsToDelete)

    const paramsToCreate = subtract(graphParams, this.params)
    if (length(paramsToCreate) > 0)
      console.log(`creating ${length(paramsToCreate)} params`)

    const paramsCreated = setOf(
      this.createAudioParams(valuesOf(paramsToCreate)),
      box => box.id
    )
    this.params = union(this.params, paramsCreated)

    const paramsToUpdate = innerJoin(this.params, graphParams)
    if (length(paramsToUpdate) > 0) console.log(`updating ${length(paramsToUpdate)} params`)
    this.updateParams(valuesOf(paramsToUpdate))
  }

  private reconcileNodes(graphNodes: Set<Node>) {
    const nodesToCreate = subtract(graphNodes, this.nodes)
    const nodesCreated = setOf(
      valuesOf(nodesToCreate).map(n => this.createAudioNode(n)),
      n => n.id
    )
    this.nodes = union(this.nodes, nodesCreated)

    const nodesToDelete = subtract(this.nodes, graphNodes)
    this.nodes = subtract(this.nodes, nodesToDelete)
  }

  private updateParams(pairs: [Box<AudioParamValue>, Param][]) {
    pairs.forEach(([ap, gp]) => this.updateParam(ap, gp))
  }

  private updateParam(ap: Box<AudioParamValue>, param: Param) {
    if (param.value == null) return
    const audioParam = unbox(ap)

    if (isNumberParamData(param)) {
      if (audioParam instanceof AudioParam) {
        
        // prevent useless updates when moving nodes around
        if (Math.abs(audioParam.value - param.value) > 0.00001) {
          console.log('updating audio param value to', param.value)
          audioParam.setValueAtTime(param.value, this.actx!.currentTime)
          // audioParam.value = param.value
        }
      }
      else throw 'Cannot set number value of non-audioparam'
    }
    if (isStringParamData(param)) {
      if (audioParam instanceof AudioParam)
        throw 'Trying to set value of an audio param to a string'
      if (audioParam instanceof AudioNode)
        throw 'Trying to set value of an audio node to a string'
      if (audioParam.value != param.value) {
        audioParam.value = param.value
        console.log('Update string param to', param.value)
      }
    }
  }

  private createAudioNode(gn: Node): Box<CustomAudioNode> {
    this.ensureAudioContext()
    const an = this.nodeBuilders[gn.name](this.actx!)
    return boxOf(an, gn.id)
  }

  private createAudioParams(params: Param[]): Box<AudioParam | AudioNode | AudioValue>[] {
    return params
    .map(param => {
      const audioNode = valueOf(this.nodes, param.parentId)?.value
      if (audioNode == null) throw 'Missing audio node'
      const audioParam = audioNode.params[param.name]
        return boxOf(audioParam, param.id)
    })
  }

  private deleteAudioEdges(edges: Box<AudioEdge>[]): Box<AudioEdge>[] {
    return edges.map(e => {
      const {src, dst} = unbox(e)
      if (!(src instanceof AudioNode)) throw 'Edge source is not an audionode'
      src.disconnect(dst as AudioNode /* ts-stfu */)
      console.log(`disconnect ${e.id}`)
      return e
    })
  }

  private createAudioEdges(edges: Edge[]): Box<AudioEdge>[] {
    return edges.map(({src, dst}) => {
      const audioSrc = valueOf(this.params, src.id) ?? valueOf(this.nodes, src.id)
      if (audioSrc == null) throw `Edge source not found: ${src.id}`
      const audioDst = valueOf(this.params, dst.id) ?? valueOf(this.nodes, dst.id)
      if (audioDst == null) throw `Edge destination not found: ${dst.id}`

      if (!(audioSrc.value instanceof AudioNode)) throw 'Edge source is not an audionode'

      if (audioDst.value instanceof AudioNode || audioDst.value instanceof AudioParam) {
        audioSrc.value.connect(audioDst.value as AudioNode /* ts-stfu */)
        console.log(`connect ${audioSrc.id}:${audioDst.id}`)
      }
      else {
        console.error('Edge destination not and audio node or audio param', {
          audioSrc, audioDst
        })
        throw 'Edge destination is not an audionode or audio param'
      }

      return boxOf({src: audioSrc.value, dst: audioDst.value}, `${src.id}:${dst.id}`)
    })
  }

}