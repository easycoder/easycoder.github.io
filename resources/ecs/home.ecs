!	Home

	script Home
    
    import module Showdown
    
    variable Script
    variable Item
    variable Message
    
    rest get Script from `/resources/md/home.md?v=` cat now
    if mobile
    begin
    	replace `/SIDEBAR/` with `below` in Script
    end
    else
    begin
    	replace `/SIDEBAR/` with `on the left` in Script
    end
    rest get Item from `/resources/fragment/home/0.txt`
    replace `/0/` with `<span style="font-family:mono;color:darkred">` cat Item cat `</span>` in Script
    
    on message
    begin
    	put the message into Message
        if Message is `restore` send Message to parent
        else go to Start
    end
    set ready
    stop

Start:
    send Script to Showdown

    stop
