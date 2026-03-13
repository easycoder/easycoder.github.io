	script FilterTest
    
    variable Items
    variable A
    variable V
    
    put empty into Items
    append `fish` to Items
    append `cabbage` to Items
    append `sugar` to Items
    append `beef` to Items
    append `potatoes` to Items
    filter Items with MyFilter
    alert Items
    exit

MyFilter:
    put arg `a` of Items into A
    if the length of A is greater than 5
        set V
        else clear V
    set arg `v` of Items to V
	stop