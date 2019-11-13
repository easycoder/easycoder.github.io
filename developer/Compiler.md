# The EasyCoder Compiler #

The compiler, _Compile.js_, takes the list of tokens from the tokenizer and creates a program with them. Most of its functions deal with extracting tokens from the stream and examining them in various ways.

The output program is a list (array) of program steps. Each of these is an object with three fixed fields and any number of optional ones. The fixed fields are as follows:

### domain ###

The name of the _domain_, which you might regard as equivalent to a _package_ in Java. It's either _core_ for the built-in commands or the name of an extension plugin module such as _browser_ or _json_. It tells the runtime engine which part of the system will be able to run the command.

### keyword ###

The name of the command, usually (but not always) the same as what was typed in the script, Each domain handler has a map of command names so it can go instantly to the approprite handler.

### lino ###

The line number in the source, enabling the system to display a meaningful source extract for debugging or for reporting errors.

## How it compiles ##

The compiler itself is a group of functions that do various steps in setting up to compile a particular set of tokens. Eventually all of them lead to _compileToken()_, which examines the current token in the stream. Starting with _core_ it asks each of the domain handlers in turn if it is able to compile the command, stopping when one of them returns true, having placed an element of compiled code into the program array. (Any other handlers that have been called will have all returned false.) The compiler then moves on to the next token.

When a symbol is declared its name goes into a symbol table with the current value of the program counter. Symbol names should start with a capital letter; if they do not, the compiler will still accept them but the editor will fail to color them properly. Program labels are just symbols followed by a colon so they also go in the symbol table. The data for a symbol is somewhat more extensive than for other commands; see the source of _compileVariable()_ for a list of the items present for all variables (some have additional items added by their own compiler functions), most of which should be described somewhere in these notes. The purpose of some items is obvious from their names; others less so.

At this point I should make a note about arrays. Every variable in **_EasyCoder_** is an array, by default having a single value held as a single element array in the _value_ property of the variable. If you need multiple values you create an array of values with as many elements as you need. The property _index_ points to the current index, initially 0, so the array always behaves like a single value, and you can move the index at any time to point to another element of the array. This technique neatly avoids complex symbolic representations such as square brackets, at the price of a little more work in managing and preserving index values, especially when programming concurrent threads. [That was not a mistake; **_EasyCoder_** simulates concurrency using a cooperative multitasking technique to create the impression of being able to do several things at once.]

I described above how the compiler calls each of the domain handlers in turn to find one that can handle the syntax presented. The code to do this is structurally the same in the core and all the plugins, so you can use _Core.js_ as an example. That's in the next page.

Next: [The Keyword Compilers](Core.md)

[Developer Manual](Developer.md)

[The Runtime Engine](Runtime.md)

[The ReST Server](REST.md)