! Simple animation

  div Container
  div Button
  variable N
  
  create Container
  set the style of Container to `text-align:center`

! Create the array
  set the elements of Button to 3

! Create the buttons
  put 0 into N
  while N is less than 3
  begin
    index Button to N
    create Button in Container
    set the style of Button to
  	  `width:50px;height:50px;margin:0.5em;border-radius:50%`
      cat `;display:inline-block;visibility:hidden`
    if N is 0 set style `background` of Button to `red`
    else if N is 1 set style `background` of Button to `green`
    else set style `background` of Button to `blue`
    add 1 to N
  end

! Animate the buttons
  while true
  begin
  	put 0 into N
    while N is less than 3
    begin
    	index Button to N
        set style `visibility` of Button to `visible`
        wait 20 ticks
        set style `visibility` of Button to `hidden`
        add 1 to N
    end
  end
