# while

## Syntax:
`while {condition} {block}`

## Example:
`put 0 into N`  
`while N is less than 10`  
`begin`  
`  gosub DoSomething`  
`  add 1 to N`  
`end`

## Description:
`while` tests a condition, and if the result of the test is true it executes the command (or [begin…end](begin.md) block) that follows. It then repeats the test and continues to do so until the test fails.

When constructing loops like this it's common for programmers to forget to bump the loop counter, resulting in a tight loop that can bring the browser - and the computer - to its knees and risk overheating of the CPU in the process. It's surprisingly easy to get this wrong during development! **_EasyCoder_** looks out for this happening and usually stops your script before any harm can be done.

Next: [write](write.md)  
Prev: [wait](wait.md)

[Back](../../README.md)
