# Using Arrays and Modules in EasyCoder control scripts

***EasyCoder*** is an English-like scripting language; general-purpose but primarily suited to applications that don't require flat-out performance, such a GUI screens or device control systems. You may be reading this with our doclet reader, which is a good example. See https://docs.google.com/document/d/1NffbNRbJSYJsw2thhK3QMROhZ8eGSddypiZIqm_nKRk/view for further information.

Every programming language has its own unique features, or combinations of features that are unique. Here are a pair of features in ***EasyCoder***, the combination of which can rarely be implemented as simply in other languages. First I'll describe the features, then show an example of how well they work together.

## Arrays
***EasyCoder*** uses plain English words instead of computer code, and the use of symbols is deliberately kept an absolute minimum. (They comprise exclamation marks for comments, colons for labels and backticks to enclose text.) So when it came to implementing arrays, something other than parentheses had to be used. The solution came from SQL, where 'cursors' are used to point to an element of what is essentially an array.

In ***EasyCoder***, every variable is an array. Most only ever have a single element, but they can all have as many as needed for the job at hand. Each variable has an internal 'index' value which specifies which element of the array is currently serving as the value of that variable, and in most cases is zero. Commands exist to change the number of elements and to change the index to point to any element of the array. The array always behaves as if it only has one element - the one currently pointed to by the index.

Here's a simple script segment to illustrate the principle. It reads a file and splits it into an array with one element per line of the file, then prints the lines one by one:
```
    variable Content
    variable N
    ...
    load Content from `{file path}`
    split Content    ! the default is line breaks
    set N to 0
    while N is less than the elements of Content
    begin
        index Content to N
        print Content
        increment N
    end
    exit
```
Those familiar with traditional computer languages may find this wordy and come up with a one-liner to do the same job, but that's missing the point. Ordinary people will be able to "read" the above, whereas the one-liner will need picking apart to get understanding.

## Modules
A module is just an ***EasyCoder*** script, the same as any other. It becomes a module when it is run from another script. The identity of the new script is held as a 'module' variable in the parent script, and a complete application can be built with any number of modules all working together.

The partnership of a parent script and its child modules offers some unique features, largely based on the ability of the parent to share some of its own variables with the child script. In some ways this is akin to a function subroutine in other languages, but is different in a number of ways. The first is that every time a script is invoked it must be compiled from source. This typically takes a few milliseconds to a few tens of milliseconds, as against nanoseconds when calling functions in Java or Python. So it's not intended for use as a general-purpose function mechanism.

Here's an example of invoking a module:
```
    module FunctionModule
    dictionary SharedData
    variable Result
    ...
    run `functions.ecs` as FunctionModule with SharedData and Result
    if Result is `OK` {do something} else {do something else}
```
The module itself looks like this:
```
!   functions.ecs -- this is my function module
    script FunctionModule
    import dictionary SharedData and variable Result
    ...
    set Result to `OK`
    exit
```

A major difference comes from the way that a child module can run concurrently with its parent. ***EasyCoder*** implements cooperative multitasking, which means that threads run until they come to a 'stop' or a 'wait' command, then control is transferred to another thread if there's one waiting to start execution. Obviously it's possible to write a thread that doesn't release in this way, but in the majority of applications targetted by the language this is unlikely to happen or is easy to avoid.

When a module is launched, the parent blocks while the new module runs its startup code, whatever that might comprise. This may be all that's wanted, in which case an 'exit' command will close the module and hand control back to the parent. But the other option is to issue a 'release parent' command, which then allows the parent to resume when the child reaches a 'stop' or 'wait' command. So in a real-world control program, modules can individually handle single or multiple hardware devices independently of each other.

There's also an option for a parent to send a message to one of its child modules and for a child to message its parent. This allows two or more modules to run indefinitely, passing messages back and forth as if they were independent programs.

## Combining the two
For this I need an application. Let's look at a home heating control system, where each room has its own thermometer and heater that are independent of all the other rooms. In most languages, doing this in a single program can be clumsy and hard to test, involving system-level multithreading, but in ***EasyCoder*** it gets a lot simpler.

We start with a main program, which reads the file(s) comprising a 'map' of the system, identifying the rooms and the devices contained therein. We then write a module that can handle the needs of a single room, and specify a module variable to handle it. The module is given as many array elements as there are rooms, then one by one they are launched, each one being handed the portion of the map that relates to a specific room and a status variable, intially empty, that will hold the temperature value read from the thermometer and the on-off state of the heating in the room.

Each of these modules looks in the map for the parameters and rules that apply to the room whose name is given. It then starts managing the room. As it does so it keeps updating the temperature and on-off state in the status variable shared by the main program. Note that because this is cooperative multitasking, two threads cannot modify the same variable at the same time, so there is no need for locks.

Here's the code for part of the main program:
```
!   main.ecs - the main program script

    script Main

    dictionary Map
    dictionary Room
    dictionary RoomState
    list Rooms
    list RoomStates
    module DeviceModule
    variable RoomCount
    variable R

    load Map from `../map.json`
    put entry `rooms` of Map into Rooms
    put the count of Rooms into RoomCount
    set the elements of DeviceModule to RoomCount
    reset RoomStates        ! set it to an empty list
    reset RoomState         ! set it to an empty dictionary
    put 0 into R
    while R is less than the count of Rooms
    begin
        append RoomState to RoomStates
        increment R
    end
    put 0 into R
    while R is less than the count of Rooms
    begin
        put item R of Rooms into Room
        put item R of RoomStates into RoomState
        index DeviceModule to R
        index RoomStates to R
        run `devices.ecs` as DeviceModule with Room and RoomStates
        increment R
    end
```
It's very easy to substitute a simulation of a room for the real thing. All that matters is that it takes the same inputs and returns the same outputs.

I'll also comment at this point that all the variables above are simple values, dictionaries or lists (corresponding to Python types). There may be a case for creating a plugin module where a Profile and a Room are distinct types, with their own properties and behaviours, which seamlessly extends the language and makes scripts easier to follow. Plugins are another unusual feature of ***EasyCoder*** but I won't pursue it here.

After this code has run, the main program launches a GUI module. This also uses the map, to create a display of the entire system, and the RoomStates variable to provide the values that will be displayed in the appropriate places. Since the device module shares the latter, any changes it makes will be visible to the GUI module as well as the main script. Similarly, when the user interacts with the display, changes result in a message being sent to the main script, which updates the map accordingly. Or the GUI module can update the map - it's a matter of personal preference. The interconnection of all the modules ensures that the entire system updates itself automatically, each module detecting a change and responding to it.

Other modules can be added, such as one that uses MQTT to communicate with a remote UI, perhaps on a smartphone. Another might handle collection of statistics. The point is that additions are minimally disruptive.

As for testing, it's quite easy to take a module and test it in isolation, by simulating the key aspects of other modules that interact with it. Bugs reveal themselves quickly as it's usually obvious where they originate.

## Finally
In a world that prizes performance ahead of usability, it's often easy to forget that there are many applications that don't require performance. In many such cases, the easier it is to build and modify the code the better. A colleague once remarked to me that all that happens with progress is "systems get to wait faster". ***EasyCoder*** and languages like it will never win any prizes for speed but can act as solid workhorses for a vast range of real-world applications. The twin features above can save huge amounts of programming effort dealing with entities that require to be carefully kept apart while remaining closely connected; two states that often seem incompatible but which with the right tools are entirely manageable.
