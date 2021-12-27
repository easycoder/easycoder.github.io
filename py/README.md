### EasyCoder ###

This version of **_EasyCoder_** is written in Python, partly as an exercise and partly to build a viable alternative to Bash or Perl when creating shell scripts. There's currently no specific documentation outside of this ReadMe but many of the features are the same as in the JavaScript version.

The test script benchmark.ecs contains examples of most of the language features.

## How it works ##

The `easycoder.py` script starts by defining all the 'packages' that will be used. Each one of these handles a set of functionality related to a given application domain. Currently there is only one; the 'core' package, which contains things needed by virtually any programming language, like variables, control structures and so on.

Then it loads the requested scripts and calls Program to compile and run it.

### The Program class ###

This contains the script tokenizer, core runtime functions for getting values and conditions and error handlers. It calls the tokenizer then the compiler, then runs the resulting compiled script.

### The Compiler class ###

The compilation strategy is not a textbook one, with parsers and lexers and so on. It's a much simpler technique based on a hypothesis as to the way humans process written text, particularly when it's written in a foreign language. The strategy is to set up a marker, then starting with the first language package work along the incoming tokens, calling compilation modules until either a complete statement has been successfully processed or until one of the modules reports it is unable to perform the compilation. At this point the compiler backs up to the marker and tries again with another language package.

Much of the Compiler class consists of functions to return the current or next token, test the current token to see - for example - if it's a valid symbol in the script or return the 'value' of a token or that of a condition - see **Values and Conditions** below.

### The Core class ###

This class contans compiler and runtime modules for core keywords, values and conditions needed by virtually any programming language. Internally it has the following:

 - a `k_xxx()` function to compile each language keyword (where `xxx` is the keyword)
 - a `r_xxx()`function to run each language keyword
 - a `compileValue()` function to compile 'values'
 - a `v_xxx()` function to evaluate each runtime 'value'
 - a `compileCondition()` function to compile 'conditions'
 - a `c_xxx()` function to evaluate each runtime 'condition'

Each extension package has the same structure and deals with its own vocabulary and syntax.

The individual compiler functions make heavy use of the Compiler class to retrieve tokens and process them. When they successfully complete the compilation of any given language structure they return an 'intermediate code' object with some standard fields such as the name of the package (the 'domain'), the script line number, and other fields that relate to the specific keyword, value or condition. This object goes into the array that becomes the program to be run.

At runtime the **Program** class starts at the beginning of the program array and looks in the first compiled object to find which package it belongs to and the name of the keyword. It then calls the appropriate `r_xxx()` function, which does whatever is necessary for that keyword and returns an updated program counter. This is then used to repeat the process and so on.

### Values and Conditions ###

In EasyCoder a 'value' is anything that resolves to a numeric, string or boolean value, these being the 3 types that can be held in a `variable` - the primary storage type in the `Core` package. Constants are evaluated at compile time but anything else is deferred as its value may not be known until it is accessed. Examples are the contents of a variable, the time, the size or position of something or a value read from a remote server. In all these cases the `compileCondition()` function returns a _specification_ of how to get the value rather than attempting to return the value itself.

Similarly with conditions, these may also not be subject to evaluation at compile time so they are also deferred in the same way.

At runtime the `v_xxx()` and `c_xxx()` functions take the descriptions of the values and conditions and evaluate them. Sometimes there is a degree of recursion involved because some values can have other values as part of their definition. Examples are `left N of String`, which is a single value but references 2 variables.

EasyCoder has the concept of a `valueholder`. Every `variable` is one because it is able to hold a value, though other symbol types such as `file` or `table` (if/when these exist) may not. A symbol that is a valueholder can always be used in place of a constant, but the converse is not always true. For example, in `add X to Y` Y must be a valueholder, so `add X to 5` will cause a compilation error. Likewise, `add X to File` will most likely result in an error unless either `File` is a valueholder (e.g. declared as a `variable`) or another package allows this syntax to be used for its symbol types. On the other hand, `add the size of TheFile to Y` is legal, assuming `MyFile` is a symbol of a type that has a `size` attribute. None of this is very complicated; it's just common sense.