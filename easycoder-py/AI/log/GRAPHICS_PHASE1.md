# Graphics Module Phase 1: Syntax Consistency & Standardization

## Overview
This phase aligns graphics module syntax with Phase 1 core refactoring (optional "to", article/preposition consistency, plugin-safe patterns). The goal is to ensure graphics keywords follow the same standardized patterns as core, making the language more cohesive and predictable.

---

## Phase 1 Goals

1. **Standardize optional "to" in graphics commands** where appropriate.
   - Example: `set the layout of Window to MainPanel` → allow both forms naturally.
   - Example: `add Widget to Layout` already uses prepositions correctly.

2. **Adopt article/preposition patterns for attribute access**.
   - Example: `set the background of Window to blue` (with article "the").
   - Example: `the title of Window` as value expression (canonical form).

3. **Ensure graphics keywords gracefully handle optional syntax**.
   - Use `skip()` helper for optional prepositions.
   - Use `skipArticles()` for optional articles in attribute expressions.

4. **Document graphics-specific syntax patterns** with examples.
   - Create `doc/graphics/PATTERNS.md` guide for attribute access.
   - Update keyword docs to show optional [to] and article variants.

5. **Validate with existing graphics test suite** (`testg.ecs`).
   - Ensure no regressions; test new optional forms compile correctly.

---

## Planned Changes

### 1. Graphics Handler Standardization (`ec_graphics.py`)

#### `k_set` / `r_set` — Attribute Setting
**Current forms:**
```
set the layout of Window to MainPanel
set the text of Button to `Click me`
set the background of Window to 255 255 200
```

**Pattern enhancement:**
- Already uses `the … of … to` pattern (good!).
- No changes needed to syntax, but ensure skipArticles() is called where appropriate.
- Document as canonical form in keyword reference.

#### `k_add` — Widget/Layout Operations
**Current forms:**
```
add Widget to Layout
add stretch Widget to Layout
add spacer size 10 to Layout
add Widget at 0 1 in GridLayout
```

**Already plugin-safe:**
- Uses prepositions ("to", "in") correctly.
- Optional elements use clear syntax (e.g., "stretch", "spacer", "size").
- No changes needed; document existing forms.

#### `k_create` — Widget/Window Creation
**Current forms:**
```
create Window title `My Window` size 700 500
create Button text `Click me`
create Layout type QVBoxLayout
```

**Pattern notes:**
- Attribute assignment uses bare syntax (e.g., `title`, `size`).
- Could be enhanced with optional articles/prepositions for readability.
- **Phase 1 decision**: Keep as-is (working well); Phase 2 could standardize further.

#### `k_attach` — Signal/Slot Connections
**Current form:**
```
attach Button clicked to MySlot
```

**Pattern:**
- Already uses "to" preposition (good).
- Document as canonical; no changes needed for Phase 1.

### 2. Graphics Keyword Documentation Updates

Update `doc/graphics/keywords/` to show optional forms:

- **set.md**: Document both `set the X of Y to Z` and variations with optional articles.
- **add.md**: Show optional "to" (already present; just clarify in docs).
- **create.md**: Clarify attribute syntax with examples.
- **attach.md**: Document signal/slot syntax with "to" preposition.

### 3. Graphics Value Expressions

**New pattern proposal:**
```
the title of Window              ! attribute access (full form with article)
the size of Button               ! widget dimension
the enabled state of Widget      ! boolean state
```

**Handler changes:**
- Extend value parsing to recognize `the … of` patterns for widget attributes.
- Add to `compileValue()` or `compileValueType()` in graphics handler.
- Fall back gracefully to core patterns if no match.

### 4. Graphics Conditions (Optional)

**Future enhancement (not Phase 1):**
```
if Button is clicked log `Clicked!`
if Window is shown log `Visible!`
```

**Phase 1 decision**: Document existing patterns; revisit in Phase 2 if needed.

---

## Implementation Checklist

### Code Changes
- [ ] Review `ec_graphics.py` `k_set`, `k_add`, `k_create`, `k_attach` for consistency.
  - [ ] Ensure all use `skip()` for optional prepositions.
  - [ ] Add skipArticles() calls where parsing attribute names (e.g., `the title of`).
  - [ ] Verify error messages mention optional forms.

- [ ] Extend graphics value parsing for `the X of Widget` patterns.
  - [ ] Add recognizer in graphics handler's value parsing.
  - [ ] Test with `set X to the title of Button` syntax.

- [ ] Add plugin-safety comments to graphics handlers.
  - [ ] Document why certain forms are chosen (e.g., full "the … of" for attributes).
  - [ ] Note which stems are reserved vs. available for plugins.

### Documentation Updates
- [ ] Update `doc/graphics/keywords/set.md`: Show optional articles, link to patterns guide.
- [ ] Update `doc/graphics/keywords/add.md`: Clarify preposition usage, note optional "to".
- [ ] Update `doc/graphics/keywords/create.md`: Show attribute syntax examples.
- [ ] Update `doc/graphics/keywords/attach.md`: Document "to" preposition pattern.
- [ ] Create `doc/graphics/PATTERNS.md`: Graphics-specific syntax guide.
  - Explain attribute access (with/without article).
  - Show value expression forms (e.g., `the title of Window`).
  - Note reserved stems in graphics (e.g., "title", "size", "enabled").

### Testing
- [ ] Run existing `testg.ecs` to ensure no regressions.
- [ ] Create test cases for new optional forms (if any syntax changes made).
- [ ] Test `the X of Widget` value expressions.
- [ ] Validate error messages for malformed graphics commands.

---

## Expected Outcomes

After Phase 1:
- ✅ Graphics module syntax is consistent with core refactoring (articles, prepositions, optional tokens).
- ✅ Documentation clearly shows canonical and alternative forms.
- ✅ Keyword handlers follow standardized patterns (skip(), skipArticles()).
- ✅ Value expressions extend to graphics attributes (`the title of Window`).
- ✅ Existing `testg.ecs` still passes; new forms validate correctly.
- ✅ Graphics-specific patterns guide available for plugin developers (prevents collisions).

---

## Next Steps (Post-Phase 1)

### Phase 2: Graphics Value Operations Registry
- Inventory graphics-specific value stems (e.g., "title", "size", "color", "enabled").
- Document which are core-claimed vs. available for plugins.
- Create `doc/graphics/values/operations.md` (parallel to core operations list).

### Phase 3: Graphics Conditions & Events
- Standardize event/signal syntax (e.g., `on Button clicked …`).
- Extend condition parsing for widget state checks.
- Document patterns for event handling.

### Phase 4: LSP Graphics Support
- Graphics LSP server consumes patterns + registry.
- Provides completion for widget attributes, event names.
- Warns on collisions or deprecated syntax.

---

## Key Integration Points

1. **Compiler reuse**: Use core's `skip()` and new `skipArticles()` helpers in graphics handlers.
2. **Value parsing**: Extend core's `compileValue()` to recognize graphics-specific forms gracefully.
3. **Plugin boundaries**: Reserve graphics stems to prevent plugin collision.
4. **Documentation precedent**: Follow core keyword doc style (syntax, examples, description, plugin notes).

---

## Rationale: Why Consistent Syntax Matters

- **Learnability**: Users learn one pattern in core; graphics uses the same pattern.
- **Predictability**: "I know this word means X in core; it means X in graphics too."
- **Extensibility**: Plugins see clear, consistent examples; less chance of collision or confusion.
- **LSP-readiness**: Language server can apply unified rules across core + graphics + plugins.
- **Maintenance**: Fewer syntax variations = fewer edge cases, easier debugging.

