# wait

## Syntax:
`wait {count} [millis/ticks/seconds/minutes]`

## Example:
`wait 5`  
`wait 10 mills`  
`wait Count ticks`  
`wait 1 minute`

## Description:
`wait` causes program execution to stop for a given time, expressed in millis, ticks, seconds or minutes. A milli is a millisecond and a tick is 10 milliseconds. The default is seconds. Only the current program thread stops; others may continue and events will still be handled.

By "thread" we mean the pseudo-threads **_EasyCoder_** uses to simulate multi-tasking. These operate on a cooperative basis, handing control from one to the next when a command such as `wait` is encountered. In practice, in a well-designed application threads are short enough for this task switching to be frequent enough to create the impression of true multitasking.

Next: [while](while.md)  
Prev: [variable](variable.md)

[Back](../../README.md)
