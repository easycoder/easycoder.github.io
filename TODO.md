# EasyCoder — Language Enhancement TODO

Items identified during real project work. Each should be implemented in both JS and Python.

## High priority

### 1. ~~String split by delimiter~~ ✓ Done
Implemented in both JS and Python. The `split` command now accepts `by` in addition to `on`:
```
split MessageText by `|` into Parts
put element 0 of Parts into TopicName
```
New value expression for single-field extraction:
```
put field 0 of MessageText delimited by `|` into TopicName
```

### 2. ~~Append to JSON array in file~~ ✓ Done (Python only)
Implemented in Python. Creates `[]` if the file doesn't exist. Supports `or` error handling.

```
append `{"name":"test"}` to json file `data/topics.json`
```
JS not applicable — browser file writes use `rest post` to a server; the existing in-memory `append` command covers the JS use case.

## Medium priority

### 3. Storage get with defaults
`get X from storage` returns the string `"null"` or `"undefined"` when a key is missing, requiring repeated cleanup. Should return empty instead, or support a fallback:

**Proposed syntax:**
```
get Broker from storage as `chat-broker` or clear
```

### 4. Multi-field unpack with remainder
For protocols using delimited fields where the last field may contain the delimiter:

**Proposed syntax:**
```
unpack MessageText by `|` into TopicName Subject Author Body
```
Last variable gets the remainder.

---

*Source: friction points from the chat/forum project, April 2026.*
