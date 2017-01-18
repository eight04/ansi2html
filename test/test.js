var {describe, it} = require("mocha"),
	{assert} = require("chai"),
	proxyquire = require("proxyquire"),
	sinon = require("sinon"),
	path = require("pathlib");

var fs = {
	readFileSync: sinon.spy(() => "fakeData")
};

var fsExtra = {
	outputFileSync: sinon.spy()
};

var glob = {
	files: [],
	sync: sinon.spy(() => glob.files)
};

var {
	createIO, createCssGetter, createInlineCssGetter,
	fileCenter, init
} = proxyquire("../index", {fs, "fs-extra": fsExtra, glob});

describe("io", () => {

	it("don't write to the same path twice", () => {
		var io = createIO();
		fsExtra.outputFileSync.reset();

		io.write("path/to/file", "randomData");
		io.write("path/to/file", "randomData");

		assert(fsExtra.outputFileSync.calledOnce);
	});

	it("dry run", () => {
		var io = createIO();
		fsExtra.outputFileSync.reset();

		io.dry();
		io.write("path/to/file", "randomData");

		assert.isFalse(fsExtra.outputFileSync.called);
	});

});

describe("getCss", () => {

	it("css file should only be read once", () => {
		var getCss = createCssGetter();
		fs.readFileSync.reset();

		getCss();
		getCss();

		assert(fs.readFileSync.calledOnce);
	});

});

describe("getInlineCss", () => {

	it("css file should only be read once", () => {
		var getCss = sinon.spy(() => "random data"),
			getInlineCss = createInlineCssGetter({getCss});

		getInlineCss();
		getInlineCss();

		assert.isTrue(getCss.calledOnce);
	});

});

describe("fileCenter", () => {

	it("default", () => {
		var fc = fileCenter({src: ".", out: ".", cssPath: "style.css"});
		assert.equal(fc.input("test.ans"), path("test.ans").resolve().path);
		var {dest, cssDest, css, base} = fc.output("path/to/file.ans");
		assert.equal(dest, path("path/to/file.html").resolve().path);
		assert.equal(cssDest, path("path/to/style.css").resolve().path);
		assert.equal(css, "style.css");
		assert.equal(base, "file.ans");
	});

	it("src", () => {
		var fc = fileCenter({src: "/src", out: ".", cssPath: "style.css"});
		assert.equal(fc.input("test.ans"), path("/src/test.ans").resolve().path);
		var {dest, cssDest, css, base} = fc.output("/src/to/file.ans");
		assert.equal(dest, path("./to/file.html").resolve().path);
		assert.equal(cssDest, path("./to/style.css").resolve().path);
		assert.equal(css, "style.css");
		assert.equal(base, "file.ans");
	});

	it("out", () => {
		var fc = fileCenter({src: "/src", out: "/out", cssPath: "style.css"});
		assert.equal(fc.input("test.ans"), path("/src/test.ans").resolve().path);
		var {dest, cssDest, css, base} = fc.output("/src/to/file.ans");
		assert.equal(dest, path("/out/to/file.html").resolve().path);
		assert.equal(cssDest, path("/out/to/style.css").resolve().path);
		assert.equal(css, "style.css");
		assert.equal(base, "file.ans");
	});

	it("cssPath", () => {
		var fc = fileCenter({src: "/src", out: "/out", cssPath: "sub/style.css"});
		var {dest, cssDest, css, base} = fc.output("/src/to/file.ans");
		assert.equal(dest, path("/out/to/file.html").resolve().path);
		assert.equal(cssDest, path("/out/to/sub/style.css").resolve().path);
		assert.equal(css, "sub/style.css");
		assert.equal(base, "file.ans");

		({dest, cssDest, css, base} = fc.output("/src/to/sub/file.ans"));
		assert.equal(dest, path("/out/to/sub/file.html").resolve().path);
		assert.equal(cssDest, path("/out/to/sub/sub/style.css").resolve().path);
		assert.equal(css, "sub/style.css");
		assert.equal(base, "file.ans");
	});

	it("absolute mode", () => {
		var fc = fileCenter({src: "/src", out: "/out", cssPath: "sub/style.css", absolute: true});
		var {dest, cssDest, css, base} = fc.output("/src/to/file.ans");
		assert.equal(dest, path("/out/to/file.html").resolve().path);
		assert.equal(cssDest, path("/out/sub/style.css").resolve().path);
		assert.equal(css, path("../sub/style.css").normalize().path);
		assert.equal(base, "file.ans");

		({dest, cssDest, css, base} = fc.output("/src/to/sub/file.ans"));
		assert.equal(dest, path("/out/to/sub/file.html").resolve().path);
		assert.equal(cssDest, path("/out/sub/style.css").resolve().path);
		assert.equal(css, path("../../sub/style.css").normalize().path);
		assert.equal(base, "file.ans");
	});

});

describe("init", () => {
	var createArgs = () => ({
		"--out": ".",
		"--src": ".",
		"--css-path": "style.css",
		"<files>": ["a.ans", "b.ans", "c.ans"]
	});

	it("--dry-run", () => {
		var args = Object.assign(createArgs(), {"--dry-run": true}),
			io = createIO();
		sinon.spy(io, "dry");
		init({args, io});
		assert(io.dry.calledOnce);
	});

	it("--inline-css", () => {
		var args = Object.assign(createArgs(), {"--inline-css": true}),
			getInlineCss = sinon.spy(() => "fakecss"),
			io = {write: sinon.spy()};
		init({args, getInlineCss, io});
		assert(io.write.called);
		assert(io.write.neverCalledWithMatch(/\.css$/i));
	});

});
