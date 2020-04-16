!	Twin dice roller

	script DiceRoller
    
    div Container
    div Dice
    div Dot
    div Text
    variable NDice
    variable M
    variable N
    variable D
    variable Index
    variable Row
    variable Dots
    variable Patterns
    variable Left
    variable Top
    variable Markup
    variable ECPayload
    variable Payload
  	callback DecoratorCallback
    
    attach Container to `ex-diceroller`
    on message
    begin
    	if the message is `hide`
    	begin
            clear Container
            set style `height` of Container to 0
        end
    	else go to Start
    end
    set ready
    stop

Start:
    set style `height` of Container to ``
    put 2 into NDice
    set style `.ec-dice` to `{width:100px;height:100px;margin-right:20px;`
        cat `background:yellow;border:1px solid black;display:inline-block;`
        cat `border-radius:10%;position:relative}`
    set style `.ec-dot` to `{width:20px;height:20;position:absolute;`
        cat `background:black;border-radius:50%}`
    
    set Patterns to
    	40 40  0  0  0  0  0  0  0  0  0  0
        10 40 70 40  0  0  0  0  0  0  0  0
        10 40 40 40 70 40  0  0  0  0  0  0
        10 10 70 10 10 70 70 70  0  0  0  0
        10 10 70 10 10 70 70 70 40 40  0  0
        10 10 10 70 40 10 40 70 70 10 70 70
    
    set the elements of Dice to NDice
    put 0 into N
    while N is less than NDice
    begin
        index Dice to N
        create Dice in Container
        add 1 to N
    end
    gosub to AddDescription

Redraw:
    put 0 into M
    while M is less than 10
    begin
        put 0 into N
        while N is less than NDice
        begin
            index Dice to N
            clear Dice
            set the class of Dice to `ec-dice`
            gosub to RandomiseDots
            add 1 to N
        end
        wait 10 ticks
        add 1 to M
    end
    on click Dice go to Redraw
    stop

RandomiseDots:
	put random 6 into Dots
    multiply Dots by 12 giving Row
    put 0 into D
    while D is less than 12
    begin
    	add D to Row giving Index
    	index Patterns to Index
        put Patterns into Top
        add 1 to D
        if Top is not 0
        begin
        	add 1 to Index
    		index Patterns to Index
        	put Patterns into Left
            create Dot in Dice
            set the class of Dot to `ec-dot`
            set style `top` of Dot to Top
            set style `left` of Dot to Left
    		on click Dot go to Redraw
        end
    	add 1 to D
    end
	return

!   Add the description text
AddDescription:
 	 on DecoratorCallback go to Decorate
	rest get Markup from `/resources/md/diceroller.md`
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
