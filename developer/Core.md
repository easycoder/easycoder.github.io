# The Keyword Compilers #

Here I'll use _Core.js_ to describe how commands are compiled. Each of the plugins follows the same pattern, as you will also do if you want to build an **_EasyCoder_** plugin yourself.

A plugin consists of a number of _handler_ objects each of which is able to compile and run a particular command or set of commands. The _compile()_ function works its way along the token stream until it either succeeds in extracing the meaning and returns true after posting a relevant data structure to the program array, or fails and gives up.

The _getHandler()_ function examines the current token, which is always a command word (because that's the way the language is structured) and returns the appropriate handler. The compiler then calls the _compile()_ function.

Each handler uses functions inside the compiler to examine the token stream. Functions are provided to get the current token, advance to the next, report if a token is a symbol, get a value and so on. Each handler function "knows" the syntax it is expecting and will return a failure it what it sees doesn't match.

Failure isn't always the end of the story, as there may be another plugin able to handle the syntax. Each one gets a crack at the job until either one succeeds or all have failed. Each time, the compiler backs up to the original starting point and kicks off the next handler. This process, called "back up and retry", is key to the way **_EasyCoder_** works and is very different to the way compilers are usually built. Much simpler, in fact, because it's based on the way human beings process foreign languages, trying alternative possible meanings until one fits or there are no more to try.

Let me take an example; the command _replace_. The syntax is

```replace X with Y in Z```

where X and Y are any string values and Z is a variable. The compiler function is

```
Replace: {

compile: compiler => {
	const lino = compiler.getLino();
	const original = compiler.getNextValue();
	if (compiler.tokenIs(`with`)) {
		const replacement = compiler.getNextValue();
		if (compiler.tokenIs(`in`)) {
			if (compiler.nextIsSymbol()) {
				const targetRecord = compiler.getSymbolRecord();
				if (targetRecord.isValueHolder) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `replace`,
						lino,
						original,
						replacement,
						target: targetRecord.name
					});
					return true;
				} else {
					throw new Error(`'${targetRecord.name}' does not hold a value`);
				}
			}
		}
	}
	return false;
},
```

Every compile function starts by recording the current source line number. This one then asks the compiler for the next _value_ from the token stream. I'll talk about values in a while. Then it checks the current token is _with_ and gets the replacement value. Another check next, for _in_ and one to ensure the item that follows is a symbol. It asks the compiler to retrieve the record for the symbol and checks it's able to hold a value, as not all variables can do this. At this point it's sure it has valid syntax so it builds the runtime structure, calls for it to be added to the end of the program array then returns _true_.

There are 2 failure modes. The first is if the variable wasn't able to hold a value; this is an unrecoverable error that causes compilation to fail. The second is if any of the other tests failed. It doesn't necessarily signify an error, only that the syntax can't be handled here, so the function passes back _false_, allowing the compiler to call the next plugin.

Error reporting tries to be as friendly as possible. The _reportError()_ function in _Main.js_ uses the information at its disposal to show the 5 lines leading up to the error as well as the error message itself.

## Commands, Values and Conditions ##

These are the 3 main components of the language that have to be compiled. Every statement in the language is a command, including variable declarations, and the first word of each command is the command keyword. I've outlined briefly above how these are handled.

A _value_ is anything that can be expressed as a number or a string. Variables in **_EasyCoder_** can hold strings, numbers or boolean values and can be reassigned on the fly to a new item of one of these types. Arrays don't require all of their elements to hold items of the same type, so care is generally needed. Many commands will automatically convert string values to numeric or vice versa, but don't assume they all will; it's best to force a conversion using ```the value of``` or ``` `` cat Number``` if there's any doubt.

Values can sometimes be compound, as in ```put left 5 of property `name` of Record into Name```, but as with the above, we don't offer any guarantee that such constructs will always be processed correctly. As in English they are liable to cause confusion and ambiguity. **_EasyCoder_** is designed to be compact rather than offer itself as a complete programming language and it's usually best to code things step by step.

A _condition_ is anything that can be used in an _if_ command to produce one outcome for _true_ and another for _false_. Much the same observations and warnings apply to these as do to values.

Values are processed initially by _Value.js_, which handles anything that doesn't specifically belong to a domain. Anything it doesn't understand it hands over to the plugin domains in turn until it achieves success or failure. Similarly, conditions are processed by _Condition.js_, which also hands on conditions it doesn't understand. The comparisons themselves are handled by code in _Compare.js_ once the values to compare have been extracted.

Values are compiled by the _compile()_ function in the _value_ object and conditions by the _compile()_ function in the _condition_ object.

Next: [The Runtime Engine](Runtime.md)

[Developer Manual](Developer.md)

[The EasyCoder Compiler](Compiler.md)

[The ReST Server](REST.md)