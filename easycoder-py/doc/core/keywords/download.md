# download

## Syntax

download [binary] {url} to {path}

## Parameters

- `binary` (optional): If present, downloads the file in binary mode.
- `url`: The URL to download from.
- `path`: The local file path to save the downloaded content.

## Description

Downloads a file from a URL to a local path. If `binary` is specified, the file is saved in binary mode; otherwise, as text.

## Examples

```
download `http://example.com/file.txt` to `local.txt`
download binary `http://example.com/image.png` to `image.png`
```

## See Also

- [get](get.md)
- [save](save.md)

Next: [exit](exit.md)  
Prev: [download](download.md)

[Back](../../README.md)
