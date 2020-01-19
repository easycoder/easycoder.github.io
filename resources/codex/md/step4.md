# Introducing the DOM #
All Web pages are made up of HTML components; a kind of extended Russian Doll concept where containers hold other containers that hold images or text... and so on. This structure is called the Document Object Model, or DOM for short. In this step we'll create a web page with a single component that just holds some text. We don't expect you to know anything about the DOM or about HTML; everything you need will be introduced as you go.

There are a variety of different components that can hold text. Headers, paragraph elements, spans, text fields and divisions are among the most common. In this example we'll create a paragraph element and put a well-known phrase in it. The script looks like this:
~step~
When the script runs the text will appear in the run panel and hide this tutorial text. You can switch between the Run and Help panels by clicking the  (Cycle) button. Try it and see. (On mobile the  button cycles through the three panels Code-Run-Help.)

~copy~

There's quite a lot going on here, so I'll explain. The first line is a comment which can be ignored. After that is p Para, which is a variable declaration, a fancy programmer's term meaning a definition of somewhere you can store information. In the real world you might have 2 dogs, called Rover and Spot. When you refer to the first one in conversation you may well say "This is my dog Rover". Your interlocutor (the person you're talking to) knows what a dog is, and in writing we confirm that Rover is a name because we spell it with a capital letter. Once we've identified the animal in question we can refer to him as just Rover without having to repeat 'my dog' as well.

~ec~ works in the same way as English. I need to be clear about that because for some curious reason most other computer languages do things in exactly the opposite manner, starting names with lower-case letters and types with capital letters. For many beginners this is counter-intuitive so we prefer to follow the English way.

From the above you may have deduced that Para is the name of something and p is the name of that type of thing. If so, you were right. A p type of object is a paragraph of text, and here we have one called Para. By naming it we call tell it's not the same as another paragraph called Para2, just as Rover and Spot are not the same dog. What we're doing is telling ~ec~ that we'll be using a paragraph and we'd like to refer to it as Para.

A typical ~ec~ script may have many variables and it's conventional to put them all at the start, then to put a blank line after them to help the programmer, just as books break up text into paragraphs, lists and headings. It's easier for the eye to follow. Blank lines have absolutely no effect on the way the program runs.

The next line is create Para. We've already announced we will want a paragraph, so here we create it. In some programming languages (JavaScript, for example), variables don't have types; they are all arbitrary things. (In the real world it's inconceivable we could function if English did not permit us to say if something is a dog, a cat or an armchair, but it seems to work well enough in the computer world.) Most other languages need to know what type a variable is in order to create it. This approach is called strong typing. ~ec~ is about half-way between the two; although its variables are 'typed' they can sometimes contain data of different types. Specifically, numbers and strings can both be held in an ordinary variable and in most cases ~ec~ works out when to convert one to the other.

A paragraph is where you put text on your web page; it's a text container. ~ec~ puts your new paragraph right at the top of the page, up against the left-hand margin, but until you add some text to it you won't be able to see it because it's transparent. So the next line in the script adds some text.

Finally, the stop command prevents the script from exiting before you even had a chance to see the text.

As with the earlier examples, the editor has done some color-coding. Variables are always displayed in blue and numbers in green. Any word that is shown in black is part of ~ec~ itself.

~next:Styling and CSS~
