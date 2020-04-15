# The Runtime Engine #

The process described so far results in a list (array) of objects each describing a single command in the program, and the format of these objects is designed to make it easy for the runtime engine to execute them in the sequence desired.

At the core of _Run.js_, the runtime engine, is a simple loop that uses a program counter variable as an index into the program array. It pulls out the command at that position and deconstructs it to get the _domain_ property. This tells it which of the available domains to call, so it does this. Each of the command keyword handlers has, in addition to its _compile()_ function, a _run()_ function that retrives its own copy of the command, containing all the information needed to perform the relevant task. In the case of DOM actions and commands for handling complex entities such as maps or REST commands, the runtime overhead is very small, enabling the system to approach the performance of regular JavaScript. If on the other hand the script is doing complex numeric or string manipulations the overhead is much greater. This is why it's best to consider writing a new plugin for such cases, where the bulk of the processing is done not by scripts but by raw JavaScript code in the _run()_ functions of the plugin.

Using the same example as before, the _replace_ command, here's the _run()_ function:

```
run: program => {
	const command = program[program.pc];
	const original = program.getValue(command.original);
	const replacement = program.getValue(command.replacement);
	const target = program.getSymbolRecord(command.target);
	const value = program.getValue(target.value[target.index]);

	const content = value.split(original).join(replacement);
	target.value[target.index] = {
		type: `constant`,
		numeric: false,
		content
	};
	
	return command.pc + 1;
}
```

It shouldn't be too hard to see what's happening here. We pull out the command, get the values of the original and replacement strings then the target variable's own record and pull from that the current value. Then we do the replacement using _split()_ and _join()_ and finally put the new value back. This _value_ has a type indicator, a flag to say if it's numeric and the content itself. Other values may be a little more complex but the general principles are the same.

One point to note is that when a variable is declared an entry is placed in the program containing everything there is to know about that variable. All subsequent operations on the variable modify the entry itself. This will probably offend lovers of functional programming and immutability as a safeguard against poor programming practice, but the fact is the real world is mutable so we see no reason not to match that. In any case, using pure functions generally makes the program run significantly slower owing to all the extra copying needed, as well as requiring considerably more heap space.

Every runtime handler returns the program counter value for the next command to be executed. When the end of the program is reached or a _stop_ command is encountered, the _run()_ function returns zero and no more commands are called. The system restarts itself when a user action occurs or a timer triggers.

The runtime has other jobs to do. Sometimes a script can encounter a runaway condition, usually because the programmer forgot to increment or decrement a loop counter. In such situations the computer's CPU rapidly overheats, but because it's totally consumed by running the loop there's no way to break in and stop it. So there's a counter inside the runtime engine that monitors how many instructions have been executed since the thread started, and it offers to stop the program if this number gets too high.

The other main task is to look after tracing. Every command passes through the runtime loop, so here is where a single-step tracer can be placed. The programmer's reference describes how to use it, so all I need to say here is that when tracing, the program stops at every command, displays the relevant part of the source script and optionally the values of chosen variables, then waits for an instruction to continue. 

Next: [The ReST Server](REST.md)

[Developer Manual](Developer.md)

[The EasyCoder Compiler](Compiler.md)

[The Keyword Compilers](Core.md)