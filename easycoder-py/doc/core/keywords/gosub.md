# gosub

## Syntax:
`gosub [to] {label}`

## Examples:
`gosub CheckValues`  
`gosub to CheckValues`

## Description:
`gosub` is like `go` in that it transfers control to the named label. However, when the program encounters a `return` command, execution resumes at the command following the `gosub`.

The `to` keyword is optional—it's syntactic sugar for readability.

Next: [if](if.md)  
Prev: [go](go.md)

[Back](../../README.md)
