# if

## Syntax:
`if {condition} {true-outcome} [else {false-outcome}]`

## Examples:
`if Value1 is greater than Value2 put true into Result`  
``if Remaining is 0 print 'Finished` else add Remaining to ItemCount``

## Description:
`if` tests the condition that follows. If the result is `true` then control resumes at the named label; otherwise if there's an `else` section this is executed, then the program resumes at the next instruction after the `if`. See also [while](while.md).

Next: [import](import.md)  
Prev: [gosub](gosub.md)

[Back](../../README.md)
