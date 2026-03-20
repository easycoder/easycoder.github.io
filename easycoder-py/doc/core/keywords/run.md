# run

## Syntax:
`run {name} {module} as [with {export} [and {export}...]]`

## Example:
``run Hello as `hello.ecs` with Name and Surname` ``

## Description:
Run a second script, optionally passing it variables it can use. Changes to these variables will be seen by the parent script (but see [lock](lock.md)). See also [module](module.md), [release](release.md), [send](send.md)and [on](on.md).

Next: [multiply](multiply.md)  
Prev: [lock](lock.md)

[Back](../../README.md)
