export default {};

console.log("invoked");
interface MyEmscriptenModule extends EmscriptenModule {
  thisProgram: string;
  setStatus: (msg: string) => void;
}

declare const self: { Module: Partial<MyEmscriptenModule> } & typeof globalThis;

const root = process.env.BASE_PATH + "/";

const liquidRunner = `
require "liquid"

script = ARGV[0]
template = Liquid::Template.parse(script)
puts template.render
`;

self.addEventListener("message", (msg) => {
  const code = msg.data;

  self.Module = {
    locateFile: (path) => root + path,
    postRun: [() => self.postMessage(["terminated"])],
    thisProgram: "ruby",
    arguments: ["-I/", "-I/lib", "-I/.ext/common", "-I/liquid/lib", "-I/liquid/test", "-e", liquidRunner, code],
    print: (line) => self.postMessage(["line", line]),
    printErr: (line) => self.postMessage(["line", line]),
    setStatus: (msg) => self.postMessage(["status", msg]),
  };

  importScripts(root + "fs.js");
  importScripts(root + "ruby.js");
});

// Run liquid
// arguments: ["-I/", "-I/lib", "-I/.ext/common", "-I/liquid/lib", "-I/liquid/test", "-e", liquidRunner, code],

/* Run liquid tests */
// arguments: ["-I/", "-I/lib", "-I/.ext/common", "-I/minitest/lib", "-I/liquid/lib", "-I/liquid/test", "-e", "Dir.glob('./liquid/test/**/*_test.rb').each { |f| require f }"],
