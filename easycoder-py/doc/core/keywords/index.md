# index

## Syntax:
`index {variable} to {value}`

## Examples:
`set the elements of List to 10`  
`index List to 5`  
`put Result into List`

## Description:
`index` is a special command for array handling. In EasyCoder, all variables are arrays. Initially they only have one element but you can [set](set.md) an array to have as many elements as you like, using `set the elements of {variable} to {value}`. Inside each array is the current index for the array, which you can set to any value within the number of elements in the array. The array is still used as if it were a simple variable and only the element pointed to by the index is affected by whatever you do with the array. Where multitasking is used - with [fork](fork.md) or by handling an event - you must be careful to set the index before using the array if there's any chance it may have been modified by another thread.

Next: [init](init.md)  
Prev: [increment](increment.md)

[Back](../../README.md)
