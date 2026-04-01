# EasyCoder — Language Enhancement TODO

Items identified during real project work. Each should be implemented in both JS and Python.

## High priority

### 1. String split by delimiter
Repeatedly needed for parsing delimited messages (e.g. `topic|subject|author|body`).

**Proposed syntax:**
```
split MessageText by `|` into Parts
put element 0 of Parts into TopicName
```
Or a targeted single-field form:
```
put field 0 of MessageText delimited by `|` into TopicName
```

### 2. Append to JSON array in file
The pattern of loading a JSON file, parsing, appending, re-serializing, and saving is fragile and repetitive.

**Proposed syntax:**
```
append `{"name":"test"}` to json file `data/topics.json`
```
Should create `[]` if the file doesn't exist and handle commas correctly.

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
