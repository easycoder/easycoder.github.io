# Filtering lists #
Filtering is rather similar to sorting, but instead of changing the order of the items in a list it removes unwanted ones. The syntax of the command is very similar and like sorting it uses a function to do the work; this time it's called a filter function.

The example is the same shopping list as before, but here we want to remove from the list all items having a value less than one pound (or dollar, euro, etc.)

~copy~

The list now has the same items but there's an extra button under the panel, which when clicked filters the list. It also sorts what's left, so you can see the two commands one after the other. The filter function itself is simpler than the comparator; only a single value is presented each time. The result, instead of having one of three values now only has two; true or false depending if the value should be accepted or rejected.

Sorting and filtering are a crucial part of much data management and the use of custom comparison and filter functions makes it very easy to control the process.

~next:Using Google Maps~
