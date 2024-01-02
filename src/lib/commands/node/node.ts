import { ParamData } from "@/data/Param";
import { CustomAudioNode } from "./custom";

export type Node = {
  params: () => ParamData[],
  build: (actx: AudioContext) => CustomAudioNode
}