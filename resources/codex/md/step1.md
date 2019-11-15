# First step: Hello, world! #
We'll start off with some very basic things and gradually introduce you to more and more of the ~ec~ system. You can break off at any point and return later (on the same computer and browser); the system will remember where you were. Above this text are navigation buttons that let you return to the previous step in the tutorial or move on to the next one. So let's get started.

On the left you can see a blank panel with just a line number '1'. (On a smartphone you'll have to tap the ~icon:cycle:20px:Cycle screens~ (Cycle) button to go to the Code panel.) This is where you will put your program code. Above it are buttons to let you save your code, load code you previously saved and run what you have on-screen at the moment.

It's a tradition in programming that your first program is called "Hello, world". It just displays a message - that's all. So we'll honor the tradition by doing it here. Type the text you see below into the panel on the left, or click the "Copy to editor" button. (If you're on a smartphone you may like to read on a bit before doing this, but remember you can return here at any time by tapping the ~icon:cycle:20px:Cycle screens~ button.)

~pre:alert &#96;Hello, world!&#96;~
~copy~

You'll see that in our editor the text inside the backticks is colored whereas the word 'alert' is black. This is because the editor 'understands' what ~ec~ scripts look like. Also note that blank lines or spaces at the start of lines are ignored, and that a command can occupy more than one line as long as you don't put a line break in the middle of a quoted string (such as ~quot:Hello, world!~).

The word ~code:alert~ is an ~ec~ command word and the text between the backticks is fixed text. We programmers call it a string. Words that are colored black are all part of ~ec~ itself; everything else has a color that indicates the part it plays in the language. Strings are always dull red.

When you click the ~icon:run:20px:Run~ button its icon will change to ~icon:runstop:20px:Stop~ and a popup box will appear containing your message. When you click the OK button in the box everything will be returned to as it was before. Your script has finished its job.

The program actually behaved as if you'd typed

~pre:alert &#96;Hello, world!&#96;
exit~

If you leave off the ~code:exit~ instruction the ~ec~ compiler puts one in for you, but there are times when you don't want the program to just exit. It may be waiting for the user to interact so it has to keep itself alive. To do this we need another variation:

~pre:alert &#96;Hello, world!&#96;
stop~

In this case, after you click the OK button and the popup box disappears, the  button doesn't change back to . This is because the script is still in a 'running' state but it isn't actually doing anything. If you click the ~icon:runstop:20px:Stop~ button the script will be forced to exit. Try it and see.

The alert popup is very useful when you want to stop your script and check what it's doing. You can construct a message that contains whatever information you need. For the next couple of steps in this tutorial we'll use alerts to explore some of the basic programming features and do some arithmetical computing before we get onto the visual stuff.

Before we continue, let's just fit in one more thing here.

This script may only comprise one line, but it's your first script. You might have made changes to it to see what effect they have (I hope you do, in fact; it's the best way to learn). If you want to come back another time and run it, to save having to type it in again how about saving it? Do this by typing a suitable name - such as ~code:hello~ - into the Script Name box and then clicking the ~icon:save:20px:Save~ button. If you're running the Codex from our web server, your scripts are saved into an area of memory managed by your browser and are only visible by you while you are using this website. This means they are not permanent, so if you really want to save a script you should copy it and paste it into a text document or an email.

When you click ~icon:open:20px:Open~ you will see all the scripts you have saved while using ~ec~. Click any one of them to load it into the editor, where you can make changes and run it.

To clear the current script (without removing it from storage), click ~icon:new:20px:New~, and to delete the current script from storage click ~icon:trash:20px:Delete~.

~next:Basic arithmetic~
