# TicTacToe #
This step of the tutorial is a little longer. It's the ubiquitous children's game TicTacToe (in the UK usually known as Noughts and Crosses). This is one of the simplest of games to play, and also to implement in code. I discovered the same game presented as the first example in an official tutorial for the "React" JavaScript framework and was struck by how complex it seemed to be. Surely it could be coded more simply? So I rewrote it using ~ec~ and this was the result. The appearance won't win any prizes; it's basically the same as the React version. In both cases all the emphasis is on the code, but React is a component architecture so it bases everything on a set of objects that manage and draw the 9 squares, whereas this ~ec~ version focuses more on the game play and relegates the visualization components to second place.

~copy~

The script starts with the usual declarations, including variables ~code:Cell~ and ~code:Model~. One is the actual cell drawn on the screen; the other is the data representing whether the cell is empty or has an O or X in it. After the variable declarations, these two variables are given 9 elements each; one for every cell on the TicTacToe board.

The most notable thing in the initialization is to set up a table of winning combinations. We number the cells 0 through 8, with 0 at the top left and 8 at the bottom right and numbering row by row. The winning combinations are the three rows, the three columns and the two diagonals; that's 8 combinations in total. These are listed in the table.

Now we set up the board. At the top there's a message panel, then the board itself, which we set up by going through the cells one by one. They're all basically identical so the same code applies to each one. The only special thing is to start a new row every 3 cells. This is done with the ~code:modulo~ calculation at line 41, which divides ~code:Index~ by 3 and gives us the remainder. Each time the remainder is zero (for cells 0, 3 and 6) we start a new row. Then we add each new cell to the current row. We don't need to provide any position information for the cells because each one naturally takes its place next to the previous one; that's the way HTML works.

Now we can set up a 'callback' that will detect when one of the cells is clicked. As in the previous example we only need one of these as the cells are all in the same array. There's nothing to prevent the user clicking after the game has finished so we only allow 9 clicks in total, and similarly, if the game has already been won we take no action either.

Now we get the index of the cell that was clicked. If the ~code:Model~ shows this cell has already been clicked we do nothing.

If it's the turn of the 'X' player we set ~code:Cell~ to 'X' and put '1' into the corresponding element of ~code:Model~. If it's the 'O' player we put 'O' into ~code:Cell~ and '-1' into the ~code:Model~. Then we make a call to the subroutine that checks to see if we have a winner. (For beginners, a subroutine is a piece of code that you can call from anywhere in your program to do a specific job. When it finishes, your program continues at the line following the one that called the subroutine.)

The ~code:CheckWinner~ subroutine looks complicated but in fact it's quite simple. It runs through the 8 winning combinations one at a time. Each one consists of 3 cells that contain either 0, 1 or -1. If we add up the values for the 3 cells, then if the result is either 3 or -3 then we must have a winner. When we get back from the subroutine we check to see if a winner was found, and if so display a message.

And that's just about it. You should be able to see what's going on, but if it's not clear try using the tracer (refer to a couple of steps back) and get it to show you the values of the key variables.

~next:Handling lists~
