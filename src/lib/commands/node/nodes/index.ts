import { Node } from "../node"

import { oscillator } from "./oscillator"
import { out } from "./out"
import { gain } from "./gain"

export const nodes: Record<string, Node> = {
  oscillator,
  gain,
  out,
}