# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cécile is a web-based modular synth editor, inspired by Pure Data: you place audio nodes on a canvas and patch them together. Uniquely, it has a small custom command language (parsed with a Peggy/PEG.js grammar) that lets you create, select, and connect nodes with short text commands typed into a console input, instead of only dragging wires by hand.

## Commands

Package manager is **bun** (see `bun.lockb`, `shell.nix` provides `bun` + `curl`).

- `bun install` — install deps
- `bun run dev` — start Vite dev server
- `bun run build` — typecheck (`tsc`) then `vite build`
- `bun run lint` — ESLint over `src/**/*.{ts,tsx}` (zero warnings allowed)
- `bun test` — run all `*.test.ts` tests (uses `bun:test`, not vitest/jest)
- `bun test src/lib/lang/exec.test.ts` — run a single test file
- `bun run parser` — regenerate `src/lib/lang/parser.ts` from `src/lib/lang/grammar.pegjs` (must be re-run after editing the grammar; the generated parser is checked in)
- `bun run deploy` — builds and syncs `dist/` to a Scaleway bucket via the S3 REST API using plain `curl --aws-sigv4` (`scripts/deploy.sh`); needs `SCW_ACCESS_KEY`/`SCW_SECRET_KEY` in the env or a gitignored `.deploy.local`

Path alias `@/*` maps to `src/*` (see `tsconfig.json` / `vite-tsconfig-paths`).

## Architecture

### The command language pipeline

This is the core feature of the app and spans several files under `src/lib/lang/`:

1. **`grammar.pegjs`** — Peggy grammar defining the language syntax, compiled to `parser.ts` (do not hand-edit `parser.ts`; edit the grammar and run `bun run parser`).
2. **`exec.ts`** — walks the parsed AST and turns it into graph mutations. A command is a sequence of terms separated by connectors, evaluated left to right as **SELECT → CREATE → CONNECT**.

Language shape (see the grammar for the authoritative syntax):
- **Creator**: `<count>* <nodeType>[:label]` — e.g. `3*oscillator:lfo` creates 3 oscillator nodes labeled "lfo".
- **Selector**: `$<nodeType>[:label]` — selects existing nodes matching a fuzzy name/label match instead of creating new ones.
- **Connector**: `<`, `=`, `>` between two terms, meaning many-to-one / one-to-one / one-to-many respectively, e.g. `osc > gain` or `osc = gain`. An optional `label{` / `}label` around the connector targets a specific inlet/outlet (param) by fuzzy name instead of the default `input`/`output`.
- **Params**: `@name=expr` after a term sets a node's param, e.g. `osc @frequency=440`. Param expressions support `+ - * / ^`, parens, and the special variables `n`/`z` (1-indexed / 0-indexed position within a batch of created nodes) and `r` (random), plus symbol values for string/option params.
- **Meta commands**: `#name arg1 arg2` dispatch to a separate registry (`src/lib/commands/meta/`) instead of the graph (e.g. `#log`), and don't produce graph nodes.
- Appending `?` to any command is parsed as a help request (`action: 'help'`) — not yet implemented in `exec.ts`.

Node/param matching for selectors and param assignment uses fuzzy matching (`src/utils/fuzzyFind.ts`), not exact string matching — this is intentional so short/abbreviated commands work.

### Data model: immutable graph + "Set" helper

The domain model (`src/data/{Node,Param,Edge,Graph,Point}.ts`) is plain, serializable data — nodes/params/edges are identified by string `id`s, params reference their owning node via `parentId`, and edges reference param ids (`src`/`dst`), not node ids directly (so wires connect to specific inlets/outlets).

`src/lib/set/` implements a small `Record<id, {id, _value}>`-backed "Set" abstraction with `union`/`subtract`/`intersect`/`innerJoin`/`filter`/`map`, used everywhere graphs are diffed (e.g. reconciling which audio nodes to create/destroy). `src/lib/graph/` builds on top of `Set` to represent a `{nodes, params, edges}` triple generically (used by the language layer), which is distinct from `src/data/Graph.ts`'s `Graph` class (a plain-array, UI-facing version used for rendering/layout — has helpers like `inputParams`/`outputParams`/`edgeSrcPos`).

Command execution flow (`src/hooks/useGraphData.ts`): the current UI graph is turned into a `lib/graph` `Graph`, `exec()` produces a *diff* graph from the command, and the diff is unioned back into the UI state (nodes/params/edges are all plain React state arrays).

### Node definitions and audio rendering

Each node type (`src/lib/commands/node/nodes/*`) exports a `Node` (`{params, build}`, see `src/lib/commands/node/node.ts`): `params()` describes the UI-facing param list (name, dataType, options, default value), and `build(actx)` constructs a `CustomAudioNode` (`src/lib/commands/node/custom.ts`) — a `GainNode` subclass wrapping real Web Audio API nodes, exposing a `params` map of `AudioParam`/`AudioNode`/custom `AudioValue` getters-setters that the audio graph reconciler writes into. Some nodes (`ahr`, `clip`, `noise`) use `AudioWorkletNode`s with a companion `*_processor.ts` file loaded via `createWorkletNode` (`src/lib/commands/node/worklet.ts`).

`src/lib/audio_graph/AudioGraph.ts` is the bridge from the plain-data graph to the live Web Audio graph: `reconcile(graph)` diffs the previous vs. new node/param/edge sets (again via `lib/set`) and calls `connect`/`disconnect`/`setValueAtTime` only on what changed. It's driven from `useAudioGraph` + a `useEffect` in `screens/graph/index.tsx` that re-reconciles whenever nodes/params/edges change. The `AudioContext` is only created lazily on first user click (browser autoplay policy).

### UI layer

- `src/router.tsx` — two routes: `/` (splash) and `/graph` (the editor), the latter wrapped in `SelectionProvider`.
- `src/contexts/store.tsx` — a generic `makeStore(builder)` factory (context + provider + `use()` hook) used to build small stores like `SelectionContext` (currently-selected node ids, used for multi-node drag/move).
- `src/components/AppGraph/` — the canvas: renders nodes/edges, and owns mouse-driven interactions via two hooks: `useConnectionEvents` (dragging a wire between params) and `useSelectionEvents` (rubber-band multi-select).
- `src/components/ConsoleInput/` — the command-line input bar; shows fuzzy-matched autocomplete hints (against `lib/commands` node type names) and forwards submitted text to `execCommand`.

### Infra

`infra/edge-services/` — Terraform for a Scaleway edge/CDN service in front of the deployed static site. `scripts/deploy.sh` builds and syncs `dist/` to Scaleway object storage (hashed assets cached forever, `index.html` never cached).
