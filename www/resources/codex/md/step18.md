# Solitaire #
Solitaire is a generic name for a number of different activities/games/exercises for a single player. The most common variants are probably card games, but one of the most traditional is a game played on a wooden board having an array of holes initially filled with pegs. One hole is initially left empty and the rules are very simple; when you take a peg and jump over its neighbor into an empty space the neighbor is removed from the board. The challenge is to remove all but one peg. It's surprisingly difficult.

Here we have an electronic version of Solitaire. Pegs are moved using drag and drop, as outlined in the previous page, but here it gets somewhat more complicated. Note: Although this script will run on a mobile device it is less than ideal as a finger tends to obscure the view of where the peg is being dragged, and there seems to be no reliable way to stop the browser dragging the entire screen contents along with the item picked. There is a version of this script at [https://easycoder.software/solitaire/](https://easycoder.software/solitaire/) that uses selection instead of dragging and is better suited to mobile browsers.

~copy~

The code that draws the board is fairly typical of games and similar graphical programs, in that it calculates screen positions and sizes not by using fixed values but by computing values relative to some starting point. In this case for PC it's 500 pixels and for mobile it's the width of the screen. Although the code may take a while to examine it allows changes to be made quite simply. Here, the figures 7 and 14 relate to the number of pegs in a row, the 6 simply makes the pegs smaller and the 95 and 100 force the playing area to be smaller so it all fits inside the circle. I'll leave you to figure the rest.

The script makes extensive use of arrays each containing 49 elements, one for each cell on the board; a 7 by 7 array of cells, not all of which are used. The first of these arrays is a map describing the current state of the board. Each position has 1 of 3 values; 0 means a cell that's not part of the game, 1 is an empty cell and 2 means a peg is occupying the cell. Every cell has a peg; they never move except temporarily while being dragged, after which they are just made visible or invisible.

Two arrays - ~code:Lefts~ and ~code:Tops~ - hold the positions of each of the cells relative to the container.

Each cell is represented by an array of gray circles, and each peg by a red circle. Each peg can only occupy a hole. There are initially one fewer pegs than holes; the center cell is empty. The first part of the script deals with setting up the board, then we have the 3 event handlers for pick, drag and drop.

When you pick a peg, prior to dragging it the script works out if there is anywhere legal (within the rules of Solitaire) for it to be moved to. Pegs can move 2 places up, down, left or right but only if there's an empty cell at that position and a peg to jump over. If a move is possible the peg is painted a different color and move to the front by setting its z-index. The variable ~code:Selected~ is set to the peg index, which otherwise holds the value false.

When you drag the peg the script computes its new position and redraws it at that position. Then it checks if the current pointer position is within any of the 4 possible destinations. If so, it paints the hole yellow as a visual signal that you can drop the peg.

When you drop a peg there are 2 possible scenarios. If you have arrived at a valid destination the peg is moved back to its original z index, returned to its original home but removed (made invisible). The peg you jumped over is also removed and the previously invisible peg at the destination is made visible.

The second scenario is where you drop a peg somewhere other than at a valid destination. All we have to do here is restore things to their state prior to picking the peg.

All that remains to be done is to check if there are any more possible moves, and if not show a message to inform the player. There's no Restart button but it would not be hard to add one.

Eagle-eyed programmers might notice that the algorithms for finding valid moves are implemented twice but differently. This is largely because the script is a derivative of an earler version (that didn't use drag and drop). The technique used to test if a given peg can be moved is more concise but I decided to leave as it was the code that checks if there are any moves available. Each technique uses a number of arithmetical calculations and it demonstrates how there are often 2 or more ways to achieve any given goal.

~next:...~
