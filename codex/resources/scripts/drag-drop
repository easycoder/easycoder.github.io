!	Drag and drop

	script DragDrop
    
    div Container
    div Component
    variable PickPos
    variable DragPos
    variable X
    variable Y
    variable OffsetX
    variable OffsetY
    
    create Container
    set style `position` of Container to `relative`
    
    create Component in Container
    set the style of Component to
    	`position:absolute;left:1em;top:1em;cursor:default`
	set the content of Component to `This is draggable text`
    
    on pick Component
    begin
		put the pick position into PickPos
        put the offset left of Component into OffsetX
        put the offset top of Component into OffsetY
    end
    
    on drag
    begin
		put the drag position into DragPos
        put property `x` of DragPos into X
        put property `y` of DragPos into Y
        take property `x` of PickPos from X
        take property `y` of PickPos from Y
        add OffsetX to X
        add OffsetY to Y
        set style `left` of Component to X
        set style `top` of Component to Y
    end
    
    stop
