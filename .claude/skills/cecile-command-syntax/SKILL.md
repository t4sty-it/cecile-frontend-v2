---
name: cecile-command-syntax
description: Use whenever writing, explaining, or double-checking a Cécile console command snippet (the mini language for creating/selecting/connecting graph nodes, e.g. answering "how do I wire X to Y" or including example commands in chat/docs). Ground every snippet in src/lib/lang/grammar.pegjs instead of recalling it from memory - the connector/inlet/outlet ordering is easy to get backwards.
---

# Cécile command-language syntax

The console mini-language is defined authoritatively by `src/lib/lang/grammar.pegjs`
(compiled to `src/lib/lang/parser.ts`) and interpreted by `src/lib/lang/exec.ts`.
**Before typing a snippet into a chat reply, code comment, or doc, re-read
`grammar.pegjs` (it's short) rather than reconstructing the syntax from memory or
from CLAUDE.md's prose summary** — the prose is a good overview but the exact
token ordering (especially inlet/outlet braces) is easy to get backwards.

If genuinely unsure, run it through the parser instead of guessing:

```ts
import { parse } from './src/lib/lang/parser'
parse('osc = trigger{ $samphold')
```

or add a throwaway case to `src/lib/lang/exec.test.ts` and `bun test` it.

## Command shape

A command is one or more **terms** joined by **targeted connectors**:

```
term  [connector  term]  [connector  term]  ...
```

### Terms

- **Creator** — `[<count>*]<nodeType>[:<label>]`
  Creates node(s). `3*oscillator:lfo` → 3 oscillators labeled "lfo".
  Bare `gain` creates one gain node.
- **Selector** — `$<nodeType>[:<label>]`
  Fuzzy-matches *existing* nodes by type/label instead of creating.
  `$samphold` selects an already-created samphold node.

### Connectors

`<`, `=`, `>` mean many-to-one / one-to-one / one-to-many (left term(s) to
right term(s)).

### Inlet / outlet labels — the part that's easy to get wrong

Grammar rule (`grammar.pegjs`):

```
TargetedConnector = outlet:Outlet? _ c:Connector _ inlet:Inlet?
Outlet = "}" label      // e.g.  }output
Inlet  = label "{"      // e.g.  trigger{
```

So, reading left to right across the whole command:

```
<leftTerm>  [}<outletLabel>]  <connector>  [<inletLabel>{]  <rightTerm>
```

- The **outlet** label sits *before* the connector, prefixed with `}`, and
  fuzzy-matches an **output** param on the *left* (source) term.
- The **inlet** label sits *after* the connector, suffixed with `{`, and
  fuzzy-matches an **input** param on the *right* (destination) term.
- Omit either label to fall back to the param literally named `output` /
  `input`.
- `exec.ts` confirms the direction: `op.outlet` fuzzy-filters the *source*
  node's outputs, `op.inlet` fuzzy-filters the *destination* node's inputs.

Examples:

```
osc = trigger{ $samphold        # osc's default output -> samphold's "trigger" inlet
clock }pulse = trigger{ $samphold   # clock's "pulse" output -> samphold's "trigger" inlet
osc > gain                      # osc's output -> gain's default input, one-to-many
3*oscillator:lfo < mixer        # 3 new oscillators -> mixer, many-to-one
```

Common mistake to avoid: writing the inlet/outlet brace *adjacent to the
connector* (e.g. `osc {= samphold`, `osc =trigger}samphold`) — the brace
belongs to the label, not the connector, and outlet vs inlet use different
brace characters (`}label` vs `label{`).

### Params

`@<name>=<expr>` after a term sets a param. Chainable, space-separated:

```
osc @frequency=440 @detune=n*10
```

`expr` supports `+ - * / ^`, parens, and `n`/`z` (1-/0-indexed position in the
created batch) and `r` (random); a bare identifier is treated as a symbol
value for string/option params (e.g. `@waveform=square`).

### Meta commands

`#name arg1 arg2` dispatches to `src/lib/commands/meta/`, not the graph.

### Help

Appending `?` to any command parses as `{action: 'help', target: cmd}`.

## Checklist before sending a snippet

1. Is every node type/label spelled per `src/lib/commands/node/nodes/index.ts`?
2. If using an inlet/outlet label, is `}label` before the connector and
   `label{` after it — never the reverse, never both on the same side?
3. Would `parse(...)` actually accept this string? If not certain, check
   `grammar.pegjs` or run the parser before presenting the snippet as correct.
