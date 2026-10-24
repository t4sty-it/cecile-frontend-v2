# Cécile command language

Cécile lets you build a patch by typing short commands into the console bar
at the bottom of the editor, instead of (or alongside) placing modules and
dragging wires with the mouse. New modules appear at the mouse position.

```cecile
oscillator > filter > gain > out
```

This creates four modules and wires each one into the next. Thanks to fuzzy
matching, the same patch can be written as:

```cecile
osc > f > g > out
```

This page is the reference for the language. For the list of available
modules and what they do, see the [module reference](modules.md). The authoritative
syntax is the grammar in
[`src/lib/lang/grammar.pegjs`](../src/lib/lang/grammar.pegjs), and the
semantics live in [`src/lib/lang/exec.ts`](../src/lib/lang/exec.ts).

## Overview

A command is a sequence of **terms** separated by **connectors**:

```
term [connector term] [connector term] ...
```

- A **term** is either a **creator** (makes new modules) or a **selector**
  (`$...`, refers to modules already in the patch).
- A **connector** (`>`, `<` or `=`) wires the term on its left into the term
  on its right. Signal always flows left to right.
- Any term can be followed by **params** (`@name=value`) to set values on
  the modules it creates.

A command runs in three phases: selectors are resolved first, then new
modules are created, then connections are made. A command that refers to a
module type that does not exist, or to an inlet/outlet that cannot be found,
fails as a whole and shows an error in the console bar.

A command can span several lines, one command per line (see
[Multi-line commands](#multi-line-commands)).

A **definition** (`name := ( ... )`) turns a set of commands into a reusable
group module (see [Groups](#groups)).

Two other command forms exist: **meta commands** (`#name args`) and the
**`?` help suffix**, both described at the end of this page.

## Creating modules

Name a module type to create one:

```cecile
oscillator
```

### Labels

Append `:label` to give the new module a label. Labels can later be used to
select modules (see [Selecting modules](#selecting-modules)):

```cecile
oscillator:vco
```

### Count

Prefix `<count>*` to create several copies at once. All copies share the
same label:

```cecile
3*oscillator:vco
```

creates three oscillators, all labelled `vco`. Whitespace around `*` is
allowed (`3 * oscillator`).

### Naming rules

Module types, labels and param names are identifiers: letters, `_` and `-`
(not as the first character). Digits are **not** allowed, so `vco2` is not a
valid label; use something like `vco_b` instead.

## Selecting modules

Prefix a term with `$` to refer to modules that already exist in the patch
instead of creating new ones:

```cecile
oscillator > $gain
```

creates a new oscillator and connects it to every existing gain module.

A selector can match by type, by label, or by both:

```
$gain            # every gain module
$:mixer          # every module labelled "mixer", whatever its type
$oscillator:vco  # every oscillator labelled "vco"
```

```cecile
$oscillator:vco > $gain:mixer
```

connects every oscillator labelled `vco` to every gain labelled `mixer`,
without creating anything.

Notes:

- Both the type and the label are fuzzy-matched (see
  [Fuzzy matching](#fuzzy-matching-and-abbreviations)), so `$:mix` also
  selects modules labelled `mixer`.
- A selector only sees the modules on screen: inside a group it sees that
  group's modules, and at the top level it sees groups but not what's in
  them (see [Groups](#groups)).
- A selector that matches nothing is not an error; it simply produces no
  connections.
- Params written after a selector (`$osc @frequency=220`) are accepted by the
  parser but currently ignored: params are only applied to newly created
  modules.

## Connecting modules

There are three connectors. In all cases the left term is the source and the
right term is the destination.

| Connector | Behaviour |
|-----------|-----------|
| `>`       | Connect every source module to every destination module. |
| `<`       | Same as `>` in the current implementation. |
| `=`       | Connect modules pairwise: 1st to 1st, 2nd to 2nd, and so on. Extra modules on the longer side are left unconnected. |

> `>` and `<` are parsed as distinct operators (many-to-one and one-to-many),
> but both currently connect all sources to all destinations, and neither
> reverses the direction of the signal.

Connect three oscillators to a single gain:

```cecile
3*oscillator > gain
```

Connect each of three oscillators to both of two filters (six wires):

```cecile
3*oscillator > 2*filter
```

Connect the first two oscillators to one gain each, leaving the third
unconnected:

```cecile
3*oscillator = 2*gain
```

### Choosing inlets and outlets

By default a connection goes from the source's outlet named `output` to the
destination's inlet named `input`. To use a different one, name it next to
the connector:

```
<source> [}outlet] <connector> [inlet{] <destination>
```

- `}name`, written **before** the connector, picks an outlet on the source.
- `name{`, written **after** the connector, picks an inlet on the
  destination.
- Either one can be omitted, and spaces around the braces are optional.

Modulate an existing oscillator's frequency with a new, slow oscillator:

```cecile
oscillator:lfo @frequency=2 > frequency{ $oscillator:vco
```
this wires the output of the lfo to the frequency of the vco.

Trigger a sample-and-hold from a clock:

```cecile
clock > trigger{ samphold
```

Use both: route a MIDI keyboard's `velocity` outlet into the `gain` inlet of
the gain labelled `amp`:

```cecile
midi-keyboard-in }velocity > gain{ $gain:amp
```

Inlet and outlet names are fuzzy-matched too (`freq{` finds `frequency`).
If a name matches several inlets/outlets, all of them are connected. If it
matches none, the command fails with an error such as
`No input named "xyz" found`.

Only real signal inlets/outlets can be wired. Settings that are not signal
inputs (for example a MIDI module's device or CC number) can never be the
target of a connection; set them with params instead.

Some modules have no outlet called `output` (MIDI input modules expose
`frequency`, `velocity`, `value` and so on). Connecting from them without an
explicit `}outlet` produces no wire, so name the outlet:

```cecile
midi-keyboard-in }frequency > frequency{ oscillator
```

### Chaining

Connectors can be chained. Each connector links the two terms immediately
around it, so a term in the middle is the destination of the previous
connection and the source of the next one:

```cecile
oscillator > filter > gain > out
```

Every creator in a chain creates new modules. To route into a module that
already exists (for example an `out` you created earlier), use a selector:

```cecile
4*oscillator @frequency=110*2^z > gain:mix > $out
```

## Multi-line commands

Press <kbd>Shift</kbd>+<kbd>Enter</kbd> in the console to start a new line.
Each line is a command of its own, and the lines run in order, exactly as if
you had typed them one at a time. In particular, a selector sees the modules
created by the lines above it, so you can build a patch step by step:

```cecile
noise > g:range @gain=12 > sh
clock @bpm=240 > trigger{ $sh
$sh > q @scale=pentatonic > mtof > frequency{ osc > g:vca @gain=0.2 > out
```

Here `$sh` on the second and third lines refers to the sample & hold created
on the first one. A selector never sees modules created by lines *below* it.

A few more rules:

- Blank lines are ignored.
- A single command can't be split across lines: `osc >` followed by `gain` on
  the next line is a syntax error.
- The whole block succeeds or fails together. If any line fails, nothing is
  added to the patch, and the error tells you what went wrong.
- Each line places its new modules below those of the previous line, so the
  patch doesn't pile up under the mouse.
- <kbd>↑</kbd> and <kbd>↓</kbd> move between lines; they only browse the
  command history from the first or last line. A multi-line command is
  stored in the history as a single entry.

## Params

Follow a term with `@name=value` to set a param on the modules it creates.
Several params can be chained, with or without spaces:

```cecile
oscillator@frequency=220
3*oscillator:supersaw @shape=saw @frequency=220+10*r
```

Param names are fuzzy-matched against the module's params, so
`@freq=220` (or even `@f=220` on an oscillator) sets `frequency`.

### Expressions

Numeric values can be arithmetic expressions:

| Syntax  | Meaning |
|---------|---------|
| `+ -`   | addition, subtraction |
| `* /`   | multiplication, division |
| `^`     | power (`2^3` is 8) |
| `( )`   | grouping |

Numbers can be integers (`440`) or decimals (`0.5`, `.5`). A negative
decimal can be written directly (`-0.5`), but a negative integer cannot:
write `-3.0` or `0-3` instead of `-3`.

```cecile
oscillator @frequency=(220+20)*2^2
```

### Variables

Expressions can use three variables:

- `n`: the position of the module within the batch being created, starting
  at 1.

  ```cecile
  3*oscillator @frequency=220*n
  ```

  gives three oscillators at 220, 440 and 660 Hz.

- `z`: the same position, starting at 0.

  ```cecile
  3*oscillator @frequency=110*2^z
  ```

  gives three oscillators at 110, 220 and 440 Hz (octaves).

- `r`: a random number in the range [0, 1), drawn separately for every
  module and every param.

  ```cecile
  3*oscillator @frequency=220+10*r
  ```

  gives three slightly detuned oscillators between 220 and 230 Hz.

### Symbol values

Params that take a choice or a string (such as an oscillator's `shape` or a
filter's `shape`) accept a bare word. For choice params the word is
fuzzy-matched against the available options, so it can be abbreviated:

```
oscillator @shape=saw          # sawtooth
filter @shape=high             # highpass
```

Known limitation: a symbol that starts with `n`, `z` or `r` is read as the
corresponding variable and the command fails to parse (`@shape=notch` is
rejected). Until this is fixed, abbreviate from a later letter, e.g.
`@shape=otch` for `notch`.

## Groups

A group is a module that contains other modules. On the canvas it shows up as
a single box. Double-click it to go inside, and use the breadcrumb at the top
of the editor to go back up. Groups can also be made with the mouse, by
selecting modules and pressing <kbd>g</kbd> (see the
[shortcuts](shortcuts.md)). This section covers how to define and create them
from the console.

### Defining a group

`name := ( commands )` defines a group called `name`:

```cecile
supersaw := ( inlet:frequency > frequency{ 3*osc @shape=saw @freq=220+10*r > outlet )
supersaw > out
```

The first line only stores the definition; nothing is added to the patch.
The second line creates a `supersaw` group and wires it to a new `out`. A
group is created exactly like any other module, so a count, a label and
connectors all work:

```cecile
2*supersaw:pad > $out
```

Every copy is built from scratch by running the commands of the definition
again. The two `pad` groups above are independent, and each one draws its own
random detuning from `r`.

A definition can span several lines inside the parentheses. The opening `(`
must be on the same line as `:=`:

```cecile
voice := (
  inlet:pitch > frequency{ osc:vco @shape=saw > f:vcf > g:vca > outlet
  inlet:cutoff > frequency{ $f:vcf
)
voice
```

### Inlets and outlets

A group gets its inlets and outlets from the `inlet` and `outlet` modules
inside it, in the style of Pure Data:

- an `inlet` passes whatever is connected to the group's matching inlet on to
  the modules it is wired to;
- an `outlet` sends what it receives out of the matching outlet of the group.

The label of an `inlet`/`outlet` becomes the name of the group's
inlet/outlet. In the `voice` example above, the group has inlets called
`pitch` and `cutoff`, so you can pick them with `name{` like any other inlet:

```cecile
midi-keyboard-in }frequency > pitch{ voice > out
```

Unlabelled inlets are named `input`, `i1`, `i2`, ..., and unlabelled outlets
`output`, `o1`, `o2`, ..., from top to bottom. A group with a single unlabelled
inlet and outlet can therefore be connected without naming them, as in
`osc > mygroup > out`.

### Scope

- A definition made at the top of a command is **global**. It stays
  available to every later command, and you can create the group as many
  times as you like, at the top level or inside other groups.
- A definition made inside another definition is **local**. It can only be
  used within that definition:

  ```cecile
  stack := (
    voice := ( osc @shape=saw @freq=110*2^r > outlet )
    3*voice > g @gain=0.3 > outlet
  )
  stack > out
  ```

  `stack` contains three `voice` groups, but typing `voice` afterwards fails,
  because `voice` only exists inside `stack`.
- Defining a name again replaces the old definition for later commands.
  Groups that already exist are left as they are.
- Names are resolved when a group is created, not when it is defined. A
  definition can therefore use a group defined after it, as long as that
  group exists by the time the first one is created.

### Rules and limitations

- The commands of a definition run on their own: selectors inside it only see
  the modules created by the definition itself.
- Selectors outside a group never see inside it. After `supersaw`, the line
  `$osc > gain` does not reach the oscillators in the group, but
  `$supersaw > gain` connects the group itself.
- A group has no params of its own, so `supersaw @freq=220` is an error. Feed
  values in through an inlet instead.
- A definition can't use itself, directly or through another group:
  `loop := ( loop )` fails as soon as `loop` is created.
- Group names follow the [naming rules](#naming-rules), so they can't contain
  digits.
- A definition with the same name as a module type takes precedence over that
  module type. Fuzzy matching also searches definitions first.
- Meta commands, `?` and blank-only bodies are not allowed inside a
  definition.
- Definitions are not saved: they last until the page is reloaded.

## Fuzzy matching and abbreviations

Module types, selector types and labels, param names, and inlet/outlet names
are all fuzzy-matched, so you rarely need to type full names. A short name
is resolved by trying, in order of preference:

1. an exact match (`out` is `out`, not `oscillator`);
2. a name starting with what you typed (`osc` matches `oscillator`);
3. a name containing your letters in order (`ctt` matches `constant`).

When several names qualify, the first one according to that order (and
then the order modules are registered in) wins. For example, `f` creates a
`filter` and `g` creates a `gain`:

```cecile
osc > f > g > out
```

Selectors use the same matching but keep **every** match, so a very short
selector such as `$:a` may select more modules than intended. Similarly, a
very short param name applies to every param of the module it matches, and a
short inlet/outlet name connects every inlet/outlet it matches. When in
doubt, type a few more letters.

## Meta commands

A command starting with `#` is a meta command: it runs an editor action
instead of changing the patch. Arguments are separated by spaces:

```
#name arg1 arg2
```

The only meta command currently defined is:

| Command        | Effect |
|----------------|--------|
| `#log args...` | Prints its arguments to the browser's developer console. |

Meta commands can be mixed with other lines in a
[multi-line command](#multi-line-commands).

Note: the meta command registry is not yet wired into the console bar, so at
the moment any meta command (including `#log`) only prints
`command not found` to the developer console and leaves the patch unchanged.

## Help (`?`)

Ending any command with `?` marks it as a help request:

```
oscillator > gain ?
```

The parser recognises this, but help is **not implemented yet**: a command
ending in `?` currently does nothing to the patch and reports an error.
