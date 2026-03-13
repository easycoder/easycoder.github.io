!   The Mexican Wave

    div Container
    div Rectangle
    variable Height
    variable Angle
    variable Start
    variable Done
    variable AllDone
    variable Time
    variable N
    variable NRect
    
    put 10 into NRect
    
    create Container
    set the style of Container to
        `position:relative;width:90%;height:200px;margin:1em auto 0;`
        cat `border:1px solid black;padding-bottom:10px;text-align:center`
    
    set the elements of Rectangle to NRect
    set the elements of Angle to NRect
    set the elements of Start to NRect
    set the elements of Done to NRect
    
    put 0 into N
    while N is less than NRect
    begin
    	! Init the rectangles
    	index Rectangle to N
	    create Rectangle in Container
	    set the style of Rectangle to
	       `position:absolute;width:9%;background:peru;`
	        cat `display:inline-block;margin-left:0.5%`
	    set style `top` of Rectangle to `50%`
        set style `left` of Rectangle to `calc(10% * ` cat N cat `)`
	    set style `height` of Rectangle to `100px`
    	add 1 to N
    end

Loop:
    wait 2 seconds
    
    put 0 into N
    while N is less than NRect
    begin
        ! Init the angles, etc.
        index Angle to N
        index Start to N
        index Done to N
        put 0 into Angle
        put N into Start
        multiply Start by 10
        clear Done
    	add 1 to N
    end

	put 0 into Time
    while true
    begin
	    set AllDone
		put 0 into N
	    while N is less than NRect
	    begin
	    	index Rectangle to N
	    	index Angle to N
	    	index Start to N
	    	index Done to N
            if not Done
            begin
            	clear AllDone ! not finished yet
		        if Time is greater than Start
	            begin
	        		put sin Angle radius 100 into Height
	        		set style `top` of Rectangle to `calc(50% - ` cat Height cat `px)`
	        		set style `height` of Rectangle to `calc(100px + ` cat Height cat `px)`
        			add 1 to Angle
            		if Angle is greater than 360 set Done
	            end
            end
	    	add 1 to N
	    end
     	add 1 to Time
        wait 5 millis
        if AllDone goto Loop
    end
    stop
