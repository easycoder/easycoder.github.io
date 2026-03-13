# Advanced sorting #
The previous example was simple, but sometimes the elements of a list comprise a number of values. For a shopping list you might have the price, the stock ID and so on. Here we'll modify our list to add prices, then sort by price as well as alphabetically.

~copy~

The list now has the same items, but each one contains 2 values; the name of the item and its price (in pence, cents or whatever; EasyCoder doesn't handle floating-point values). At the start of the previous step I mentioned that the JSON format can handle things other than lists; here we have a property map; a set of values each having a key to say what it is - here name or price - and the value itself. Each of the items is separately added to a list, so the overall structure is a list of items each having 2 properties.

Everything else is the same as the previous example - apart from the comparator function, which now has to dive into the properties to find the price and do the comparison on that. I've renamed the function to make that clear.

As before there's a small gotcha for you, in that milk and sugar have the same price but sugar displays first because it comes first in the list. We can make these 2 items appear in alphabetic order by changing line 98 to

~pre:else
begin
    if property `name` of A is greater than property `name` of B
        put 1 into Result
    else if property `name` of A is less than property `name` of B
        put -1 into Result
    else put 0 into Result
end~

The next page will show you how to extract just some of the elements of a list.

~next:Filtering lists~
