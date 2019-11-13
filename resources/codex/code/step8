!   The bouncy rectangle

    div Container
    div Rectangle
    variable Height
    variable Angle
    
    create Container
    set the style of Container to
        `width:90%;height:200px;margin:1em auto 0;`
        cat `border:1px solid black;padding:10px`
    
    create Rectangle in Container
    set the style of Rectangle to
       `position:relative;width:9%;border:1px solid gray;`
        cat `background:lightgray`
    set style `top` of Rectangle to `50%`
    set style `height` of Rectangle to `100px`
    
    wait 2 seconds
    
    put 0 into Angle
    while Angle is less than 360
    begin
        put sin Angle radius 100 into Height
        set style `top` of Rectangle to `calc(50% - ` cat Height cat `px)`
        set style `height` of Rectangle to `calc(100px + ` cat Height cat `px)`
        add 1 to Angle
        wait 5 millis
    end
    
    stop
