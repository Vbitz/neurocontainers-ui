"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    Terminal: any;
  }
}

export default function TerminalPage() {
  const params = useSearchParams();
  const termRef = useRef<HTMLDivElement>(null);

  const init = () => {
    const backend = params.get("backend");
    const spec = params.get("spec");
    if (!backend || !spec || !termRef.current) return;
    const term = new window.Terminal();
    term.open(termRef.current);
    const wsURL = backend.replace(/^http/, "ws") + `/ws?spec=${encodeURIComponent(spec)}`;
    const ws = new WebSocket(wsURL);
    ws.onmessage = (e) => term.write(e.data);
    term.onData((d: string) => ws.send(d));
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.Terminal) {
      init();
    }
  }, []);

  return (
    <div className="w-full h-screen">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/xterm/css/xterm.css"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/xterm/lib/xterm.js"
        onLoad={init}
      />
      <div ref={termRef} className="w-full h-full" />
    </div>
  );
}

