# fork

## Syntax:
`fork [to] {label}`

## Examples:
`fork RunBackgroundTask`  
`fork to RunBackgroundTask`

## Description:
`fork` is a special kind of [goto](goto.md), that causes the program to execute from the given label but also continue executing at the next command. The multitasking implied in this is handled by EasyCoder. Python programmers will know that the language is single threaded, so a cooperative technique is used internally to create the illusion of true multitasking.

When `fork` is used, the forked commands run until they reach a [stop](stop.md) or [wait](wait.md), then execution resumes at the command following the `fork`. If your forked commands comprise a loop, be sure to put in a short delay ([wait](wait.md)) to allow other 'processes' to get some CPU time.

The `to` keyword is optional and has no effect on execution—it's syntactic sugar for readability.

Next: [get](get.md)  
Prev: [exit](exit.md)

[Back](../../README.md)
