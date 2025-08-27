"use client";

import React, { useEffect, useRef } from "react";
import { Ribbon } from "@/components/layout/Ribbon";
import { TabBar } from "@/components/layout/TabBar";
import { TabProvider, useTabs } from "@/lib/tabs/TabManager";
import { useTheme } from "@/lib/ThemeContext";
import { cn } from "@/lib/styles";
import { HomeTab } from "@/components/tabs/HomeTab";
import { DocsTab } from "@/components/tabs/DocsTab";
import { GroupEditorTab } from "@/components/tabs/GroupEditorTab";
import { RecipeTab } from "@/components/tabs/RecipeTab";
import { DeepLinkHandler } from "@/components/layout/DeepLinkHandler";
import { Background } from "@/components/layout/Background";
import { WizardTab } from "@/components/tabs/WizardTab";
import { Logo } from "@/components/ui/Logo";

function Content() {
  const { tabs, activeId, open } = useTabs();
  const active = tabs.find(t => t.id === activeId);
  const { isDark } = useTheme();
  // Preserve scroll positions per tab id
  const scrollMapRef = useRef<Record<string, number>>({});
  const lastActiveRef = useRef<string | null>(null);

  useEffect(() => {
    const last = lastActiveRef.current;
    if (last) {
      scrollMapRef.current[last] = window.scrollY;
    }
    const y = activeId ? (scrollMapRef.current[activeId] ?? 0) : 0;
    // Defer restoring scroll until after content mounts/paints
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const target = Math.min(y, maxY);
        window.scrollTo({ top: target, behavior: 'auto' });
      });
    });
    lastActiveRef.current = activeId;
  }, [activeId]);

  // If there are no tabs open, show landing screen with logo and open button
  if (tabs.length === 0) {
    return (
      <div className="min-h-[calc(100vh-96px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center"><Logo className="h-8 w-auto" /></div>
          <div>
            <button
              className={cn("px-4 py-2 rounded-md text-sm", isDark?"bg-[#1f2e18] text-white":"bg-gray-100 text-gray-800")}
              onClick={() => open({ type: 'home', title: 'Library' })}
            >
              Open Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-[calc(100vh-96px)]", isDark?"bg-transparent":"bg-transparent")}> 
      {tabs.map(t => (
        <div
          key={t.id}
          className={cn(t.id === activeId ? "block" : "hidden")}
          aria-hidden={t.id === activeId ? undefined : true}
        >
          {t.type === 'home' ? <HomeTab /> :
           t.type === 'docs' ? <DocsTab /> :
           t.type === 'group-editor' ? <GroupEditorTab /> :
           t.type === 'recipe' ? <RecipeTab tabId={t.id} /> :
           t.type === 'wizard' ? <WizardTab tabId={t.id} /> : null}
        </div>
      ))}
    </div>
  );
}

export function AppLayout() {
  return (
    <TabProvider>
      <div className="relative min-h-screen">
        <Background />
        <DeepLinkHandler />
        <div className="sticky top-0 z-40">
          <Ribbon />
          <TabBar />
        </div>
        <Content />
      </div>
    </TabProvider>
  );
}
