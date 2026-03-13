# The tracer #
The hardest part about programming is figuring out why things don't work as expected, and for many of us this is much of the time. To help with this, development systems usually have some kind of ability to stop a running program, examine its variables and step through the instructions one by one. Your browser has a very good debugger but all it will tell you is what's happening inside the ~ec~ engine, not what your script is doing. So we added a feature that will do these things. It's a little basic but there are times when it can help a lot.

The ~ec~ tracer needs you to tell it where it can display its information, and this is done in your script itself. Referring back to the bouncy rectangle, here's the same script with some tracer code added:

~copy~

At the top we have an additional ~code:div~ called ~code:Tracer~. The first thing the script does is create this div, giving it a specific id; a special value that ~ec~ knows about.

Later in the program, at the start of the main loop, we want to start examining our running script. In this example there are only 2 things we can ask for information about; the values of ~code:Angle~ and ~code:Height~. You can only ask for the values of ordinary numeric/string variables; to cater for other types would hugely add to the size of ~ec~ for something that's relatively infrequently used. At line 26, the first ~code:trace~ command takes a list of the variables we want to inspect and states whether they should be presented horizontally on one line or vertically. This command is optional; sometimes you only want to know where you are without needing to know any variable values.

The second ~code:trace~ command causes the program to stop when it reaches it. It displays the variables you asked for plus the last 5 lines executed prior to reaching the trace command, then stops. You can ask it to continue one step or to run again without stopping.

If you run this script you'll see this happening, and when you step through the code the values of ~code:Angle~ and ~code:Height~ will increase, one faster than the other.

Once you have diagnosed and fixed whatever problem you were having you can remove the tracer code and the program will run normally.

~next:Interactivity~
