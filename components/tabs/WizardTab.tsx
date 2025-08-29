"use client";

import dynamic from "next/dynamic";
const GuidedTour = dynamic(() => import("@/components/GuidedTour"), { ssr: false });
import { useTabs } from "@/lib/tabs/TabManager";
import { useTheme } from "@/lib/ThemeContext";
import { getThemeComponents } from "@/lib/styles";

export function WizardTab({ tabId }: { tabId?: string }) {
  const { tabs, activeId, close, open } = useTabs();
  const effectiveId = tabId ?? activeId;
  const tab = tabs.find(t => t.id === effectiveId);
  const { isDark } = useTheme();
  const layout = getThemeComponents(isDark).layout;

  if (!tab) return null;

  return (
    <div className={layout.container + " py-4 sm:py-6"}>
      <div className="max-w-5xl mx-auto">
        <GuidedTour
          onClose={() => close(tab.id)}
          onComplete={(recipe) => {
            open({ type: 'recipe', title: recipe.name || 'Untitled', payload: { recipe } });
            close(tab.id);
          }}
          onPublish={(recipe) => {
            open({ type: 'recipe', title: recipe.name || 'Untitled', payload: { recipe } });
            close(tab.id);
          }}
        />
      </div>
    </div>
  );
}
