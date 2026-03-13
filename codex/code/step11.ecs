!   Basic interactivity

    div Container
    div Button
    a Link
    variable Count
    variable N
    variable Clicked

    put prompt `How many buttons?` with `5` into Count
    set the elements of Link to Count
    set the elements of Clicked to Count

!   Initialize the buttons
    put 0 into N
    while N is less than Count
    begin
        index Clicked to N
        clear Clicked
        add 1 to N
    end
    
    create Container

!   Redraw the screen every time the user clicks a button
Redraw:
    clear Container
    put 0 into N
    while N is less than Count
    begin
        index Link to N
        index Clicked to N
        create Button in Container
        set the style of Button to
            `margin:0.5em 0 0 2em;border:1px solid red;`
            cat `padding:0.5em;width:10em;text-align:center`
        add 1 to N
        if Clicked set the content of Button to `Done`
        else
        begin
            create Link in Button
            set the content of Link to `Button ` cat N
        end
    end
    on click Link
    begin
        index Clicked to the index of Link
        set Clicked
        go to Redraw
    end
    
    stop
