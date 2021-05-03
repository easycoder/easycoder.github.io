!	WordPress

	script WordPress
    
    import module Showdown
    
    variable Script
    
    rest get Script from `/resources/md/wordpress.md`

    on message go to Start
    
    set ready
    stop

Start:
    send Script to Showdown
    stop
