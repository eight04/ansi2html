function createLogger() {
	var readline = require("readline");
	return {
		log(data = "", end = "\n") {
			process.stdout.write(data + end);
		},
		clear() {
			readline.clearLine(process.stdout, -1);
			readline.cursorTo(process.stdout, 0, null);
		}
	};
}

function createIO({logger = createLogger()} = {}) {
	var writeMem = new Set,
		fs = require("fs-extra"),
		dry;
	return {
		write(file, content) {
			if (writeMem.has(file)) return;
			writeMem.add(file);
			if (dry) {
				logger.log(file);
			} else {
				fs.outputFileSync(file, content, "utf8");
				logger.clear();
				logger.log(file, "");
			}
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
	logger = createLogger(),
	io = createIO({logger}),
	getCss = createCssGetter(),
	getInlineCss = createInlineCssGetter({getCss}),
	fc = fileCenter({src, out, cssPath, absolute}),
}) {
	var fs = require("fs"),
		uao = require("uao-js"),
		glob = require("glob"),
		bbsReader = require("bbs-reader"),
		
		count = 0;
		
	logger.log("bbs2html started\n");
		
	files = files.map(fc.input);
	
	if (dry) {
		io.dry();
	}
	
	while (files.length) {
		var file = files.pop(), content;
		
		try {
			content = fs.readFileSync(file, "latin1");
		} catch (err) {
			if (err.code != "ENOENT") {
				throw err;
			}
			files.push(...glob.sync(file));
			continue;
		}
		
		count++;
		
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
	
	if (count && !dry) logger.log();
	logger.log(`\nConverted ${count} files.`);
}

module.exports = {
	createIO, createCssGetter, createInlineCssGetter, fileCenter, init,
};
