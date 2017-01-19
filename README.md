ansi2html
=========

A CLI tool to convert ANSI files into HTML.

Usage
-----
```
ansi2html

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
  --version       Show version.
```

Example
-------
With following file tree,
```
.
|-- a.ans
|-- b.ans
`-- c
   `-- c.ans
```
Convert .ans to .html:
```
ansi2html **/*.ans
```
Result:
```
.
|-- a.ans
|-- a.html
|-- b.ans
|-- b.html
|-- c
|  |-- c.ans
|  |-- c.html
|  `-- style.css
`-- style.css
```
Put result in different directory:
```
ansi2html -o result **/*.ans
```
Result:
```
.
|-- a.ans
|-- b.ans
|-- c
|  `-- c.ans
`-- result
   |-- a.html
   |-- b.html
   |-- c
   |  |-- c.html
   |  `-- style.css
   `-- style.css
```
Absolute mode:
```
ansi2html -o result/html --css-path ../css/style.css --absolute **/*.ans
```
Result:
```
|-- a.ans
|-- b.ans
|-- c
|  `-- c.ans
`-- result
   |-- css
   |  `-- style.css
   `-- html
      |-- a.html
      |-- b.html
      `-- c
         `-- c.html
```

Changelog
---------

* Next

    - First release.
