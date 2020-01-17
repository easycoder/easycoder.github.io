!   Shopping list

    script ShoppingList
    
    div Panel
    div Row
    button Sorted
    button Unsorted
    variable OriginalList
    variable DisplayList
    variable A
    variable B
    variable Result
    variable N
    
    put empty into OriginalList
    append `Fish` to OriginalList
    append `Potatoes` to OriginalList
    append `Cheese` to OriginalList
    append `Wine` to OriginalList
    append `Sugar` to OriginalList
    append `Pineapple` to OriginalList
    append `Milk` to OriginalList
    append `Eggs` to OriginalList
    append `Butter` to OriginalList
    
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
        sort DisplayList with AlphabeticSort
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
        set the content of Row to element N of DisplayList
        add 1 to N
    end
	return

AlphabeticSort:
    put arg `a` of DisplayList into A
    put arg `b` of DisplayList into B
    if A is greater than B put 1 into Result
    else if A is less than B put -1 into Result
    else put 0 into Result
    set arg `v` of DisplayList to Result
    stop
