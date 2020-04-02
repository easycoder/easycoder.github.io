## The Game of Life

The Game of Life, also known simply as Life, is a cellular automaton devised by the British mathematician John Horton Conway in 1970.The game is a zero-player game, meaning that its evolution is determined by its initial state, requiring no further input. One interacts with the Game of Life by creating an initial configuration and observing how it evolves.

This implementation aims to meet all the following:

 - It is hosted statically.
 - It runs in any browser.
 - It is mobile-friendly.
 - The size of the map is user configurable.
 - The initial generation is user-configurable.
 - All configuration is done with the mouse (or touchscreen).
 - Initial generations can be saved in browser storage, retrieved to re-run and displayed as JSON or written to an email so they can be shared.
 - When run, the speed of the simulation can be varied by the user.
 - The simulation will run at a reasonable speed, e.g. up to 10 generations/sec or better depending on the size of the map.

The entire script can be seen at the [~ec~ repository](https://raw.githubusercontent.com/easycoder/easycoder.github.io/master/resources/ecs/lifedemo.ecs). Note: The formatting may look a little uneven because all editing was done in a tabbed editor. There's just one ~ec~ script, comprised mostly of subroutines. Here's a brief description of the functionality:

The script starts by defining all the variables it will use. Many of these are just temporary values; of the rest, the most important are `Map` and `Cell`, which hold information about the array of cells. `Map` is an array of true/false values to say which cells are occupied, and `Cell` is an array of DIVs, one for each cell.

Next, a few constants are assigned for the colours used.

Finally, the code sets up the screen; the map and the various controls under it, then waits for some interaction from the user. This can be either in one of the controls or a click on the map itself, which turns a cell from dead to alive or vice versa. Map setup is all handled by the `SetupMap` subroutine - see below.

After this are the various subroutines, that I'll describe briefly:

**`DoClear`**

Clears the entire map.

**`DoSave`**

Save the current map contents. The saved value is a JSON string giving the column and row numbers for each of the 'alive' cells. The origin is set at the center of the map; values to the left and above are negative. This is to permit the saved value to be reimported into any map with optional column and row offsets.

Data is saved to browser storage. You will be asked for a name for the item. All the saved items will appear under the `Load` button when it is clicked.

**`DoLoad`**

Load a saved configuration. The contents will be loaded at a position given by the top left of the screen plus the values given in the `Offset X` and `Offset Y` boxes. If either of the `Flip` checkboxes is checked, the corresponding transformation will be made before the item is placed on the map.

**`FlipHorizontal`**

Flips the item horizontally as it is loaded.

**`FlipVertical`**

Flips the item vertically as it is loaded.

**`DoRun`**

Run the game from the current configuration.

**`DoPause`**

Pause the game.

**`ResetKeySelector`**

When a saved item is selected in the `Load` dropdown this subroutine restores the selector to its default state. It is also called after a new item is saved, to ensure it appears in the list.

**`SetNCells`**

Sets the number of cells and updates the saved value. This falls into `SetupMap`** to refresh the display.

**`SetupMap`**

Sets up the map, computing the appropriate dimensions from the size of the container provided. It initialises the `Map` and `Cell` arrays and sets click listeners on each cell. Note that in ~ec~ an array only needs a single `on click` listener.

**`SetDeadBackground`**

Sets a cell to its 'dead' state. The center cell is a special case; it has a slightly darker background. This is to help with positioning shapes by hand.

**`ComputeNextGeneration`**

Computes the next generation from the current one, using the standard rules. At the end it falls into **`Redraw`**.

**`Redraw`**

Redraws the map in its new state.

**`CountNeighbours`**

For each cell in the map, count how many neighbours it has in the 'alive' state. This is by far the most time-consuming part of the entire script and is the first candidate for optimisation. In a 20x20 map it calls **`CheckCell`** 400 times; for a 60x60 map that's 3600 times. This puts a severe limit on the speed of the animation and also causes the computer itself to run hot. This is a good example of the relative merits of system programming languages and high-level scripts. The latter are very good at expressing _intentions_, that is, the look and feel of an app, but rather poor at handling _algorithms_. System languages, on the other hand, do algorithms well but are very clumsy when asked to express intentions.

**`CheckCell`**

Check if a specified cell is alive, using one of the 8 neighbour offsets added to the current column and row numbers.
