# Introduction
**_EasyCoder_** is a high-level English-like domain-specific scripting language (DSL) suited for prototyping and rapid testing of ideas. It operates on the command line and a graphics module is under construction. The language is written in Python and it acts as a fairly thin wrapper around standard Python functions, giving fast compilation and good runtime performance for general applications.

**_EasyCoder_** is well suited to building command-line or graphical applications for expressing random logic such as operating procedures and rules, or controlling physical systems, particularly those using wifi devices. It is easy to construct and issue REST commands to local or remote web servers.

For more advanced applications, **_EasyCoder_** is designed to be extensible, by enabling extra language syntax to be added via plugin-in modules. Once these are installed they act as seamless extensions to the basic syntax provided. **_EasyCoder_** derives its power from the use of rich and comprehensive language rather than a complex system of frameworks such as those commonly used in modern programming. This makes it very easy to learn as our brains are wired to operate that way. Having said that, the needs of most control systems are usually served by a fairly modest number of keywords and syntactic variants.
<hr>

There is also a JavaScript version of **_EasyCoder_**, which provides a full set of graphical features to run in a browser. For this, please visit

Repository: [https://github.com/easycoder/easycoder.github.io](https://github.com/easycoder/easycoder.github.io)  
Website: [https://easycoder.github.io](https://easycoder.github.io)
<hr>

## Quick Start
Install **_EasyCoder_** in your Python environment:
```
pip install requests easycoder
```

Test the install by typing the command `easycoder`.
<hr>
On Linux, this will probably fail as the installer places the executable file in the `$HOME/.local/bin` directory. So give the command `export PATH=$HOME/.local/bin:$PATH`.

To make this change permanent, edit your `.profile` file, adding the following:
```
# set PATH so it includes user's private .local/bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi
```
<hr>

Now write a test script, `hello.ecs`, containing the following:
```
print `Hello, world!`
exit
```
(Note the backticks.) This is traditionally the first program to be written in virtually any language. To run it, use `easycoder hello.ecs`.

The output will look like this (the version number will likely differ):
```
EasyCoder version 250403.1
Compiled <anon>: 1 lines (2 tokens) in 0 ms
Run <anon>
Hello, world!
```

Why the `exit`? Because EasyCoder can't tell that the program is finished. It might contain elements that are waiting for outside events, so without `exit` it just stops and waits. You can kill it by typing Control-C.

It's conventional to add a program title to a script:
```
!   Test script
    script Test
    log `Hello, world!`
    exit
```

The first line here is just a comment and has no effect on the running of the script.   The second line gives the script a name, which is useful in debugging as it says which script was running. I've also changed `print` to `log` to get more information from the script. When run, the output is now
```
EasyCoder version 250403.1
Compiled Test: 3 lines (4 tokens) in 0 ms
Run Test
16:37:39.132311:    3-> Hello, world!
```

As you might guess from the above, the `log` command shows the time and the line in the script it was called from. This is very useful in tracking down debugging print commands in large scripts.

Here in the repository is a folder called `scripts` containing some sample scripts:

`fizzbuzz.ecs` is a simple programming challenge often given at job interviews  
`tests.ecs` is a test program containing many of the **_EasyCoder_** features  
`benchmark.ecs` allows the performance of **_EasyCoder_** to be compared to other languages if a similar script is written for each one.

## Graphical programming
**_EasyCoder_** includes a graphical programming environment based on PySide6, that is in under development. Some demo scripts will be included in the `scripts` directory as development proceeds. Anyone wishing to track progress can do so via this repository. At the time of writing we are transitioning from an early version based on PySimpleGUI to one based on PySide, the latter being an open product that matches the needs of a DSL better than does the former.

## Significant features

 - English-like syntax based on vocabulary rather than structure. Scripts can be read as English
 - Comprehensive feature set
 - Runs directly from source scripts. A fast compiler creates efficient intermediate code that runs immediately after compilation
 - Low memory requirements
 - Minimim dependency on other 3rd-party packages
 - Built-in co-operative multitasking
 - Dynamic loading of scripts on demand
 - The language can be extended seamlessly using plugin function modules
 - Plays well with any Python code
 - Fully Open Source

## Programming reference

**_EasyCoder_** comprises a set of modules to handle tokenisation, compilation and runtime control. Syntax and grammar are defined by [packages](doc/README.md), of which there are currently two; the [core](doc/core/README.md) package, which implements a comprehensive set of command-line programming features, and and the [graphics](doc/graphics/README.md) package, which adds graphical features in a windowing environment.

See also [How it works](doc/README.md)

## Extending the language

**_EasyCoder_** can be extended to add new functionality with the use of 'plugins'. These contain compiler and runtime modules for the added language features. **_EasyCoder_** can use the added keywords, values and conditions freely; the effect is completely seamless. There is an outline example in the `plugins` directory called `example.py`, which comprises a module called `Points` with new language syntax to deal with two-valued items such as coordinates. In the `scripts` directory there is `points.ecs`, which exercises the new functionality.

A plugin can act as a wrapper around any Python functionality that has a sensible API, thereby hiding its complexity. The only challenge is to devise an unambiguous syntax that doesn't clash with anything already existing in **_EasyCoder_**.

## MQTT token formats

The MQTT plugin supports both plain-token and encrypted-token forms:

```easycoder
mqtt
    token PlainTokenValue
    id MyID
    broker `mqtt.flespi.io`
    port 8883
    subscribe MyTopic
```

```easycoder
mqtt
    token EncryptedTokenValue SecretKeyValue
    id MyID
    broker `mqtt.flespi.io`
    port 8883
    subscribe MyTopic
```

Both `EncryptedTokenValue` and `SecretKeyValue` can be any EasyCoder value (string literal or variable).
When two values are provided after `token`, EasyCoder decrypts the token before creating the MQTT client.
This decryption path requires the Python package `cryptography`.

## Contributing

We welcome contributions to EasyCoder-py! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) guide for:
- Getting started with development
- How to work with Git branches and merge changes
- Resolving merge conflicts
- Testing and submitting pull requests
