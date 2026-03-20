# EasyCoder Developer Resources: Complete Index

A comprehensive guide to all documentation, patterns, and references for working with EasyCoder's syntax, plugin architecture, and development practices.

---

## For Language Users

### Getting Started
- **[README.md](README.md)** — Overview, quick start, significant features
- **[doc/README.md](doc/README.md)** — Architecture: tokenizer, compiler, runtime engine

### Language Reference
- **[doc/core/README.md](doc/core/README.md)** — Core module keywords, values, conditions
- **[doc/graphics/README.md](doc/graphics/README.md)** — Graphics module features
- Individual keyword docs in `doc/core/keywords/` and `doc/graphics/keywords/`

### Example Scripts
- **`scripts/hello.ecs`** — Traditional first program
- **`scripts/fizzbuzz.ecs`** — FizzBuzz challenge solution
- **`scripts/benchmark.ecs`** — Performance benchmarking
- **`tests/tests.ecs`** — Comprehensive core language test (220 lines, 50+ features)
- **`tests/testg.ecs`** — Graphics application test (366 lines, real-world UI)

### Testing
- `python3 test.py` — Run core test suite
- `python3 testg.py` — Run graphics test suite

---

## For Plugin Developers

### Essential Reading (Read in Order)
1. **[PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md)** ⭐ **START HERE**
   - 5 core principles you must follow
   - 3 safe command patterns to choose from
   - 3 fully worked plugin examples
   - Validation checklist before publication
   - Automated collision detection commands

2. **[RESERVED_STEMS.md](RESERVED_STEMS.md)** — Required Reference
   - 30+ core reserved keywords
   - 25+ graphics reserved keywords
   - What to avoid when naming your plugin commands

3. **[doc/core/values/operations.md](doc/core/values/operations.md)** — Value-Level Reserved Stems
   - 18 value operations your plugin must not conflict with
   - Safe alternatives for each operation
   - Type-checking conditions that are reserved

4. **[doc/graphics/PATTERNS.md](doc/graphics/PATTERNS.md)** — Graphics-Specific
   - Graphics pattern conventions
   - Reserved widget types, attributes, signals
   - Guidelines for graphics plugin extensions

### Quick Reference
- **[SYNTAX_REFACTORING.md](SYNTAX_REFACTORING.md)** — Overall design philosophy and phases
  - Why syntax patterns exist
  - Plugin-safety rationale
  - Design principles summary

### Background/Context
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** — Handler development reference
  - Handler class structure
  - Compiler/runtime method reference
  - Key integration points

### Example Plugins to Study
- `plugins/points.py` — Simple coordinate plugin (good starting point)
- `plugins/sql.py` — Database integration
- `plugins/ec_keyboard.py` — Event-driven plugin
- **PLUGIN_PATTERNS.md Section 7** — 3 complete worked examples:
  - JSON plugin (encode/decode)
  - Database plugin (connect/query)
  - Graphics table widget

### Validation & Testing
- Run test suite before/after: `python3 test.py` and `python3 testg.py`
- Use collision detection scripts (see PLUGIN_PATTERNS.md)
- Follow validation checklist in PLUGIN_PATTERNS.md

### Common Patterns

**Safe plugin command**:
```
json encode Value
database query from Table giving Result
```

**Safe plugin value expression**:
```
the decoded form of JSONString
the result of query on Database
```

**Safe event handler**:
```
on Table row-selected do Handler
```

---

## For EasyCoder Maintainers

### Codebase Understanding
1. **[doc/README.md](doc/README.md)** — Architecture overview
   - Tokenizer, compiler, runtime engine
   - Helper functions in each phase
   - "Back up and retry" parsing strategy

2. **[.github/copilot-instructions.md](.github/copilot-instructions.md)** — Detailed API reference
   - Compiler methods (skip, nextValue, getCondition, etc.)
   - Runtime patterns (getVariable, putSymbolValue, etc.)
   - Handler structure and lifecycle

### Modification Guidelines

**When adding a new core keyword**:
1. Implement `k_{keyword}` (compile) and `r_{keyword}` (runtime) in `ec_core.py`
2. Add to [RESERVED_STEMS.md](RESERVED_STEMS.md) under Core Reserved Keywords
3. Create/update `doc/core/keywords/{keyword}.md` with syntax and examples
4. Add plugin-safety comment to handler if using special characters/patterns
5. Update [SYNTAX_REFACTORING.md](SYNTAX_REFACTORING.md) if changing patterns
6. Test with `python3 test.py`

**When adding a graphics keyword**:
1. Implement in `ec_graphics.py`
2. Add to [doc/graphics/PATTERNS.md](doc/graphics/PATTERNS.md) if it introduces new pattern
3. Create `doc/graphics/keywords/{keyword}.md` with examples
4. Update [RESERVED_STEMS.md](RESERVED_STEMS.md) under Graphics Reserved Keywords
5. Test with `python3 testg.py`

**When adding a value operation**:
1. Implement in appropriate handler (core, graphics, or plugin)
2. Document in [doc/core/values/operations.md](doc/core/values/operations.md) or [doc/graphics/PATTERNS.md](doc/graphics/PATTERNS.md)
3. Add to [RESERVED_STEMS.md](RESERVED_STEMS.md) under Reserved Value Stems
4. Test with `python3 test.py`

**When modifying plugin interface**:
1. Update [.github/copilot-instructions.md](.github/copilot-instructions.md) with new methods/signatures
2. Update all plugin examples (PLUGIN_PATTERNS.md)
3. Run all test suites: `python3 test.py` and `python3 testg.py`
4. Update [SYNTAX_REFACTORING.md](SYNTAX_REFACTORING.md) if breaking changes

### Code Quality Standards
- Python 3.9+ compatible (no `|` unions, use `Optional[T]`)
- Type hints with Optional/List where useful
- Clear error messages mentioning syntax patterns
- Plugin-safety comments on new handlers
- Cross-references between documentation
- Examples match actual implementation

### Testing Standards
- Core test suite: `python3 test.py` (220 lines, 701 tokens)
- Graphics test suite: `python3 testg.py` (366 lines, 840 tokens)
- All test suites must pass before commit
- Add new test cases for significant new features
- Test both success and error paths

### Documentation Standards
- Keyword docs: Syntax, Examples, Description, See Also (follow pattern in existing docs)
- Pattern docs: Problem statement, solution with examples, why it's safe
- Code examples: Use backticks for commands, CapitalCase for variables, lowercase for keywords
- Cross-references: Link between related docs (e.g., PATTERNS ↔ RESERVED_STEMS)
- Plugin-safety notes: Explain why a pattern is plugin-safe or reserved

---

## Phase Completion Status

- ✅ **Phase 1**: Core syntax consolidation (complete)
  - Optional "to", optional articles, skipArticles() helper
  - Documentation: fork.md, go.md, gosub.md, set.md, add.md

- ✅ **Phase 2**: Value operations registry (complete)
  - 18 value operations inventoried with alternatives
  - Documentation: doc/core/values/operations.md

- ✅ **Phase 3**: Plugin patterns guide (complete)
  - 5 core principles, 3 command patterns, 3 worked examples
  - Documentation: PLUGIN_PATTERNS.md, PLUGIN_PATTERNS.md

- ⏳ **Phase 4**: LSP integration (future)
  - Language server with collision detection
  - IDE support with pattern-aware completion

---

## Document Index by Purpose

### For Understanding Plugin Safety
| Document | Purpose |
|----------|---------|
| [PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md) | How to develop safe plugins |
| [RESERVED_STEMS.md](RESERVED_STEMS.md) | Which keywords are reserved |
| [doc/core/values/operations.md](doc/core/values/operations.md) | Which value operations are reserved |
| [SYNTAX_REFACTORING.md](SYNTAX_REFACTORING.md) | Why patterns exist |

### For Learning Patterns
| Document | Purpose |
|----------|---------|
| [doc/graphics/PATTERNS.md](doc/graphics/PATTERNS.md) | Graphics syntax patterns |
| [doc/core/README.md](doc/core/README.md) | Core language overview |
| [PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md) sections 1-6 | Pattern types and examples |

### For Implementing Handlers
| Document | Purpose |
|----------|---------|
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | API reference |
| [doc/README.md](doc/README.md) | Architecture |
| [PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md) section 7 | Worked implementations |

### For Testing & Validation
| Document | Purpose |
|----------|---------|
| [PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md) section 8 | Validation checklist |
| [PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md) section 9 | Collision detection |
| [tests/tests.ecs](tests/tests.ecs) | Core test cases |
| [tests/testg.ecs](tests/testg.ecs) | Graphics test cases |

### For Understanding Architecture
| Document | Purpose |
|----------|---------|
| [doc/README.md](doc/README.md) | Tokenizer, compiler, runtime |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Handler lifecycle |
| [SYNTAX_REFACTORING.md](SYNTAX_REFACTORING.md) | Design principles |

---

## Quick Reference: Finding Things

**"I want to add a keyword..."**  
→ See [.github/copilot-instructions.md](.github/copilot-instructions.md) for handler pattern  
→ See [PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md) sections 2-4 for safe patterns  
→ See existing keyword docs in `doc/core/keywords/` for template

**"I'm developing a plugin..."**  
→ Start with [PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md) section 1 (principles)  
→ Pick a pattern from sections 2-4  
→ Study examples in section 7  
→ Use checklist in section 8 before publishing

**"Is {keyword} already reserved?"**  
→ Check [RESERVED_STEMS.md](RESERVED_STEMS.md) for command keywords  
→ Check [doc/core/values/operations.md](doc/core/values/operations.md) for value operations  
→ Check [doc/graphics/PATTERNS.md](doc/graphics/PATTERNS.md) for graphics-specific

**"How do I handle optional {article|preposition}?"**  
→ Use `self.skipArticles()` for optional "the", "a", "an"  
→ Use `self.skip('to')` for optional specific token  
→ See examples in `ec_graphics.py` k_set, k_remove

**"My plugin syntax feels wrong..."**  
→ Compare against [PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md) patterns  
→ Run collision detection (section 9)  
→ Use validation checklist (section 8)

**"I need to understand the runtime engine..."**  
→ Read [doc/README.md](doc/README.md) sections 2-4  
→ See handler examples in [PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md) section 7

---

## File Locations Summary

```
easycoder-py/
├── README.md                          User overview
├── SYNTAX_REFACTORING.md              Design philosophy & phases
├── PLUGIN_PATTERNS.md                 ⭐ Plugin developer guide
├── RESERVED_STEMS.md                  Reserved keywords registry
├── PHASE_1_3_COMPLETION_REPORT.md     Final completion summary
├── .github/
│   └── copilot-instructions.md        Handler API reference
├── doc/
│   ├── README.md                      Architecture overview
│   ├── core/
│   │   ├── README.md                  Core module overview
│   │   ├── keywords/                  Individual keyword docs
│   │   └── values/
│   │       └── operations.md          Value operations registry
│   └── graphics/
│       ├── PATTERNS.md                Graphics patterns guide
│       ├── README.md                  Graphics module overview
│       └── keywords/                  Graphics keyword docs
├── easycoder/
│   ├── ec_compiler.py                 Compiler (skipArticles here)
│   ├── ec_handler.py                  Handler base class
│   ├── ec_core.py                     Core keywords
│   ├── ec_graphics.py                 Graphics keywords
│   └── ec_value.py                    Value operations
├── plugins/                           Example plugins
├── tests/
│   ├── tests.ecs                      Core test suite
│   └── testg.ecs                      Graphics test suite
└── scripts/                           Example scripts
```

---

## Support & Contributions

### Getting Help
1. Check the relevant document from this index
2. Search test files for working examples
3. Study plugin examples in `PLUGIN_PATTERNS.md`
4. Review `.github/copilot-instructions.md` for API details

### Contributing
1. Follow guidelines in relevant document (this index)
2. Use validation checklist from PLUGIN_PATTERNS.md section 8
3. Ensure all test suites pass
4. Update [RESERVED_STEMS.md](RESERVED_STEMS.md) if adding new keywords
5. Submit PR with documentation

### Reporting Issues
- Syntax collisions: Check [RESERVED_STEMS.md](RESERVED_STEMS.md) first
- Plugin pattern questions: Reference [PLUGIN_PATTERNS.md](PLUGIN_PATTERNS.md)
- Handler API questions: Reference [.github/copilot-instructions.md](.github/copilot-instructions.md)

---

**Last Updated**: 16 December 2025 (Phase 1-3 Complete)  
**Maintained By**: EasyCoder Development Team  
**License**: See LICENSE file  

---

## Related Resources

- **EasyCoder GitHub**: [https://github.com/easycoder/easycoder-py](https://github.com/easycoder/easycoder-py)
- **JavaScript Version**: [https://github.com/easycoder/easycoder.github.io](https://github.com/easycoder/easycoder.github.io)
- **Website**: [https://easycoder.github.io](https://easycoder.github.io)

