#!/usr/bin/env node

var neodoc = require("neodoc"),
	args = neodoc.run(`bbs2html

Usage:
  bbs2html [options] <files>...

Options:
  -o --out DIR       Output directory. [default: .]
  -s --src DIR       Source directory. [default: .]
  -i --inline-css    Make stylesheet inline in HTML file.

  -c --css-path FILE Stylesheet's save path, relative to HTML file or outdir.
                     [default: style.css]

  -a --absolute      Without this option, each HTML inside same directory will
                     use the same css file. Otherwise, only one css file relative to outdir is generated.

  -n --dry-run       Print the file name instead of writing.
  -h --help          Show this.
  -v --version       Show version.`, {
		laxPlacement: true
	});

require("./index").init({args});
