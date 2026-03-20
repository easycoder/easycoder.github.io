# Set

## Syntax:
`set {variable}`  
`set {variable} to {value}`  
`set [the] elements of {variable} to {value}`  
`set element/property {name} of {variable} to {value}`  
``set [the] encoding to `utf-8`/`base64` ``

## Examples:
`set Flag`  
`set the elements of ThisVariable to 10`  
`set element 5 of MyList to NewValue`  
``set property `name` of MyProperties to `first` ``  
``set property `age` of MyProperties to Age``  
``set the encoding to `base64` ``

## Description:
`set` is a heavily used command in **_EasyCoder_**. Here in the core package it does the following, as listed in the Syntax above:

-- assigns the boolean true value to the named [variable](variable.md). See also [clear](clear.md) and [toggle](toggle.md).

-- assigns a specified number of elements to a variable - see [index](index.md). When used to change the size of an array the command preserves all elements that are not affected by the size change.

-- Sets an element or a property of a [variable](variable.md), providing it was intialised appropriately. Elements can be added to a variable that is intialised as JSON list, for example as ``put json `[]` into MyList``. Properties can be set on a variable that is initialised as a JSON object, for example as ``put json `{}` into MyProperties``. Note that this has nothing to do with the indexing of variables using [index](index.md). Each of the elements of such a variable can be treated as either a JSON list or as a JSON object, and either can be used for different elements of the same variable.

-- Sets the encoding to be used by the [encode](../values/encode.md) and [decode](../values/decode.md) value handlers. The encoder options are `utf-8` and `base64`. The default is `utf-8` if none is set by the script.

Next: [shuffle](shuffle.md)  
Prev: [send](send.md)

[Back](../../README.md)
