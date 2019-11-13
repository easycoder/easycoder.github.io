const AnagramFinder = {

	alphabet: [
		`a`,
		`b`,
		`c`,
		`d`,
		`e`,
		`f`,
		`g`,
		`h`,
		`i`,
		`j`,
		`k`,
		`l`,
		`m`,
		`n`,
		`o`,
		`p`,
		`q`,
		`r`,
		`s`,
		`t`,
		`u`,
		`v`,
		`w`,
		`x`,
		`y`,
		`z`
	],

	// Get anagrams from the given text
	getAnagrams: function (text, list) {
		const words = [];
		let remaining = text;
		let found;
		while (remaining) {
			found = false;
			const reduced = AnagramFinder.reduce(list, remaining.length);
			AnagramFinder.shuffle(reduced);
			const mtext = AnagramFinder.measure(remaining);
			for (let n = 0; n < reduced.length; n++) {
				const letters = AnagramFinder.measure(reduced[n]);
				if (AnagramFinder.contains(mtext, letters)) {
					words.push(reduced[n]);
					remaining = AnagramFinder.remove(mtext, letters);
					found = true;
					break;
				}
			}
			if (!found) break;
		}
		return {
			status: found ? `found` : ``,
			words
		};
	},

	// Remove a found word from the remaining text
	remove: function(remaining, letters) {
		let result = ``;
		for (let n = 0; n < 26; n++) {
			const letter = AnagramFinder.alphabet[n];
			remaining[letter] -= letters[letter];
			for (let m = 0; m < remaining[letter]; m++) {
				result += AnagramFinder.alphabet[n];
			}
		}
		return result;
	},

	// Copies a list, removing words longer than a given length
	reduce: function(list, len) {
		const result = [];
		for (let n = 0; n < list.length; n++) {
			if (list[n].length <= len) {
				result.push(list[n]);
			}
		}
		return result;
	},

	// Shuffle a list
	shuffle: function(list) {
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[list[i], list[j]] = [list[j], list[i]];
		}
	},

	// Check if one string contains another, by comparing maps
	contains: function(a, b) {
		for (let n = 0; n < 26; n++) {
			if (a[AnagramFinder.alphabet[n]] < b[AnagramFinder.alphabet[n]]) {
				return false;
			}
		}
		return true;
	},

	// Measure a word, returning a map of letter counts
	measure: function (t) {
		const map = {};
		for (let n = 0; n < 26; n++) {
			map[AnagramFinder.alphabet[n]] = 0;
		}
		const text = t.toLowerCase();
		for (let n = 0; n < text.length; n++) {
			const c = text.charAt(n);
			if (c.toLowerCase() != c.toUpperCase()) {
				map[c]++;
			}
		}
		return map;
	}
};