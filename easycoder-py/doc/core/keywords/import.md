# import

## Syntax:
`import {type} {variable} [and {type} {variable} ...]]`  
`import plugin {classname} from {path}`

## Examples:
`import variable Name and variable Surname`  
`import plugin Points from plugins/example.py`

## Description:
First form:
This specifies which variable should be provided by a calling script.

Second form:
As with [script](script.md), `import` is a compiler directive that should be placed at the top of the script, under the [script](script.md) directive. It's used to call in a plugin language extension where needed. The example above is provided in the repository, to be used as a starting point for your own extra functionality.

Next: [increment](increment.md)  
Prev: [if](if.md)

[Back](../../README.md)
