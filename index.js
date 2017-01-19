function createIO() {
	var writeMem = new Set,
		fs = require("fs-extra"),
		dry;
	return {
		write(file, content) {
			if (writeMem.has(file)) return;
			writeMem.add(file);
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
}

function createCssGetter() {
	var css, fs = require("fs");
	return function() {
		if (!css) {
			css = fs.readFileSync(require.resolve("bbs-reader/bbs-reader.css"), "utf8");
		}
		return css;
	};
}

function createInlineCssGetter({getCss}) {
	var css;
	return () => {
		if (!css) {
			css = "data:text/css;charset=utf-8;base64," + Buffer.from(getCss(), "utf8").toString("base64");
		}
		return css;
	};
}

function fileCenter({src, out, cssPath, absolute}) {
	var path = require("pathlib");
	
	out = path(out).resolve();
	src = path(src).resolve();
	cssPath = path(cssPath);
	
	if (absolute) {
		cssPath = cssPath.resolveFrom(out);
	} else if (cssPath.isAbsolute()) {
		throw new Error("can't use absolute css path in relative mode");
	}
	
	return {
		input(file) {
			return src.resolve(file).path;
		},
		output(file) {
			var dest = src.to(file).mount(out).rename({ext: ".html"}),
				css = absolute ? dest.dir().to(cssPath) : cssPath,
				cssDest = absolute ? cssPath : dest.dir().resolve(cssPath),
				base = path(file).base();
			return path.unwrap({dest, css, cssDest, base});
		}
	};
}

function init({
	args: {
		"--out": out,
		"--src": src,
		"--inline-css": inline,
		"--css-path": cssPath,
		"--absolute": absolute,
		"--dry-run": dry,
		"<files>": files,
	},
	io = createIO(),
	getCss = createCssGetter(),
	getInlineCss = createInlineCssGetter({getCss}),
	fc = fileCenter({src, out, cssPath, absolute}),
}) {
	var fs = require("fs"),
		uao = require("uao-js"),
		glob = require("glob"),
		bbsReader = require("bbs-reader");
		
	files = files.map(fc.input);
	
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
			{dest, css, cssDest, base} = fc.output(file);
		
		var html = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title>${result.title || base}</title>
		<link rel="stylesheet" href="${inline ? getInlineCss() : css}">
	</head>
	<body><div class="bbs">${result.html}</div></body>
</html>`;

		io.write(dest, uao.decode(html));
		if (!inline) {
			io.write(cssDest, getCss());
		}
	}
}

module.exports = {
	createIO, createCssGetter, createInlineCssGetter, fileCenter, init,
};
