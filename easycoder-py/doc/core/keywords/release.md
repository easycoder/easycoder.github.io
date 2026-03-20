# release

## Syntax:
`release parent`

## Example:
`release parent`

## Description:
Release the parent script. When a child module is run it blocks the parent from running until either it exits or it issues the `release parent` command. This allows it to do initialisation that cannot be interrupted but which may involve timed delays.

Next: [replace](replace.md)  
Prev: [read](read.md)

[Back](../../README.md)
