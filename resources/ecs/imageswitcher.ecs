!	Image Switcher

	script ImageSwitcher
    
	div Container
    div Buttons
    div Text
    img Left
    img Right
    img Thumb
    img Image
    a Link
    variable Markup
    variable ImageCount
    variable N
    variable M
    variable Width
    variable ECPayload
    variable Payload
  	callback DecoratorCallback
    
  	rest get ECPayload from `/resources/fragment/ec.txt`
    attach Container to `ex-imageswitcher`
    on message go to Start
    set ready
    stop

Start:
	clear Container
    
    put `50px` into Width
	put 9 into ImageCount
	set the elements of Thumb to ImageCount
	set the elements of Image to ImageCount
    create Buttons in Container
    set the style of Buttons to `text-align:center; padding:10px;border:1px solid lightgray`
    create Link in Buttons
    create Left in Link
    set style `width` of Left to Width
    set attribute `src` of Left to `resources/icon/left.png`
    on click Left go to DoLeft
    put 0 into N
    while N is less than ImageCount
    begin
    	index Thumb to N
        create Link in Buttons
        create Thumb in Link
        set style `width` of Thumb to Width
        set style `border` of Thumb to `1px solid white`
        if N is not 0 set style `margin-left` of Thumb to `10px`
        set attribute `src` of Thumb to `resources/img/imageswitcher/thumbs/img` cat N cat `.jpg`
    	add 1 to N
    end
    on click Thumb go to DoThumb
    create Link in Buttons
    create Right in Link
    set style `width` of Right to Width
    set attribute `src` of Right to `resources/icon/right.png`
    on click Right go to DoRight
    put 0 into N
    while N is less than ImageCount
    begin
    	index Image to N
        create Image in Container
        set the style of Image to `width:100%;display:none`
        set attribute `src` of Image to `resources/img/imageswitcher/img` cat N cat `.jpg`
    	add 1 to N
    end
    gosub to AddDescription
    put 0 into N
Select:
    index Image to N
    index Thumb to N
    set style `display` of Image to `block`
    set style `border` of Thumb to `1px solid blue`
    stop

DoLeft:
    set style `display` of Image to `none`
    set style `border` of Thumb to `1px solid white`
	put the index of Image into N
    if N is 0 put ImageCount into N
    take 1 from N
    go to Select

DoRight:
    set style `display` of Image to `none`
    set style `border` of Thumb to `1px solid white`
	put the index of Image into N
    add 1 to N
    if N is ImageCount put 0 into N
    go to Select

DoThumb:
    set style `display` of Image to `none`
	put the index of Thumb into N
    put the index of Image into M
    index Thumb to M
    set style `border` of Thumb to `1px solid white`
    index Thumb to N
    index Image to N
    go to Select

AddDescription:
 	 on DecoratorCallback go to Decorate
	rest get Markup from `/resources/md/imageswitcher.md`
	create Text in Container
    set the content of Text to showdown decode Markup with DecoratorCallback
    return

Decorate:
  put the payload of DecoratorCallback into Payload
  if Payload is `ec` put ECPayload into Payload
  else if left 5 of Payload is `code:`
  begin
  	put `<span style="font-family:mono;color:darkred">` cat from 5 of Payload into Payload
    put Payload cat `</span>` into Payload
  end
  else if left 5 of Payload is `html:`
  begin
  	put from 5 of Payload into Payload
  end
  set the payload of DecoratorCallback to Payload
  stop