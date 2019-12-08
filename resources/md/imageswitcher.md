## Notes ##
The Image Switcher can be run as an independent web page; see [Image Switcher](/imageswitcher.html). If you view the page source you will see the entire script inside its special preformatted element.

After declaring all its variables, the script attaches its ~code:Container~ variable to the ~code:div~ element defined at the top of the file.It then sets the size of two arrays, ~code:Thumb~ and ~code:Image~, each of which will hold a set of 9 images as either thumbnails or full-size images. The script then creates the button bar with its 9 thumbnails and arrows at each end to move forward or back.

A listener is set up on the array of thumbnails. Note that in ~ec~ an array only needs a single listener as this will be set to apply to all elements. When it triggers, the array index is set to the selected element. Note also the use of ~code:Link~, which is not an array. Its purpose is to force each of the buttons to display a hand cursor on hover, by wrapping the image element.

Then the second array is set up with the full-size images. All the elements are set to ~code:hidden~ and given white borders, then at the end, at ~code:Select:~, the first one is made visible and given a blue border.

The blocks ~code:DoLeft:~, ~code:DoRight:~ and ~code:DoThumb:~ all deal with clicks on one of the arrows or on a thumbnail. Each one hides the current image, identifies the one to be shown and makes it visible.
