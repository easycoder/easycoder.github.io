# Core Value Operations: Reserved Stems & Patterns

This document inventories all **value-level operations** in the EasyCoder core module. These are operations that evaluate to a value (rather than executing as commands) and appear in expressions, assignments, and conditions.

**Purpose**: Plugin developers must avoid these stems in bare form to prevent collision. When creating value operations in plugins, use qualified forms or different terminology.

---

## String Operations

### Concatenation — `the cat of {value} and {value}`

**Canonical form** (plugin-safe):
```
put the cat of FirstName and LastName into FullName
set Message to the cat of Prefix and Suffix
```

**Shorthand form** (core-only):
```
put FirstName cat LastName into FullName
```

**Reserved stem**: `cat`

**Plugin guidance**: Use qualified forms like `string concat A with B` or `join A to B`. Avoid bare `cat` as a plugin verb.

---

### Substring Operations

#### `left {N} of {string}`
Extract N characters from the left of a string.

```
put left 5 of Message into Prefix
set Code to left 3 of Input
```

**Reserved stem**: `left` (in "left N of" form)

#### `right {N} of {string}`
Extract N characters from the right of a string.

```
put right 5 of Message into Suffix
set Extension to right 3 of Filename
```

**Reserved stem**: `right` (in "right N of" form)

#### `from {N} of {string}` / `from {N} to {M} of {string}`
Extract substring starting at position N, optionally ending at M.

```
put from 5 of Message into Remainder
put from 5 to 10 of Message into Segment
```

**Reserved stem**: `from` (in "from N of/to" form)

**Plugin guidance**: All three forms use preposition "of" as delimiter. Plugins can safely use bare `left`, `right`, `from` as verbs (e.g., `left align Widget`) but should avoid "X of" patterns for string operations.

---

## Array/List Operations

### Array Indexing — `element {N} of {array}` / `{array}[{N}]`

Access array element by numeric index (0-based).

**Canonical form**:
```
put element 2 of MyArray into Item
set Value to element 0 of List
```

**Shorthand form** (bracket notation):
```
put MyArray[2] into Item
```

**Reserved stem**: `element` (in "element N of" form)

**Plugin guidance**: Use qualified forms like `database record N of Table` or `item N in Collection`. Avoid bare "element N of" pattern.

---

### Array Search — `the index of {value} in {array}`

Find the numeric index of a value in an array (-1 if not found).

```
put the index of SearchTerm in Array into Position
if the index of Item in List is -1 log `Not found`
```

**Reserved stem**: `index` (in "index of X in" form)

**Plugin guidance**: Use "position of", "location of", or qualified forms like `database index of Record in Table`.

---

### Array Length — `the length of {array|string}`

Get the number of elements in an array or characters in a string.

```
put the length of MyArray into Count
set Size to the length of Text
```

**Reserved stem**: `length` (in "length of" form)

**Plugin guidance**: Use alternatives like "size of", "count of", or qualified "row count of Table".

---

## Object Operations

### Property Access — `property {name} of {object}` / `{object}.{name}`

Access object property by name.

**Canonical form**:
```
put property Name of Person into PersonName
set Value to property Status of Device
```

**Shorthand form** (dot notation):
```
put Person.Name into PersonName
```

**Reserved stem**: `property` (in "property X of" form)

**Plugin guidance**: Use qualified forms like `database field Name of Record` or `attribute X of Element`. The bare "property of" pattern is core-reserved.

---

## Encoding Operations

### Encode — `encode {value}`

Encode a value (default: URL encoding; configurable via `set the encoding to`).

```
put encode Message into Encoded
set EncodedData to encode Input
```

**Supported encodings**: `url` (default), `base64`

**Reserved stem**: `encode`

---

### Decode — `decode {value}`

Decode a value (uses current encoding setting).

```
put decode EncodedData into Plaintext
set Original to decode Base64String
```

**Reserved stem**: `decode`

**Plugin guidance**: Use qualified forms like `json decode`, `xml decode`, `binary encode` to avoid collision.

---

## Hashing & Cryptography

### Hash — `hash {value}`

Generate SHA-256 hash of a value (lowercase hex string).

```
put hash Password into HashedPassword
set Checksum to hash FileContents
```

**Reserved stem**: `hash`

**Plugin guidance**: Use qualified forms like `md5 hash`, `bcrypt hash`, or specify algorithm: `sha256 of Value`.

---

## Time & Date Operations

### Current Time — `now`

Get current Unix timestamp (seconds since epoch).

```
put now into CurrentTime
set StartTime to now
```

**Reserved stem**: `now`

---

### Timestamp — `the timestamp`

Get current time as formatted string (includes milliseconds).

```
log the timestamp
put the timestamp into LogEntry
```

**Reserved stem**: `timestamp`

---

### Date/Time Formatting — `datime {timestamp} [format {format}]`

Format Unix timestamp (in milliseconds) as date/time string.

```
put datime Now into FormattedTime
log datime 1735689600000 format `%b %d %Y %H:%M:%S`
```

**Reserved stem**: `datime`

**Plugin guidance**: Use qualified forms like `parse datetime`, `format date`, or library-specific names.

---

## System Information

### Memory Usage — `the memory`

Get current memory usage in megabytes.

```
log the memory
put the memory into MemUsage
```

**Reserved stem**: `memory` (in "the memory" form)

**Plugin guidance**: Use qualified forms like `system memory`, `process memory`, or specific metrics like `heap size`.

---

## Filesystem Operations

### Directory Listing — `the files in {path}`

List files in a directory (returns array of filenames).

```
put the files in `/tmp` into FileList
log the files in `.`
```

**Reserved stem**: `files` (in "files in" form)

**Plugin guidance**: Use qualified forms like `list files`, `directory entries`, or `filesystem scan`.

---

## Boolean/State Values

### Empty Value — `empty`

Represents an empty/null value.

```
set Label text empty
put empty into Variable
```

**Reserved stem**: `empty`

---

### Boolean Literals — `true` / `false`

Boolean constant values.

```
set Flag to true
if Condition is false log `Failed`
```

**Reserved stems**: `true`, `false`

**Plugin guidance**: Use qualified forms like `enabled state`, `active flag`, or plugin-specific states.

---

## Special Values

### Newline — `newline`

Platform-appropriate newline character(s).

```
put the cat of Line1 and newline and Line2 into Text
write Message cat newline to File
```

**Reserved stem**: `newline`

**Plugin guidance**: Use alternatives like `line separator`, `eol`, or qualified `text newline`.

---

## Reserved Value Stems Summary

| Stem | Pattern | Alternative for Plugins |
|------|---------|------------------------|
| **cat** | `the cat of A and B` | `concat`, `join`, `append` |
| **element** | `element N of Array` | `item N in`, `record N of` |
| **index** | `the index of X in Y` | `position of`, `location of` |
| **property** | `property X of Object` | `field X of`, `attribute X of` |
| **length** | `the length of X` | `size of`, `count of` |
| **left** | `left N of String` | Use in different context |
| **right** | `right N of String` | Use in different context |
| **from** | `from N of String` | Use in different context |
| **encode** | `encode Value` | `json encode`, `xml encode` |
| **decode** | `decode Value` | `json decode`, `xml decode` |
| **hash** | `hash Value` | `md5 hash`, `sha256 of` |
| **now** | `now` | `current time`, `timestamp` |
| **timestamp** | `the timestamp` | `formatted time`, `datetime` |
| **datime** | `datime N` | `parse datetime`, `format date` |
| **memory** | `the memory` | `system memory`, `heap size` |
| **files** | `the files in Path` | `list files`, `directory scan` |
| **empty** | `empty` | `null`, `blank`, `none` |
| **true/false** | `true`, `false` | `enabled/disabled`, `on/off` |
| **newline** | `newline` | `line separator`, `eol` |

---

## Pattern Guidelines for Plugin Developers

### 1. Article + Preposition Pattern (Safest)

Use full forms with articles and prepositions:

```
! Core pattern:
the cat of A and B

! Plugin-safe alternative:
the result of query on Database
```

**Why safe**: Articles ("the") + prepositions ("of", "in", "on") create clear boundaries.

---

### 2. Qualified Stems

Prefix operations with plugin name or domain:

```
! Core: encode Value
! Plugin: json encode Value

! Core: the index of X in Array
! Plugin: database index of Record in Table
```

---

### 3. Different Terminology

Use synonyms or domain-specific terms:

```
! Core: the length of Array
! Plugin: the size of Collection
! Plugin: the count of Records

! Core: property Name of Object
! Plugin: field Name of Record
! Plugin: attribute Name of Element
```

---

### 4. Avoid Bare Forms of Reserved Stems

**Don't do this**:
```
! Collision risk: plugin claims bare "cat"
cat FileA FileB into FileC
```

**Do this instead**:
```
! Safe: qualified form
file cat FileA and FileB to FileC
```

---

## Type-Checking Conditions (Also Reserved)

These appear in conditions rather than value expressions, but are equally reserved:

- `is numeric` — test if value is a number
- `is string` — test if value is a string
- `is boolean` — test if value is boolean
- `is object` — test if value is an object
- `is list` — test if value is an array/list
- `is empty` — test if value is empty/null

**Plugin guidance**: Use qualified forms like `is valid json`, `is xml document`, or domain-specific tests.

---

## Integration with Graphics Module

Graphics module extends core value operations with widget-specific forms (reserved for future implementation):

- `the title of Window` — get window title
- `the text of Widget` — get widget text content
- `the state of Checkbox` — get checkbox state
- `the width of Widget` — get widget width
- `the height of Widget` — get widget height

See [doc/graphics/PATTERNS.md](../../graphics/PATTERNS.md) for graphics-specific value operations.

---

## Testing Value Operations

To verify a value operation doesn't conflict:

1. Check this document for reserved stems
2. Search codebase for "v_{stem}" in value handlers (e.g., `v_cat`, `v_element`)
3. Check `RESERVED_STEMS.md` for verb-level conflicts
4. Test with core test suite: `python3 test.py`

---

## See Also

- [RESERVED_STEMS.md](../../RESERVED_STEMS.md) — Command/keyword reserved stems
- [doc/graphics/PATTERNS.md](../../graphics/PATTERNS.md) — Graphics syntax patterns
- [doc/core/values/](../values/) — Individual value type documentation
- [SYNTAX_REFACTORING.md](../../../SYNTAX_REFACTORING.md) — Overall refactoring plan

---

## Contributing

When adding new core value operations:

1. **Use the pattern**: Follow `the X of Y` for attribute-like operations
2. **Document here**: Add to this registry with examples and plugin guidance
3. **Update RESERVED_STEMS.md**: Cross-reference in main registry
4. **Test**: Ensure no plugin collisions in existing codebase
5. **Provide alternatives**: Suggest synonyms for plugin developers

---

**Last Updated**: Phase 1 completion (16 December 2025)  
**Status**: Complete core value operations inventory
