# Pick, Drag and Drop #
Interactive graphical interfaces frequently offer the user the ability to move items around the screen, as an alternative to copy and paste. Under the hood the implementation can be rather complex as there are usually many things to consider; things that are specific to the particular application.

In ~ec~ the basic drag-drop feature provides a solid foundation for you to build much more complex functionality on top. The example we present here is about as simple as it can be; on the next page is a more complex example.

~copy~

The script builds a simple screen containing a single component that can be picked up and moved around. The component can be almost any element; the only thing that needs special attention is text, which usually displays an i-beam cursor as the pointer moves over it. In this example the cursor is forced to the default arrow.

The script has 2 elements and a handful of variables. The Container element exists only to take the CSS style ~code:position:relative~, which allows elements inside it to have absolute positioning. (It's not very intuitive but that's the way it works.) The ~code:Component~ is the thing we're going to drag around; it's just a string of text.

The script is interested in 2 events; one when the user clicks inside the component, the other when the element is then dragged. For the first of these we need to know where the "pick" occurred relative to the top left of the window. It also needs to know where the component currently is located relative to its parent (so we can change that value).

When a drag event occurs the script gets the location of the pointer (or the finger on a mobile screen) and computes how much it has moved from the "pick" position. It adds to this the previous position of the component in its container and the result is used to set a new position.

The system also lets you specify what happens when the component is released. Dere we use the default action, which is simply to stop dragging the component.

~next:Solitaire~
