## Notes

Dice Roller can be run as an independent web page; see [Dice Roller](https://easycoder.github.io/examples/dice). If you view the page source you will see the entire script inside its special preformatted element.

After declaring all its variables, the script attaches a variable to the &lt;div&gt; element defined at the top of the file. It then creates 2 dice and paints onto each one the number of spots chosen by a random election. Both the dice and its spots are &lt;div&gt; elements; the latter have rounded corners of 50% radius so they appear as circles.

There are many ways of drawing dots on a dice. In this example we use a table with 6 rows, one for each possible value. In each of these rows are 6 pairs of top/left values giving the position of a dot. The renderer finds the right line then works its way along it, taking each pair of values and creating a dot using absolute positioning. When it reaches a zero in the line it stops.
