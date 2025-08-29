"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

export default function TerminalPage() {
  const params = useSearchParams();
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);

  useEffect(() => {
    const backend = params.get("backend");
    const spec = params.get("spec");
    
    if (!backend || !spec || !termRef.current) return;

    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
      }
    });

    terminalRef.current = terminal;
    terminal.open(termRef.current);

    // Setup WebSocket connection
    const wsURL = backend.replace(/^http/, "ws") + `/ws?spec=${encodeURIComponent(spec)}`;
    const ws = new WebSocket(wsURL);
    
    ws.onmessage = (e) => terminal.write(e.data);
    terminal.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Cleanup function
    return () => {
      terminal.dispose();
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [params]);

  return (
    <div className="w-full h-screen">
      <div ref={termRef} className="w-full h-full" />
    </div>
  );
}

