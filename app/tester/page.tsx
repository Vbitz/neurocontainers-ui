"use client";

import { useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { inputStyles, buttonStyles, cn } from "@/lib/styles";

export default function TesterPage() {
  const { isDark } = useTheme();
  const [backend, setBackend] = useState("http://localhost:8080");
  const [spec, setSpec] = useState("");

  const openTerminal = () => {
    if (!backend || !spec) return;
    const url = `/tester/terminal?backend=${encodeURIComponent(backend)}&spec=${encodeURIComponent(spec)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <div>
        <label className={cn("mb-1 block")}>Backend URL</label>
        <input
          className={cn(inputStyles(isDark), "w-full")}
          value={backend}
          onChange={(e) => setBackend(e.target.value)}
          placeholder="http://localhost:8080"
        />
      </div>
      <div>
        <label className={cn("mb-1 block")}>Spec YAML URL</label>
        <input
          className={cn(inputStyles(isDark), "w-full")}
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          placeholder="https://example.com/build.yaml"
        />
      </div>
      <button
        onClick={openTerminal}
        className={buttonStyles(isDark, "primary", "md")}
      >
        Open Test Terminal
      </button>
    </div>
  );
}

