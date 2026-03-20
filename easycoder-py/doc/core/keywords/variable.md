# variable

## Syntax:
`variable {name}`

## Example:
`variable Count`

## Description:
Declare a variable - an arbitrary storage item. Variables may hold string, numeric or boolean data; if you're not sure what is currently held there are value commands that return the type. A variable is initialised with a single element and with any content. The compiler will detect if a variable has never been used in the entire program; this is reported at runtime but is not an error, but if an attempt is made to read from a variable that hasn't been initialised, it is an error.

Variables can be assigned any number of elements - see [set the elements](set.md). Each element can hold a data value of any of the 3 types above.

Next: [wait](wait.md)  
Prev: [use](use.md)

[Back](../../README.md)
