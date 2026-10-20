---
status: new
type: feature
tags:
  - modules

---
# connections on group pins

Pins backed by an inlet/outlet node are already connectable. What's left: virtual pins (edges crossing the boundary of a nested group without going through one of its ports) are still not connectable. A wire on one of them should either create the missing inlet/outlet or be translated into the real edges towards the internal params it represents.
