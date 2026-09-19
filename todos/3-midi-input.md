---
status: new
type: feature
tags:
  - modules

---
# midi input

Create new nodes, one for each midi message type, with with a text parameter to choose the device:

- midi-note-in: outputs channel, note and velocity
- midi-cc-in: outputs channel, cc and value
- midi-pitch-in: outputs channel and pitch bend
- midi-aftertouch-in: outputs channel and channel pressure
- midi-poly-aftertouch-in: outputs channel, note, pressure
- midi-sys-message-in: outputs value
- midi-pc-in: outputs channel and program

when creating the module via command, the device should be selected by fuzzy-match with the device name, e.g.: suppose the user has two keyboards connected, a "Roland XYZ" and an "Akai MPC123", when the user issues the command "midi-note-in@device=rol" the resulting node should receive midi notes from the roland, not the akai