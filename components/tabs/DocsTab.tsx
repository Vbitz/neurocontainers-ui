"use client";

import dynamic from "next/dynamic";
import { getThemeComponents } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

const DirectiveDocumentation = dynamic(() => import("@/components/DirectiveDocumentation"), {
  ssr: false,
  loading: () => <div className="py-8 text-center text-sm opacity-70">Loading documentation…</div>
});

// Render documentation inline and nearly full width.
export function DocsTab() {
  const { isDark } = useTheme();
  const tc = getThemeComponents(isDark);
  return (
    <div className={tc.layout.container + " py-4 sm:py-6"}>
      <DirectiveDocumentation variant="inline" />
    </div>
  );
}
