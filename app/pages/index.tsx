import React, { FC, useCallback, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "xterm/css/xterm.css";
import { Terminal } from "xterm";

const Term = dynamic(() => import("../components/Term"), { ssr: false });
const Editor = dynamic(() => import("../components/Editor"), { ssr: false });

const code = `
This is a liquid template.

{% for i in (1..5) %}
  {{- i }}
{% endfor %}
`.trim();

const Home: FC = () => {
  const [xterm, setXterm] = useState<Terminal>();
  const [input, setInput] = useState(code);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");

  const onXterm = useCallback((xterm) => setXterm(xterm), []);

  const runWorker = (
    code: string,
    onMessage: (
      evt: ["status", string] | ["line", string] | ["terminated"]
    ) => void
  ) => {
    const worker = new Worker("../workers/emruby.worker.ts", {
      type: "module",
    });
    worker.onmessage = (evt) => onMessage(evt.data);
    worker.postMessage(code);
  };

  const clicked = useCallback(() => {
    if (xterm) {
      xterm.clear();
      setRunning(true);
      runWorker(input, (evt) => {
        switch (evt[0]) {
          case "status":
            setStatus(evt[1]);
            break;
          case "line":
            xterm.write(evt[1] + "\n");
            break;
          case "terminated":
            setRunning(false);
            break;
        }
      });
    }
  }, [input, xterm]);

  return (
    <div className="container-fluid">
      <Head>
        <title>emliquid: A liquid interpreter in the browser</title>
      </Head>
      <h1>emliquid: A liquid interpreter in the browser</h1>
      <p>
        This is a fork of <a href="https://github.com/mame/emruby">emruby</a> that runs liquid in the browser through WASM. Powered by{" "}
        <a href="https://emscripten.org/">Emscripten</a>.
      </p>
      <h2 className="mt-4">Code</h2>
      <Editor text={input} onChange={(text) => setInput(text)} />
      <Button disabled={running} onClick={clicked} className="mt-3">
        {running ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
            <span className="sr-only">Loading...</span> {status}
          </>
        ) : (
          "Run"
        )}
      </Button>
      <h2 className="mt-4">Result</h2>
      <Term onXterm={onXterm} needFit={true} needLocalEcho={false} />
    </div>
  );
};

export default Home;
