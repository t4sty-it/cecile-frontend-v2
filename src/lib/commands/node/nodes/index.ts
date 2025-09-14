import { Node } from "../node"

import { oscillator } from "./oscillator"
import { out } from "./out"
import { gain } from "./gain"
import { constant } from "./constant"
import { filter } from "./filter"
import { noise } from "./noise"
import { ahr } from "./ahr"
import { clip } from "./clip"
import { delay } from "./delay"

export const nodes: Record<string, Node> = {
  oscillator,
  gain,
  out,
  constant,
  filter,
  noise,
  ahr,
  clip,
  delay
}