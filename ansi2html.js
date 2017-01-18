#!/usr/bin/env node
/* eslint-env node */

var neodoc = require("neodoc"),
	args = neodoc.run(`ansi2html

Usage:
  ansi2html [options] <files>...

Options:
  -o --out DIR    Output directory. [default: .]
  -s --src DIR    Source directory. [default: .]
  --inline-css    Make stylesheet inline in HTML file.

  --css-path FILE Stylesheet's save path, relative to HTML file or outdir.
                  [default: style.css]

  --absolute      Without this option, each HTML inside same directory will use
                  the same css file. Otherwise, only one css file relative to
				  outdir is generated.

  --dry-run       Print the file name instead of writing.
  -h --help       Show this.
  --version       Show version.`, {version: "0.0.0"});

var io = function(){
	var writeMem = new Set,
		fs = require("fs-extra"),
		dry;
	return {
		write(file, content) {
			if (writeMem.has(file)) return;
			if (dry) {
				process.stdout.write(file + "\n");
				return;
			}
			fs.outputFileSync(file, content, "utf8");
		},
		dry(f = true) {
			dry = f;
		}
	};
}();

var getCss = function(){
	var css, fs = require("fs");
	return function() {
		if (!css) {
			css = fs.readFileSync(require.resolve("bbs-reader/bbs-reader.css"), "utf8");
		}
		return css;
	};
}();

var getInlineCss = function(){
	var css;
	return () => {
		if (!css) {
			css = "data:text/css;charset=utf-8;base64," + Buffer.from(getCss(), "utf8").toString("base64");
		}
		return css;
	};
}();

function rename(file, o) {
	var path = require("path"),
		r = Object.assign(path.parse(file), o);
		
	if (!o.base) {
		delete r.base;
	}
	
	return path.format(r);
}

function init({
	"--out": out,
	"--src": src,
	"--inline-css": inline,
	"--css-path": cssPath,
	"--absolute": absolute,
	"--dry-run": dry,
	"<files>": files
}) {
	var fs = require("fs"),
		path = require("path"),
		uao = require("uao-js"),
		
		glob = require("glob"),
		bbsReader = require("bbs-reader");
		
	out = path.resolve(out);
	src = path.resolve(src);
	files = files.map(file => path.resolve(src, file));
	
	if (absolute) {
		cssPath = path.resolve(out, cssPath);
	} else if (path.isAbsolute(cssPath)) {
		throw new Error("can't use absolute css path in relative mode");
	}
	
	if (dry) {
		io.dry();
	}
	
	while (files.length) {
		var file = files.pop(), content;
		
		try {
			content = fs.readFileSync(file, "latin1");
		} catch (err) {
			files.push(...glob.sync(file));
			continue;
		}
		
		var result = bbsReader(content),
			dest = rename(
				path.resolve(out, path.relative(src, file)),
				{ext: ".html"}
			),
			css = inline ? getInlineCss() : absolute ? path.relative(path.dirname(dest), cssPath) : cssPath,
			html = `<!doctype>
<html>
	<head>
		<meta charset="utf-8">
		<title>${result.title||path.parse(file).base}</title>
		<link rel="stylesheet" href="${css}">
	</head>
	<body><div class="bbs">${result.html}</div></body>
</html>`;

		io.write(dest, uao.decode(html));
		if (!inline) {
			io.write(path.resolve(path.dirname(dest), css), getCss());
		}
	}
}

init(args);
