# stop

## Syntax:
`stop`

## Example:
`stop`

## Description:
Stop execution of the current thread. The program will not exit as there may be other threads waiting to run.

**_EasyCoder_** performs "cooperative multitasking", whereby threads agree to not hog the processor. A long-running thread should occasionally [wait](wait.md) to relinquish the processor to other waiting threads, and when it finishes, the `stop` command will do the same.

Next: [system](system.md)  
Prev: [stack](stack.md)

[Back](../../README.md)
