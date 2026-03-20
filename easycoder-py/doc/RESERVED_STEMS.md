# Reserved Stems & Plugin Safety

This document lists keywords and word stems reserved by the **core** EasyCoder module. Plugin developers should avoid claiming these as standalone verbs to prevent collision with existing or future core syntax.

## Purpose

EasyCoder's extensibility depends on clear boundaries between core and plugin namespaces. **Syntactic noise** (articles like "the", prepositions like "to"/"of") serves as disambiguation, but plugins must also respect reserved stems to ensure future-proof interoperability.

---

## Core Reserved Keywords (Complete List)

These are **primary verbs** claimed by core. Plugins must not override them:

### Control Flow
- `fork`, `go`, `goto`, `gosub`, `return`
- `if`, `else`, `begin`, `end`
- `while`, `break`, `exit`, `stop`, `wait`
- `on` (event handlers: `on error`, etc.)

### Variable & Data Operations
- `variable`, `constant`, `module`, `file`, `ssh`, `stack`
- `put`, `set`, `clear`, `delete`
- `add`, `subtract`, `multiply`, `divide`, `modulo`, `increment`, `decrement`, `negate`
- `append`, `pop`, `push`
- `index`, `element`, `property`, `length`

### I/O & External Operations
- `open`, `close`, `read`, `write`, `download`, `upload`
- `get` (HTTP/network)
- `post` (HTTP)
- `log`, `print`
- `input`, `output`
- `lock`, `unlock`

### System & Meta
- `debug`, `import`, `init`, `load`, `unload`
- `pass`, `require`, `send`, `system`
- `timestamp`, `hash`, `encode`, `decode`, `extract`, `replace`, `split`

### Assertions & Testing
- `assert`

---

## Core Reserved Value Stems

These stems appear in **value expressions** (not as standalone commands) and should be avoided by plugins unless qualified:

- `cat` — concatenation (`the cat of A and B`)
- `element` — array indexing (`the element 0 of Array`)
- `index` — search (`the index of X in Array`)
- `property` — object access (`the property Name of Object`)
- `length` — size (`the length of Value`)
- `empty` — null/empty value
- `true`, `false` — boolean literals
- `numeric`, `boolean`, `string`, `list`, `object` — type checks (used in conditions)

---

## Plugin-Safe Patterns

To avoid collision, plugins should:

1. **Use qualified forms**: Instead of bare `cat`, use `file cat` or `data cat`.
2. **Prefer unique stems**: Choose stems unlikely to clash with natural language (e.g., `sql query`, `mqtt publish`).
3. **Use prepositions/articles**: Leverage `the`, `of`, `to`, `from`, `with` to disambiguate (e.g., `the result of query X`).
4. **Check core documentation**: Before claiming a keyword, verify it's not reserved or planned for core.

### Examples of Safe Plugin Keywords

✅ **Good** (plugin-safe):
- `sql query {variable} from {connection}`
- `mqtt publish {topic} with {message}`
- `file cat {source} to {destination}` (qualified with `file`)
- `http post to {url} with {data}`

❌ **Risky** (potential collision):
- `cat {A} {B}` (bare `cat` conflicts with core concatenation)
- `set {variable}` (already claimed by core)
- `element {N}` (conflicts with core array indexing)

---

## Versioning & Future Additions

This list is **not exhaustive**—core may add new keywords in future releases. Plugins should:
- **Namespace conservatively**: Assume any common English verb might be claimed by core.
- **Monitor updates**: Check this document with each EasyCoder release.
- **Use plugin prefixes**: Consider namespacing with plugin name (e.g., `myplugin command`).

---

## How Core Handles Unknown Keywords

When the core parser encounters an unknown keyword:
1. It **does not error immediately**.
2. It rewinds and **passes control to each loaded plugin** in turn.
3. If no plugin claims the keyword, **then** a compile error is raised.

This graceful fallback is what enables the plugin architecture—but it requires **mutual respect** for reserved stems to work reliably.

---

## Contact & Feedback

If you're developing a plugin and unsure whether a keyword is safe, consult this document and test your plugin with the core test suite (`scripts/tests.ecs` or equivalent). If you discover a collision or ambiguity, report it via the issue tracker.

