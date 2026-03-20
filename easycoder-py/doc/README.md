# How it works

***EasyCoder*** is a combined compiler and runtime for a high-level English-like script. Compilation is very quick - typically of the order of 10 lines per millisecond - so there is no need to run the compiler as a separate pass.

## The tokeniser

The tokeniser reads the script, line by line, and extracts tokens from it. Tokens are generally space-delimited single words; the exceptions being

- quoted strings, where the quote marks are backticks. A quoted string may not continue over multiple lines but there is a mechanism for creating multiline strings, by starting each new line with a backtick.
- comments, where an exclamation mark appears at any point in a line (not counting quoted strings). Everything from this point on to the end of the line is taken to be part of the comment and is not passed through as a token.

The tokeniser create a list of lines and a separate list of tokens. Each token is a tuple containing the text of the token plus the line number on which it occurs.

## The compiler

The compiler first creates an empty code list. It then starts at the beginning of the token list and examines the first token. This will always be a command keyword or a variable declaration (also classed as a keyword).

For every valid keyword, somewhere in the system there is a compiler function with the keyword prefixed by `k_`, such as 'k_add', 'k_if' or 'k_set'. Compiler functions are held in packages of related commands, such as

- a core package containing all the commands generally used by any programming language.
- a graphics package containing commands relating to on-screen graphics.
- custom plugin packages that add extra functionality to the language, to meet the requirements of specific application domains. Plugins can be added dynamically to gain instant access to additional vocabulary and/or syntax.

As the compiler progresses through the token list it first extracts the command keyword, then searches for the corresponding `k_` function in the known packages. When this is found it is called to compile the specific command, and returns `True` or `False` for success or failure. Failure does not necessarily mean an error, as the same command keyword can appear in more than one package. If no package returns `true`, an error is then assumed. The error report can include lines leading up to the error.

Every time a variable definition is encountered it is added to the symbol table; a dictionary that holds the value of each variable against its name. Every compiled command is added to to the code list, which when complete becomes the program ready to run.

## The runtime engine

The runtime engine starts at the beginning of the code list and picks up one entry at a time. Each one contains the original keyword as one its elements, and as with the compiler modules there is a corresponding `r_` ('r_add', 'r_if', 'r_set' etc) runtime handler function. The domain (package) is also identified in the compiled item, so there's no need to search for the runtime handler; just go directly to the appropriate package and call the `r_` function. Each runtime command contains the index of the next command to run in the code list; mostly the one immediately following, but flow control commands such as 'if', 'while', 'goto', 'on' etc take the program flow elsewhere.

## Helper functions

Both the compiler and runtime functions make extensive use of helper functions in the main compiler and program modules. For compilation, these include

- Get the current token
- Get the next token (advances the token index)
- Skip a given token value
- Peek ahead without advancing the token index
- Check if the current token is a symbol
- Check if the next token is a symbol
- Get the record for a given symbol name
- Add a command to the program

The runtime engine has helper functions such as

- Get a variable record given the name of the variable
- Check the type of a variable
- Get the value held by a variable
- Set the value of a variable
- Evaluate a condition

## Values

All values are held in a special `ECValue` object, which contains the type of the value and its content. Numbers and text can be held as constant values but many entites have values that can't be known at compile time, such as the date or the size of a file. To deal with this, many values are instructions on how to get the actual value at runtime. As a simple example, a negate command is held as a 'negate' type and the value to be negated, which will in this case be a variable name. Values such as `left`, `right` or `size of` may operate on another `ECValue`, which is then evaluated recursively. Strings are concatenated using the word `cat` and the parts are held separately until runtime.This allows compound constructs such as

```
print `Value: ` cat left 10 of SomeText
```

As with spoken or written English, such constructs can be ambiguous, depending if they should be interpreted strictly left to right or assumed to be grouped. An example of this is

```
... the size of Text cat ` items`
```

The compiler will deal with `cat` before `the size of`, which may not be what was intended. Since parentheses are not currently available in the language, complex expressions are best broken up into component parts and evaluated one by one.

## Dictionaries, lists and arrays

***EasyCoder*** has several ways to handle values that have more than one element. There are 3 basic variable types:

### variable

This can contain any simple item such as a string, a numeric value or a boolean.

### dictionary

This is a wrapper for a Python `dict`, which holds a set of key-value pairs. As its name suggests, items can be searched for by their keys. You can also get a list of all the keys in a dictionary, so they can be iterated. Dictionaries can hold any form of data, including other dictionaries or lists, so they can at times represent very complex data structures.

### list

This is a wrapper for a Python `list`, which holds an array of items, any of which can be simple vaiable types, dictionaries or other lists.

As well as all this, every ***EasyCoder*** variable can have multiple elements. Every variable has an internal `index` value that identifies which of its elements is current. All operations using the variable take place on that selected element, avoiding the need to identify it each time. This is a little like the way SQL handles cursors.

A typical use for this might be where you have a set of employees, each with name, age, address, payroll number and so on held as a dictionary. To hold the comple set of employees you might put them into a list, or use a dictionary to hold each one with their name or payroll number being the key. Alternatively you can use

```
set the elements of Employees to 50
```

and use an index variable to access them in turn:

```
set N to 0
while N is less than 50
begin
   index Employees to N
   ! Do something with this employee record
   print entry `name` of Employees
   ...
   increment N
end
```
This feature can be used with any kind of variable, including graphic objects and special entities defined in language plugins. Such items can not be included in dictionaries or lists if they cannot be serialized, but this feature allows them to be handled as arrays, where each element is a discrete entity selected via its index value.

## Synonyms and syntactic noise

At the current stage of development there is usually just one way to express a given function. English is replete with alternatives that all mean the same thing and additional words that carry no actual meaning but make a sentence easier to read, and there is no reason why many of these cannot be implemented in ***EasyCoder*** as a means to make scripts more readable. An example might be

```
create Label text `Summary` in Panel
```

which might be expressed more clearly (and verbosely) as

```
create Label with text `Summary` and add to Panel
```

where `with`, `in` and `and add to` are "syntactic noise" that has no effect on the code produced by the compiler but may make reading a script simpler. Careful use of such as this makes scripts look more like English without adding any noticeable performance handicap.

English is highly object-oriented. A horse is not the same as a car; each has its own particular attributes and behaviours, but they may share use of the same words. A slightly humorous example is to compare instructions given to junior and senior citizens:

```
brush your teeth and put out the cat

brush the cat and put out your teeth
```

Commands that do something with one particular object may do something completely different when applied to another object, or they may make no sense at all. ***EasyCoder*** behaves the same way and many words appear in different contexts. The language is organised into packages where the same command keyword may appear in more than one, to avoid the need for one function to handle all possible cases.

## Compiler strategy

The individual compiler functions operate completely independently, using helper functions as they wish. No overall strategy is imposed. The technique currently used is modelled on how humans handle unfamiliar text when only a dictionary is available. As an example, let's examine a simple Italian sentence:

```
apri la terza porta sulla destra
```

which translates in English to

```
open the third door on the right
```

Formal compilation according to textbooks is remarkably complex, but a far simpler approach is to just work one's way along from the start, in this case with `open`. Since every command in our new language starts with a command keyword, this must be one, so we identify it as a request to open something.

The next token is `the`, which can easily be classed as syntactic noise, so we move on to `third`. This isn't a 'something' as such, but the third of something yet to be identified. So let's move on.

The next token is `door`, which is certainly a 'something'. So we know that we have to open the third door. But we don't yet know if that's it or whether there's more to come. It might be a word such as `quickly`. But the next token is `on`, so that narrows the choice to either `left` or `right`, and after skipping another `the` we find that to be the case. Assuming that no further refinement is detected, we have successfully decoded the command.

If at any time we find something that doesn't make sense, the strategy is to back up and try an alternative path. How far to back up depends on how far we got down the wrong path, but it's usually fairly obvious where to back up to. The entire process is known as 'back up and retry'. The technique is extremely flexible and able to cope with a wide range of syntax and vocabulary.

All this may sound most inefficient, but in fact it's remarkably quick, allowing compilation to proceed at speeds of 10 lines or more per millisecond. This removes any real need to precompile and save the intermediate code, as a user will never notice the delay in compiling a module before it runs. It also avoids the need to deal with version updates that might break previously compiled code. As an added bonus, the output code is a Python dictionary where all the elements can be text, therefore serializable and portable, just in case that's ever a requirement.

## *EasyCoder* packages

'Packages' are components of the ***EasyCoder*** system that deal with specific groups of language features. Those included or available from the repository are

[core](/tmp/.mount_JoplinoKd8hh/resources/app.asar/core/README.md "core/README.md") contains all the language features needed to construct command-line applications to run on any computer equipped with Python.

[graphics](/tmp/.mount_JoplinoKd8hh/resources/app.asar/graphics/README.md "graphics/README.md") contains a growing selection of graphical language features, to construct applications that will run on a computer with a graphical user interface; Windows, Mac or Linux.
