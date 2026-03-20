# EasyCoder Syntax Refactoring & Standardization Plan

## Goals
1. **Consistency**: Establish canonical patterns for all keywords (verbs, prepositions, optional tokens).
2. **Readability**: Improve English-like flow while maintaining unambiguity for parsing.
3. **Plugin-safety**: Ensure core handlers gracefully yield to plugins; syntactic "noise" (articles, prepositions) serves as **disambiguation anchors** to avoid collisions.
4. **Extensibility**: Define clear patterns so new keywords/aliases follow consistent rules without risking collision or ambiguity.
5. **LSP-ready**: Minimize syntax variations to simplify future language server implementation.

---

## Critical Constraint: Plugin Safety & Syntactic Disambiguation

EasyCoder's strength is its extensibility via plugins. The core module must:
1. **Recognize graceful fallback**: If a keyword isn't in core, don't error—let plugins try.
2. **Use syntactic anchors**: Articles ("the", "a") and prepositions ("into", "to", "of") act as **delimiters** that signal intent and reduce false positives.
3. **Avoid ambiguous forms**: Bare word sequences (e.g., `cat A B`) risk collision with plugin keywords or future core additions.
4. **Reserve barebones patterns for plugin use**: A plugin might claim `cat` as a standalone verb; forcing core to use `the cat of A and B` leaves room.

### Example: Why Syntactic Noise Matters
- **Without noise**: `cat A B` could be confused with a plugin command `cat {file} {destination}` (imagine a file ops plugin).
- **With noise**: `the cat of A and B` is unambiguous—only a core/plugin string concatenation, never a file operation.
- **Human language parallel**: English uses "of", "the", "to" to disambiguate homonyms ("fly paper" vs. "the fly of paper" have different meanings).

### Implication for Proposed Enhancements
- **`set X to Y`**: Safe (full form with preposition; unlikely plugin conflict).
- **`the cat of A and B`**: Safer than `cat A B` (article + preposition reduces collision risk).
- **Optional `to` in `fork to Label`**: Safe (fork is reserved; "to" is optional precisely because fork can't collide).
- **Bare `cat A B`**: Risky (a plugin might claim `cat` as a verb; disambiguate with `the cat of A and B` in core).

---

## Current Syntax Patterns (Observations)

### Variable Declaration & Assignment
**Current forms:**
- `put {value} into {variable}` (core)
- `set {variable} to {value}` (proposed enhancement)

**Pattern**: `{verb} {object} {preposition} {target}`
- Verbs: `put`, `set` (and aliases like `assign`, `store`)
- Prepositions: `into`, `to`
- Should support both naturally without doubling parser complexity.

### Arithmetic Operations
**Current forms:**
- `add {value} to {variable}`
- `add {value1} to {value2} giving {variable}` (in-place vs. result)

**Pattern**: `{verb} {value} {preposition} {target} [giving {variable}]`
- Optional `giving` clause changes semantics (in-place vs. result).
- Supports multiple value forms (literals, variables, expressions).

### String Concatenation
**Current forms:**
- `{variable} cat {value}` (infix concatenation operator)

**Proposed enhancement (plugin-safe):**
- Core should use: `the cat of {value1} and {value2}` (functional style with articles/prepositions)
- Infix `A cat B` is syntactic sugar—risky if plugins claim `cat` as a standalone verb.

**Pattern**: 
- **Core canonical**: `the cat of A and B` (disambiguated with article + preposition).
- **Infix sugar**: Can be allowed as syntactic convenience *only if parser clearly marks it as restricted to core*.
- **Plugin designers**: Should avoid `cat` as a standalone keyword; if needed, use a qualified form (e.g., `file cat`, `binary cat`).

### Control Flow (Optional Prepositions)
**Current forms:**
- `fork to {label}`
- `go to {label}`
- `gosub to {label}` (optional "to")

**Pattern**: `{verb} [to] {target}`
- Many keywords should accept optional "to" without requiring it.
- Parser should use `skip('to')` liberally.

### Array/List Operations
**Current forms:**
- `append {value} to {array}`
- Element access: `element {N} of {array}` or `{array}[{N}]`

**Pattern**: Preposition consistency (e.g., all use "to" for targets, all use "of" for containment).

---

## Proposed Refactoring (Phase 1)

### 1. Assignment/Setting Verbs (Plugin-Safe)
**Canonical:** Both `put … into …` and `set … to …` should compile to the same operation.
- **Why safe**: Both use full prepositions ("into", "to"), reducing plugin collision risk.
- **Handler change**: In `k_set` (new), parse both forms and normalize to internal representation.
- **Documentation**: Update docs to show both as equivalent.
- **Example**:
  ```
  put 0 into Counter           ! existing core form
  set Counter to 0             ! new equivalent form
  ```

### 2. String Concatenation (Plugin-Safe Enhancement)
**Canonical for core**: Use `the cat of A and B` (full form with article + preposition).
- **Why safer**: The article ("the") + preposition ("of") + conjunction ("and") create a syntactic "fence" that prevents collision with plugin `cat` verbs.
- **Existing infix `A cat B`**: May be retained as documented sugar *within core only*, with clear warnings in plugin docs.
- **Handler change**: Extend value parsing to recognize both forms; prefer full form in examples and documentation.
- **Documentation**: Show full form as canonical, infix as optional shorthand with plugin-collision caveats.
- **Example**:
  ```
  ! Canonical (plugin-safe):
  set Message to the cat of Prefix and Suffix
  
  ! Shorthand (use with caution if plugins define 'cat'):
  set Message to Prefix cat Suffix
  ```

### 3. Optional "to" in Core-Reserved Keywords (Plugin-Safe)
**Canonical**: Keywords like `fork`, `go`, `gosub`—which are core-reserved—accept optional "to".
- **Why safe**: These keywords are reserved in core, so no plugin can claim them; optional "to" adds convenience without ambiguity.
- **Handler pattern**: Use `skip('to')` before parsing the target.
- **Apply to**: `fork`, `go`, `gosub`, `goto`, and similar core-only verbs.
- **Example**:
  ```
  fork RunTask           ! without "to"
  fork to RunTask        ! with "to" (both compile identically)
  ```

### 4. Articles in Value Expressions (Selective, Plugin-Safe)
**Canonical**: Use articles and prepositions in value operations to disambiguate.
- **Full forms (preferred)**: `the cat of A and B`, `the element 0 of Array`, `the property Name of Object`.
- **Shortened forms (use only if unambiguous)**: Avoid bare patterns (e.g., `element 0 Array`) unless clearly reserved.
- **Parser helper**: Add a `skipArticles()` method for optional "the", "a" in safe contexts.
- **Use sparingly**: Only where grammar and plugin isolation permit.
- **Example**:
  ```
  ! Preferred (plugin-safe):
  the element 0 of Array
  the index of X in Array
  the property Name of Object
  ```

### 5. Method/Function Names & Built-in Operations (Plugin-Aware Registry)
**Goal**: Inventory all operations that act on values during compilation, with plugin-collision awareness.
- **Current examples**: `cat`, `element N of`, `index of`, `property of`, `length of`.
- **Action**: Maintain a registry (e.g., `doc/core/values/operations.md`) with:
  - **Reserved stems**: Words/phrases claimed by core (e.g., `cat`, `element`, `property`).
  - **Safe forms**: Full forms with articles/prepositions (e.g., `the cat of`, `the element 0 of`).
  - **Plugin notes**: Which forms are off-limits to avoid collision.
- **Pattern**: All value operations should use article + preposition patterns (e.g., `the X of Y and Z`) to maximize plugin room.

---

## Implementation Strategy (Plugin-Safe Approach)

### Phase 1: Core Syntax Consolidation (Immediate, Plugin-Safe)
1. **Add `set … to …` support** in `ec_core.py` (mirror existing `put … into …` logic).
2. **Document dual syntax** in keyword docs (both forms equivalent and plugin-safe).
3. **Enhance string concatenation**: Support `the cat of A and B` as canonical form; document `A cat B` as shorthand with plugin-collision warnings.
4. **Add `skipArticles()` helper** to compiler for optional "the", "a" in disambiguated contexts.
5. **Update core-reserved keywords** (`fork`, `go`, `gosub`) to use `skip('to')` for optional "to".
6. **Document plugin implications**: Add section to plugin dev guide warning about reserved stems.
7. **Test with existing scripts**: Ensure no regressions; validate new forms compile correctly.

### Phase 2: Plugin-Aware Registry ✅ Complete
1. ✅ **Created `doc/core/values/operations.md`**: Comprehensive inventory of value-time operations with plugin notes.
   - String operations: `the cat of`, `left/right/from N of`
   - Array operations: `element N of`, `the index of X in`, `the length of`
   - Object operations: `property X of`
   - Encoding: `encode`, `decode`, `hash`
   - Time: `now`, `timestamp`, `datime`
   - System: `the memory`, `the files in`
   - All with plugin-safe alternatives documented
2. ✅ **Reserved stems defined**: Complete table with 18 value stems and plugin alternatives.
3. ✅ **Plugin guidelines**: Four patterns documented (article+preposition, qualified stems, synonyms, avoid bare forms).

### Phase 3: Extension Pattern Documentation ✅ Complete
1. ✅ **Created `PLUGIN_PATTERNS.md`**: Comprehensive guide (500+ lines) for safe plugin development.
   - **5 core principles**: Check reserved stems, use syntactic anchors, qualify forms, prefer full forms, use lowercase
   - **3 safe command patterns**: `{plugin} {verb}`, `{verb} via {plugin}`, attribute-centric operations
   - **2 safe value patterns**: `the {operation} of {input}`, infix notation (use sparingly)
   - **Event handler extension**: Safe event patterns for graphics plugins
   - **Graphics widget extension**: New widget types and attributes
   - **3 worked examples**: JSON plugin, database plugin, table widget plugin (all complete with usage)
   - **Validation checklist**: 6-part checklist (namespace, syntax, handlers, testing, docs, code quality)
   - **Collision detection**: Automated grep checks + manual verification steps
   - **Best practices table**: Do's and don'ts with examples
2. ✅ **Safe patterns documented**: Command patterns, value expressions, conditions, event handlers
3. ✅ **Plugin examples**: Fully worked implementations showing proper handler structure

### Phase 4: LSP Validation (Post-Refactoring)
1. **LSP server reads registries**: Consults reserved-stems and core operations lists.
2. **Completion hints**: Only suggest keywords that don't collide with loaded plugins.
3. **Diagnostics**: Warn if a plugin keyword conflicts with reserved stems; suggest alternatives.

---

## Key Compiler Methods to Leverage

From `ec_compiler.py` and `ec_handler.py`:
- **`skip(token)`**: Consume optional token without failing (use liberally for optional "to", "the", etc.).
- **`nextToken()`, `peek()`**: Standard lookahead.
- **`nextValue()`**: Parse complex value expressions recursively (extend to recognize full forms like `the cat of`).
- **`getSymbolRecord()`**: Retrieve variable/label metadata.
- **`nextIs(value)`, `tokenIs(value)`**: Conditional parsing.

**New helper to add**:
- **`skipArticles()`**: Consume "the", "a", "an" if present; return success regardless (optional articles).
- **`skipPrepositions(words)`**: Consume optional prepositions from a list (e.g., `skip(['to', 'into'])` for assignment).

---

## Design Principles Summary

1. **Use articles + prepositions as syntactic anchors**: Reduces plugin-collision risk.
2. **Reserve only what's necessary**: Don't claim bare verbs unless core truly owns them.
3. **Document reserved stems**: Plugins know what to avoid.
4. **Prefer full forms in canonical examples**: Encourages plugin-safe code.
5. **Allow shortcuts for core-reserved keywords**: Since core owns them, optional tokens are safe.
6. **Fail gracefully**: If core doesn't recognize a keyword, pass it to plugins without error.

---

## Expected Outcomes

After Phase 1–2:
- ✅ New keywords follow plugin-safe patterns (verbs with prepositions, articles as disambiguators).
- ✅ Core reserves stems and documents them; plugins know what to avoid.
- ✅ Synonymous forms (e.g., `put`/`set`, full `the cat of` / shorthand `A cat B`) are transparent and documented.
- ✅ Parser code is consistent, defensive, and extensible.
- ✅ Documentation clearly shows all supported syntax forms and plugin implications.
- ✅ LSP server can use pattern + registry to provide collision-aware completion and diagnostics.
- ✅ Plugin developers have clear guidance on safe naming and syntax patterns.

---

## Next Steps

1. **Review plugin-safety constraints**: Do these principles align with your plugin architecture?
2. **Prioritize Phase 1**: Start with `set`/`put`, full `the cat of` form, optional `to` for core-reserved keywords.
3. **Draft reserved-stems list**: Document what core claims (e.g., `cat`, `element`, `index`, `property`, `length`).
4. **Implement & test**: I can code Phase 1 changes and validate with existing scripts + new test cases.
5. **Refine iteratively**: Gather plugin feedback and adjust reserved stems as needed.



