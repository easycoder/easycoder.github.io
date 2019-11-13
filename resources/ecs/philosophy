!	Philosophy

	script Philosophy
    
    import module Showdown
    
    variable Script
    variable Message
    
    rest get Script from `/resources/md/philosophy.md`

    on message
    begin
    	put the message into Message
        if Message is `restore` send `show` to parent
        else if Message is `pause` begin end
        else go to Start
    end
    
    set ready
    stop

Start:
    send Script to Showdown
    stop