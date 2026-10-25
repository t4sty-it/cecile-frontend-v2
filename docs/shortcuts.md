# Shortcuts

Keyboard shortcuts work anywhere on the canvas. While the console is focused, typing goes to
the console instead, so the editor shortcuts below don't fire (there, <kbd>Ctrl</kbd> + <kbd>z</kbd>
undoes your typing, not the patch).

## Editor

| Key | Action |
|-----|--------|
| <kbd>Space</kbd> | Focus the console input. |
| <kbd>p</kbd> | Open the command palette, to place a module from a list. |
| <kbd>m</kbd> | Start [MIDI learn](../README.md#midi-learn): touch a control on your MIDI device and the matching module is placed under the cursor. |
| <kbd>g</kbd> | Collapse the selected nodes into a [group](language.md#groups). |
| <kbd>Shift</kbd> + <kbd>g</kbd> | Ungroup the selected groups, putting their contents back in place. |
| <kbd>a</kbd> | Select every module at the current level. |
| <kbd>Shift</kbd> + <kbd>a</kbd> | Clear the selection. |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Delete the selected modules, with their wires (and contents, for groups). |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>z</kbd> | Undo the last change to the patch: modules, wires, params, groups, commands and moves. |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>z</kbd>, <kbd>Ctrl</kbd> + <kbd>y</kbd> | Redo. |
| <kbd>Esc</kbd> | Close the docs or the command palette, or cancel placing a module. |

## Console

| Key | Action |
|-----|--------|
| <kbd>Enter</kbd> | Run the command. |
| <kbd>Shift</kbd> + <kbd>Enter</kbd> | Insert a new line, to write a multi-line [program](language.md). |
| <kbd>Tab</kbd> | Complete with the selected autocomplete hint. |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Browse the command history (from the first / last line of the input). |
| <kbd>Esc</kbd> | Dismiss the autocomplete hints. |

## Mouse

| Gesture | Action |
|---------|--------|
| Drag on the canvas | Rubber-band select nodes. |
| <kbd>Shift</kbd> + drag on the canvas | Add to the current selection. |
| Drag a node | Move it (and every selected node). |
| Drag from one inlet/outlet to another | Connect them. |
| Double-click a group | Go inside it; the breadcrumb at the top leads back up. |
