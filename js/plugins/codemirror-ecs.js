// This contains the code for color-highlighting .ecs scripts

(function (mod) {
	if (typeof exports == `object` && typeof module == `object`) // CommonJS
		mod(require(`../../lib/codemirror`));
	else if (typeof define == `function` && define.amd) // AMD
		define([`../../lib/codemirror`], mod);
	else // Plain browser env
		mod(CodeMirror);
})(function (CodeMirror) {
	"use strict";

	CodeMirror.defineMode(`ecs`, function () {
		return {
			startState: function () {
				return {
					inString: false,
					inComment: false
				};
			},
			token: function (stream, state) {
				stream.eatSpace();
				// If a string or a comment starts here
				if (!state.inString && stream.peek() === `\``) {
					stream.next(); // Skip quote
					state.inString = true;
				} else if (!state.inComment && stream.peek() === `!`) {
					stream.next(); // Skip shriek
					state.inComment = true;
				}

				if (state.inString) {
					if (stream.skipTo(`\``)) { // Quote found on this line
						stream.next(); // Skip quote
						state.inString = false; // Clear flag
					} else {
						stream.skipToEnd();
						state.inString = false; // Clear flag
					}
					return `string`; // Return the token style
				}
				
				else if (state.inComment) {
					stream.skipToEnd();
					state.inComment = false;
					return `comment`; // Return the token style
				}
				
				else {
					if (stream.match(/[A-Z][A-Za-z0-9-_]*/, true)) {
						return `attribute`;
					}
					if (stream.match(/[0-9]+/, true)) {
						return `number`;
					}
					stream.skipTo(` `) || stream.skipToEnd();
					return null; // Unstyled token
				}
			}
		};
	});

	CodeMirror.defineMIME(`text/x-ecs`, `ecs`);
});