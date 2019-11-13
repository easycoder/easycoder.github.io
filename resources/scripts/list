!	Shopping list

	script ShoppingList
    
    div Panel
    div Row
    variable List
    variable A
    variable B
    variable Result
    variable N
    variable Item
    
    create Panel
    set the style of Panel to `border:1px solid black;margin:1em;padding:1em`
    
    clear List
    append 	`Fish` to List
    append 	`Potatoes` to List
    append 	`Cheese` to List
    append 	`Wine` to List
    append 	`Sugar` to List
    append 	`Pineapple` to List
    append 	`Milk` to List
    append 	`Butter` to List
    gosub to Display
    
    wait 2 seconds
    sort List with AlphabeticSort
    gosub to Display
    
    stop

Display:
	clear Panel
    put 0 into N
    while N is less than the json count of List
    begin
    	create Row in Panel
        set the content of Row to element N of List
    	add 1 to N
    end
	return

AlphabeticSort:
	put arg `a` of List into A
    put arg `b` of List into B
    if A is greater than B put 1 into Result
    else if A is less than B put -1 into Result
    else put 0 into Result
    set arg `v` of List to Result
    stop
