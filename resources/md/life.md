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

 The entire script can be seen at the [~ec~ repository](https://raw.githubusercontent.com/easycoder/easycoder.github.io/master/resources/ecs/life.ecs). Note: The formattion is a little uneven because all editing was done in the [Codex](). There's just one ~ec~ script, comprised mostly of subroutines. Here's a brief description of the functionality:

 