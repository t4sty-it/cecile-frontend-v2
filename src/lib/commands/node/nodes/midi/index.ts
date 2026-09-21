import { Node } from "../../node"
import { midiNoteIn } from "./noteIn"
import { midiKeyboardIn } from "./keyboardIn"
import { midiCcIn } from "./ccIn"
import { midiPitchIn } from "./pitchIn"
import { midiAftertouchIn } from "./aftertouchIn"
import { midiPolyAftertouchIn } from "./polyAftertouchIn"
import { midiPcIn } from "./pcIn"
import { midiSysMessageIn } from "./sysMessageIn"

export const midiNodes: Record<string, Node> = {
  'midi-note-in': midiNoteIn,
  'midi-keyboard-in': midiKeyboardIn,
  'midi-cc-in': midiCcIn,
  'midi-pitch-in': midiPitchIn,
  'midi-aftertouch-in': midiAftertouchIn,
  'midi-poly-aftertouch-in': midiPolyAftertouchIn,
  'midi-pc-in': midiPcIn,
  'midi-sys-message-in': midiSysMessageIn,
}
