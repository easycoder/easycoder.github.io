	script SortTest
    
    variable Items
    variable A
    variable B
    variable V
    
    put empty into Items
    append `fish` to Items
    append `cabbage` to Items
    append `sugar` to Items
    append `beef` to Items
    append `potatoes` to Items
    sort Items with Comparator
    alert Items
    exit

Comparator:
    put arg `a` of Items into A
    put arg `b` of Items into B
    if A is greater than B
        put 1 into V
    else if A is less than B 
       put -1 into V
    else
       put 0 into V
    set arg `v` of Items to V
	stop