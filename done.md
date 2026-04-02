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

