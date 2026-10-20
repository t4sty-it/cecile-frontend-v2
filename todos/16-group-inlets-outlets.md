---
status: done
type: feature
tags:
  - modules
---
# group inlets and outlets

When viewing the inside of a group node, edges crossing the group boundary have no visible endpoint. Add Pd-style `inlet`/`outlet` pseudo-nodes to represent them. The label of each inlet/outlet becomes the name of the corresponding synthetic pin on the collapsed group node (instead of the generic `input`/`i1`/... and `output`/`o1`/... names).
