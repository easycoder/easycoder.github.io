# Basic arithmetic #
EasyCoder is designed for the web; to build apps that do stuff in a browser. The world of the browser is primarily visual, with lots of images and text, but there's always a need for some basic arithmetic so we'll write a couple of scripts that illustrate what's available.

In most computer languages, if you want to add numbers together it will look like your school algebra:

~pre:Z = X + Y~

but that's not how you'd express it in written or spoken English. Instead, you might say

~pre:add X to Y giving Z~

where ~code:giving~ is a shorthand for "and put the result into".

As it happens, this is exactly how ~ec~ does it too. Here you are adding the values X and Y together and putting the result into a variable called Z.

The words ~code:value~ and ~code:variable~ have specific meanings. A ~code:value~ is anything you can measure or count, such as cars or pennies or days. ~ec~ doesn't care what they are; it just knows you have an X pile and a Y pile of them and want to add them together into a Z pile.

A ~code:variable~ is a little more specific; it's a container where something is stored. Your wallet or purse contains money having a certain value, so the purse also has that value. A dollar or a pound, on the other hand, have specific values; they can't contain other things so they can't be variables. All this means is that in the sum above, X and Y can be either values or variables (containing values), but Z can't be a simple value; it must be a variable because we're putting something (the sum of X and Y) into it.

A variant of this sum is where you want to add value X to whatever is already in Y. The sum is simpler:

~pre:add X to Y~

Again, X can be any value but Y must be a variable.

Of course, arithmetic is more than just addition. There's also subtraction, multiplication and division too. Here's what they all look like:

~pre:add X to Y          add X to Y giving Z
take X from Y       take X from Y giving Z
multiply Y by X     multiply Y by X giving Z
divide Y by X       divide Y by Z giving Z~
Note that in the left-hand column, multiplication and division work the opposite way round to addition and subtraction, with the result of the sum (Y) being the first item, not the second.

Although I've used just X and Y, you can also do arithmetic with numbers:

~pre:add 4 to X
take 3 from 13 giving Y~

and so on. At which point let's start coding. Copy this code to the editor:

~step~
~copy~

In the alert command you'll see the word ~code:cat~ used to 'catenate' 2 strings together. Apart from that I hope it's all easy to follow even if you're completely new to coding.

If at any time you want to find out about a particular command, click the  button at the top of this panel and you'll be switched to the ~ec~ Programmer's Reference manual. You need to select a package - most of the commands we'll be using are in either Core or Browser - and choose Commands, Values or Conditions. There's a drop-down list of all the keywords in that section. Click the **Tutorial** button to return here when you've had enough.

~next:String handling~
