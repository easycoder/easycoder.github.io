# open

## Syntax:
`open {file} {path} for reading/writing/appending`
## Example:
`file File1`  
`file File2`  
`file File3`

``open File1 `oldvalues.txt` for reading``  
``open File2 `newvalues.txt` for writing``  
`read Value from File1`  
`write Value to File2`  
`close File2`  
`close File1`

``open File3 `somefile.txt` for appending``  
``write `some data` to File3``  
`close File3`

## Description:
Opens a disk file for reading, writing or appending. Each of the [file](file.md) variables must be declared as such as in the example.

Next: [pass](pass.md)  
Prev: [on](on.md)

[Back](../../README.md)
