# Handling lists #
A list in ~ec~ is a text string in the JSON format, which is a way of representing data structures. For a list this is a set of elements, though there are other ways data can be organized, which we'll come to in another step.

In this example we'll set up a shopping list, then we'll sort it into alphabetical order. The simplest form of the list is where each item is just a name. Click this button to load the example code into the editor:

~copy~

At the start of the script are the variables we will use. Of particular note are OriginalList and DisplayList. The first of these is the list as entered, with the items in no particular order. The second is the same list after it has been prepared for display.

At lines 16-25 we create our original list. We start by emptying the ~code:OriginalList~ variable, then we add the items one by one.

Then we build the user interface; a panel to hold the list and 2 buttons underneath. No prizes here for styling, of course. The 2 buttons each have actions attached to them, to be performed when they are clicked. The ~code:Unsorted~ button simply jumps to a label further down, to save repeating the same code. To display the list we copy the original list to the display list and call the ~code:Display~ subroutine, which adds each item in turn to the panel.

When we click the ~code:Sorted~ button we copy the list but then sort it before displaying. In ~ec~, as in JavaScript itself, no assumptions are made as to how you want the sort to be done. Usually you want an alphabetical sort, but suppose you want the items ordered by the lengths of their names? To allow maximum flexibility, programming languages left you define a comparison function that takes 2 items from the list and compares them. Here the function is called ~code:AlphabeticSort~ and it works like this:

The sort command operates by comparing elements in the list until they are in the desired order. It knows when this has happened by examining the results from the user-specified comparator function (~code:AlphabeticSort~). This function will be called several times, each time with a pair of elements, and each time it must return a value that says whether they are in the correct order. The 2 elements are supplied as arguments of the array itself, with special names ~code:a~ and ~code:b~. Our comparison function compares these and places the result into another argument called ~code:v~. The values returned are 1, 0 or -1, depending whether the first argument has a value that is greater, the same as or less than the second argument. Once the list is sorted it is then displayed.

Note that in this case the values are strings, not numbers, so the comparison is alphabetic.

This technique allows you to do whatever sorting you require. Let's now sort by word length. Try replacing lines 65 and 66 with

~pre:if the length of A is greater than the length of B put 1 into Result
else if the length of A is less than the length of B put -1 into Result~

and see what happens. The list will now be in order of word length. However, there are 4 items with 4 letters and 2 with 6 letters, and these are not sorted alphabetically. To make this happen we need to change line 67 to the following:

~pre:else
begin
    if A is greater than B put 1 into Result
    else if A is less than B put -1 into Result
    else put 0 into Result
end~

Here we've added a second comparison, this time on the actual values as before, that only happens if the two items have the same length.

In the next step we'll look at some more advanced sorting.

~next:Advanced sorting~
