const EasyCoder_Markdown = {

	escapeHtml: (text) => {
		return `${text}`
			.replace(/&/g, `&amp;`)
			.replace(/</g, `&lt;`)
			.replace(/>/g, `&gt;`)
			.replace(/\"/g, `&quot;`)
			.replace(/'/g, `&#39;`);
	},

	normalizeColor: (value) => {
		const color = `${value || ``}`.trim();
		if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
			return color;
		}
		if (/^[a-zA-Z]+$/.test(color)) {
			return color.toLowerCase();
		}
		return null;
	},

	normalizeFontFamily: (value) => {
		const key = `${value || ``}`.trim().toLowerCase();
		const map = {
			sansserif: `sans-serif`,
			serif: `serif`,
			monospace: `monospace`,
			system: `system-ui`
		};
		return map[key] || null;
	},

	applyExtendedInline: (html) => {
		let output = html;
		output = output.replace(/\[\[color=([^\]]+)\]\]([\s\S]*?)\[\[\/color\]\]/gi,
			(match, rawColor, content) => {
				const color = EasyCoder_Markdown.normalizeColor(rawColor);
				if (!color) {
					return content;
				}
				return `<span style="color:${color};">${content}</span>`;
			});
		output = output.replace(/\[\[font=([^\]]+)\]\]([\s\S]*?)\[\[\/font\]\]/gi,
			(match, rawFont, content) => {
				const fontFamily = EasyCoder_Markdown.normalizeFontFamily(rawFont);
				if (!fontFamily) {
					return content;
				}
				return `<span style="font-family:${fontFamily};">${content}</span>`;
			});
		return output;
	},

	renderToHtml: (markdown) => {
		const source = `${markdown == null ? `` : markdown}`.replace(/\r\n?/g, `\n`);
		const parseInline = (text) => {
			let html = EasyCoder_Markdown.escapeHtml(text);
			html = html.replace(/`([^`]+)`/g, `<code>$1</code>`);
			html = html.replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`);
			html = html.replace(/__([^_]+)__/g, `<strong>$1</strong>`);
			html = html.replace(/(^|[^*])\*([^*]+)\*/g, `$1<em>$2</em>`);
			html = html.replace(/(^|[^_])_([^_]+)_/g, `$1<em>$2</em>`);
			html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`);
			html = EasyCoder_Markdown.applyExtendedInline(html);
			return html;
		};

		const out = [];
		let inCodeBlock = false;
		let inBlockquote = false;
		let listType = ``;
		const closeList = () => {
			if (listType) {
				out.push(`</${listType}>`);
				listType = ``;
			}
		};
		const closeBlockquote = () => {
			if (inBlockquote) {
				closeList();
				out.push(`</blockquote>`);
				inBlockquote = false;
			}
		};

		for (const rawLine of source.split(`\n`)) {
			const line = rawLine;
			if (line.trim().startsWith(`\`\`\``)) {
				closeBlockquote();
				closeList();
				if (!inCodeBlock) {
					out.push(`<pre><code>`);
					inCodeBlock = true;
				} else {
					out.push(`</code></pre>`);
					inCodeBlock = false;
				}
				continue;
			}
			if (inCodeBlock) {
				out.push(`${EasyCoder_Markdown.escapeHtml(line)}\n`);
				continue;
			}

			if (line.trim() === ``) {
				closeBlockquote();
				closeList();
				continue;
			}

			const quote = /^>\s?(.*)$/.exec(line);
			if (quote) {
				closeList();
				if (!inBlockquote) {
					out.push(`<blockquote>`);
					inBlockquote = true;
				}
				out.push(`<p>${parseInline(quote[1])}</p>`);
				continue;
			}
			closeBlockquote();

			const heading = /^(#{1,6})\s+(.*)$/.exec(line);
			if (heading) {
				closeList();
				const level = heading[1].length;
				out.push(`<h${level} style="font-family:sans-serif;">${parseInline(heading[2])}</h${level}>`);
				continue;
			}

			const ulist = /^[-*]\s+(.*)$/.exec(line);
			if (ulist) {
				if (listType !== `ul`) {
					closeList();
					listType = `ul`;
					out.push(`<ul>`);
				}
				out.push(`<li>${parseInline(ulist[1])}</li>`);
				continue;
			}

			const olist = /^\d+\.\s+(.*)$/.exec(line);
			if (olist) {
				if (listType !== `ol`) {
					closeList();
					listType = `ol`;
					out.push(`<ol>`);
				}
				out.push(`<li>${parseInline(olist[1])}</li>`);
				continue;
			}

			closeList();
			out.push(`<p>${parseInline(line)}</p>`);
		}

		closeList();
		closeBlockquote();
		if (inCodeBlock) {
			out.push(`</code></pre>`);
		}
		return out.join(`\n`);
	}
};
