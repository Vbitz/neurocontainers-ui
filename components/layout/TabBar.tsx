"use client";

import { XMarkIcon, ExclamationTriangleIcon, DocumentTextIcon, BookOpenIcon, HomeIcon } from "@heroicons/react/24/outline";
import { useTabs } from "@/lib/tabs/TabManager";
import { cn, buttonStyles, cardStyles, textStyles } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";
import { useMemo, useState } from "react";
import { saveContainer } from "@/lib/containerStorage";

export function TabBar() {
  const { tabs, activeId, activate, close, update } = useTabs();
  const { isDark } = useTheme();
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
  const closingTab = useMemo(() => tabs.find(t => t.id === confirmCloseId), [tabs, confirmCloseId]);

  const iconFor = (type: string) => {
    switch (type) {
      case "home": return HomeIcon;
      case "docs": return BookOpenIcon;
      case "group-editor": return DocumentTextIcon;
      default: return DocumentTextIcon;
    }
  };

  return (
    <div className={cn("w-full border-b", isDark ? "border-[#1f2e18]/60 bg-[#0a0c08]" : "border-[#e6f1d6] bg-white")}> 
      <div className="flex overflow-x-auto no-scrollbar">
        {tabs.map(t => {
          const Icon = iconFor(t.type);
          const isActive = t.id === activeId;
          return (
            <div key={t.id} className={cn("flex items-center gap-2 px-3 py-2 whitespace-nowrap cursor-pointer border-r", isDark ? "border-[#1f2e18]/60" : "border-[#e6f1d6]", isActive ? (isDark ? "bg-[#10140d]" : "bg-[#f0fdf4]") : "")} onClick={() => activate(t.id)}>
              <Icon className={cn("h-4 w-4", isDark ? "text-[#c4e382]" : "text-green-700")} />
              <span className={textStyles(isDark, { size: 'sm', color: 'primary' })}>{t.title}</span>
              {t.dirty ? <span className={cn("h-2 w-2 rounded-full", isDark ? "bg-yellow-400" : "bg-yellow-500")} /> : null}
              <button className={cn("ml-1 p-1 rounded", isDark ? "hover:bg-white/10" : "hover:bg-black/10")} onClick={(e) => { e.stopPropagation(); if (t.dirty) setConfirmCloseId(t.id); else close(t.id); }}>
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
      {confirmCloseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={cn(cardStyles(isDark, 'solid', 'lg'), "w-full max-w-md")}> 
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className={cn("h-5 w-5 mt-0.5", isDark ? "text-yellow-400" : "text-yellow-600")} />
              <div className="flex-1">
                <h3 className={textStyles(isDark, { weight: 'semibold', color: 'primary' })}>Unsaved changes</h3>
                <p className={textStyles(isDark, { size: 'sm', color: 'muted' })}>This tab has unsaved changes. Close anyway?</p>
                <div className="mt-3 flex justify-end gap-2">
                  <button className={buttonStyles(isDark, 'secondary', 'sm')} onClick={() => setConfirmCloseId(null)}>Cancel</button>
                  <button className={buttonStyles(isDark, 'primary', 'sm')} onClick={() => {
                    try {
                      const t = closingTab;
                      if (t?.type === 'recipe' && t.payload && (t.payload as any).recipe) {
                        const payload: any = t.payload;
                        const id = saveContainer(payload.recipe, payload.containerId);
                        update(t.id, (draft) => { draft.dirty = false; draft.payload = { ...payload, containerId: id }; });
                        close(t.id);
                        setConfirmCloseId(null);
                      } else {
                        // For other tab types, just close
                        if (t) close(t.id);
                        setConfirmCloseId(null);
                      }
                    } catch (e) {
                      console.error('Failed to save before close', e);
                      alert('Failed to save before closing. Please try again.');
                    }
                  }}>Save and close</button>
                  <button className={buttonStyles(isDark, 'danger', 'sm')} onClick={() => { if (confirmCloseId) close(confirmCloseId); setConfirmCloseId(null); }}>Discard</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
