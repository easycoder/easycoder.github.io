* EasyCoder and WordPress

WordPress, which powers over a third of the world's websites, is a huge and thriving ecosystem with solutions to virtually any problem. One area that it falls short in, however, is interactivity. Sure, there are solutions for standard things like slideshows, but true interactivity follows no defined standard; it's often quite arbitrary.

However, in virtually all cases it's quite easy to explain in plain English what it is you want your site to do. In general it will be to react to a user action (or other event) by altering what is shown on screen. So what could be more natural than to take that same English description and run it as actual code?

That's what ~ec~ is all about. It's a programming language that looks like English, and its scripts can be embedded in any web page. It's a quick solution for people who want to add a little bit of interactivity to their page, or to get a bit more control over its content.

Most of the information in this website is relevant to WordPress, but part of it isn't needed because the WordPress environment is special. Rather than you having to create a HEAD and a BODY for every page, all you do is focus on the content. WordPress does the rest.

So to use ~ec~ in Wordpress, first add the ~ec~ plugin, which will call in the ~ec~ JavaScript engine when your page loads. Almost everything else is done as described elsewhere in these pages. You will need to create a special <div> to hold the EasyCoder script, and if it is to operate on some element of your page this will need its own id, so occasionally you'll have to drop into text editing mode.

A good place to start is by creating a blank Page and adding an empty <div> to it, such as

```
<div id="my-anchor-div"></div>
```

Then in your ~ec~ script, add a suitable variable:

```
<div id="easycoder-script">
div Anchor
...
attach Anchor to `my-anchor-div`
</div>
```

The variable Anchor now becomes the container in which your entire ~ec~ script lives and you can do anything you like with it. For example, go to the _Mexican Wave_ example in the codex, copy its code and paste this into your page, using `Anchor` as its parent container. When you load the page the animation runs - it's as simple as that.