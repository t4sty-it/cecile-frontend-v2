---
status: new
type: bug
tags:
  - untagged

---
# command selection not working

Repro steps:

- type a command that results in more than 1 hint, like "midi"
- select the second hint (or any other but the bottom one)
- press enter

actual result: the bottom hint gets interpreted
expected result: the selected hint gets interpreted