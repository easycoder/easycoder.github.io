# EasyCoder Plugin Contract (Draft 0.1)

Status: Draft
Version: 0.1
Applies to:
- EasyCoder JS browser runtime (`easycoder.github.io`)
- EasyCoder Python CLI runtime (`easycoder-py`)

## Purpose

This document defines a shared plugin/domain contract so both runtimes expose
comparable extension points, even where method names differ.

This is an interface-level contract. It does not require keyword-for-keyword
feature parity for every plugin.

## Contract Terms

- A runtime must provide domain/plugin registration.
- A domain must be discoverable by a stable domain name.
- A domain may provide handlers for keywords (commands), values, and conditions.
- Missing handlers are allowed when a domain does not implement that capability.
- Runtime dispatch must route command/value/condition handling by domain name.

## Domain Registration

### JavaScript runtime

- A plugin registers itself by setting:
  - `EasyCoder.domain.<name> = <DomainObject>`
- `<DomainObject>` is expected to expose:
  - `getHandler(token)` for compile-time keyword discovery
  - `run(program)` for runtime keyword dispatch
  - `value.compile(compiler)` and `value.get(program, value)` for values
  - `condition.compile(compiler)` and `condition.test(program, condition)` for conditions

### Python runtime

- A plugin is loaded via `import plugin <Class> from <module.py>` syntax.
- Runtime registration path:
  - `ECProgram.importPlugin()` loads module and class.
  - `ECProgram.useClass()` instantiates and stores handler by `getName()`.
- Plugin class should inherit `Handler` and provide:
  - `getName()`
  - keyword methods using prefixes: `k_<token>` and `r_<token>`
  - `compileValue()` and corresponding `v_<type>` handlers
  - `compileCondition()` and corresponding `c_<type>` handlers

## Shared Capability Map

- Keyword compile discovery:
  - JS: `domain.getHandler(token).compile(...)`
  - PY: `domain.keywordHandler(token)` -> `k_<token>`
- Keyword runtime execution:
  - JS: `domain.run(program)` -> per-keyword `handler.run(...)`
  - PY: `domain.runHandler(keyword)` -> `r_<keyword>`
- Value compile:
  - JS: `domain.value.compile(compiler)`
  - PY: `domain.compileValue()`
- Value runtime:
  - JS: `domain.value.get(program, value)`
  - PY: `domain.valueHandler(value_type)` -> `v_<type>`
- Condition compile:
  - JS: `domain.condition.compile(compiler)`
  - PY: `domain.compileCondition()`
- Condition runtime:
  - JS: `domain.condition.test(program, condition)`
  - PY: `domain.conditionHandler(condition_type)` -> `c_<type>`

## Compatibility Rules

1. Domain names must be unique within a runtime instance.
2. Handlers should return `None`/`null`/falsy when syntax is not handled,
   allowing other domains to attempt compilation.
3. Runtime errors should include enough context to identify domain and keyword.
4. Plugin loading failures must fail fast with a clear error message.

## Non-Goals (Spec 0.1)

- No requirement that plugin source code is interchangeable across runtimes.
- No requirement that browser-only plugins exist in Python.
- No requirement to standardize plugin packaging/distribution format yet.

## Notes for Conformance

Plugin parity is tracked at interface level in this phase.
Behavior-level plugin parity tests may be added in a later spec revision.
