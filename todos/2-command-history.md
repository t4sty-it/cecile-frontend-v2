---
status: new
type: feature
tags:
  - untagged

---
# command history

Pressing arrow up/down when focusing the command input (component ConsoleInput) should navigate in the command history, much like in a command line. History entries are immutable: when a user navigates the selected entry is copied in the current input, so that when they start typing they actually edit a new command and when they type "Enter" the command, if successful (does not throw error) is appended to the history. History entries should be compressed - no two adjacent entries should be equal - so if user enters "osc", "osc", the history only has 1 entry, "osc"; if the user instead enters "osc", "gain", "osc", the history has all 3 distnct entries.