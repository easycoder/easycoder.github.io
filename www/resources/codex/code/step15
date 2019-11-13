!   Shopping list 3

    script ShoppingList3
    
    div Panel
    div Row
    button Sorted
    button Unsorted
    button Filtered
    variable OriginalList
    variable DisplayList
    variable A
    variable B
    variable Result
    variable N
    variable Item
    
    put empty into OriginalList
    clear Item
    set property `name` of Item to `Fish`
    set property `price` of Item to 349
    append Item to OriginalList
    clear Item
    set property `name` of Item to `Potatoes`
    set property `price` of Item to 105
    append Item to OriginalList
    clear Item
    set property `name` of Item to `Cheese`
    set property `price` of Item to 275
    append Item to OriginalList
    clear Item
    set property `name` of Item to `Wine`
    set property `price` of Item to 749
    append Item to OriginalList
    clear Item
    set property `name` of Item to `Sugar`
    set property `price` of Item to 85
    append Item to OriginalList
    clear Item
    set property `name` of Item to `Pineapple`
    set property `price` of Item to 93
    append Item to OriginalList
    clear Item
    set property `name` of Item to `Milk`
    set property `price` of Item to 85
    append Item to OriginalList
    clear Item
    set property `name` of Item to `Eggs`
    set property `price` of Item to 125
    append Item to OriginalList
    clear Item
    set property `name` of Item to `Butter`
    set property `price` of Item to 185
    append Item to OriginalList
    
    create Panel
    set the style of Panel to `border:1px solid black;margin:1em;padding:1em`
    
    create Unsorted
    set the style of Unsorted to `margin:1em`
    set the text of Unsorted to `Unsorted`
    on click Unsorted go to DisplayUnsorted
    
    create Sorted
    set the style of Sorted to `margin:1em`
    set the text of Sorted to `Sorted`
    on click Sorted
    begin
        put OriginalList into DisplayList
        sort DisplayList with PriceSort
        gosub to Display
    end

    create Filtered
    set the style of Filtered to `margin:1em`
    set the text of Filtered to `Filtered`
    on click Filtered
    begin
        put OriginalList into DisplayList
        filter DisplayList with PriceFilter
        sort DisplayList with PriceSort
        gosub to Display
    end

DisplayUnsorted:
    put OriginalList into DisplayList
    gosub to Display
    
    stop

Display:
    clear Panel
    put 0 into N
    while N is less than the json count of DisplayList
    begin
    create Row in Panel
        put element N of DisplayList into Item
        set the content of Row to property `name` of Item
    add 1 to N
    end
    return

PriceFilter:
    put arg `a` of DisplayList into A
    if property `price` of A is not less than 100 set Result
    else clear Result
    set arg `v` of DisplayList to Result
    stop

PriceSort:
    put arg `a` of DisplayList into A
    put arg `b` of DisplayList into B
    if property `price` of A is greater than property `price` of B
        put 1 into Result
    else if property `price` of A is less than property `price` of B
        put -1 into Result
    else put 0 into Result
    set arg `v` of DisplayList to Result
    stop
