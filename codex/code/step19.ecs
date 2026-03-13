!	Pan and Zoom

	script PanZoom

    div Div
    animation Anim
    variable Spec
    variable AspectW
    variable AspectH
    variable Width
    variable Height
    variable Item
    variable Finished
    
    put 16 into AspectW
    put 9 into AspectH
    
    set Spec to object
    set property `type` of Spec to `panzoom`
    set property `width` of Spec to `100%`
    set property `height` of Spec to `100%`
    set property `url` of Spec to `/resources/img/demo3.jpg`
    set property `steps` of Spec to 100
    set property `trigger` of Spec to 100
    set Item to object
    set property `left` of Item to 30
    set property `top` of Item to 37
    set property `width` of Item to 20
    set property `start` of Spec to Item
    set Item to object
    set property `left` of Item to 0
    set property `top` of Item to 0
    set property `width` of Item to 100
    set property `finish` of Spec to Item

!	Get the width and height
    create Div
    set style `margin` of Div to `1em 0 0 5%`
    set style `width` of Div to `90%`
	put the width of Div into Width
    multiply Width by AspectH giving Height
    divide Height by AspectW
    set style `height` of Div to Height cat `px`

!	Create the components
    create Anim in Div
    set style `width` of Anim to `100%`
    set style `height` of Anim to Height cat `px`
    set the specification of Anim to Spec
    on trigger Anim set Finished
    
    wait 2

!	Start the animation
	clear Finished
    start Anim
    while not Finished
    begin
    	step Anim
        wait 5 ticks
    end
    print `Finished`
    stop
