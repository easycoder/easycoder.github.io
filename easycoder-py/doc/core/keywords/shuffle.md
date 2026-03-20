# shuffle

## Syntax:
`shuffle {variable}`

## Example:
`shuffle MyList`

## Description:
Shuffles (reorders randomly) the contents of the named array.
EasyCoder has two array mechanisms. One is to hold a single value comprising a list of items (typically expressed as a JSON list). This is the type that can be shuffled with this command.

The second mechanism is where any variable can have multiple elements, an internal `index` variable specifying which element is pointed to. This kind of array always acts like a single value, and cannot be shuffled. See [set the elements of](set.md).

Next: [split](split.md)  
Prev: [set](set.md)

[Back](../../README.md)
