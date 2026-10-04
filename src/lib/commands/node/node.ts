import { ParamData } from "@/data/Param";
import { CustomAudioNode } from "./custom";

export type NodeCategory = 'Sources' | 'Processors' | 'Control' | 'MIDI' | 'Output'

export type Node = {
  // Group under which the node is listed in the command palette
  category: NodeCategory,
  params: () => ParamData[],
  build: (actx: AudioContext) => CustomAudioNode
}
