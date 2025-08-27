"use client";

import YamlGroupEditorPanel from "@/components/YamlGroupEditorPanel";

export function GroupEditorTab() {
  // Use the existing panel version as an embedded tab surface
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <YamlGroupEditorPanel />
    </div>
  );
}

