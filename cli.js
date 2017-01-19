#!/usr/bin/env node

var neodoc = require("neodoc"),
	args = neodoc.run(`bbs2html

Usage:
  bbs2html [options] <files>...

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
  --version       Show version.`, {version: "0.1.1"});

require("./index").init({args});
