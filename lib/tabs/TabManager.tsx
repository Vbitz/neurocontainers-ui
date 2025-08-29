"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type TabType = "home" | "recipe" | "docs" | "group-editor" | "wizard";

export interface Tab<T = unknown> {
  id: string;
  type: TabType;
  title: string;
  icon?: string; // heroicon name or data url
  dirty?: boolean;
  payload?: T;
}

interface TabState {
  tabs: Tab[];
  activeId: string | null;
}

interface TabManager extends TabState {
  open: (tab: Omit<Tab, "id"> & { id?: string }) => string;
  close: (id: string) => void;
  activate: (id: string) => void;
  update: (id: string, updater: (draft: Tab) => void) => void;
  reorder: (ids: string[]) => void;
}

const STORAGE_KEY = "nc-tabs-v1";
const STORAGE_ACTIVE_KEY = "nc-active-tab";

const TabContext = createContext<TabManager | null>(null);

function useHashParam(name: string) {
  const get = useCallback(() => {
    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    return params.get(name);
  }, [name]);
  const set = useCallback((value: string | null) => {
    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    if (value === null) params.delete(name); else params.set(name, value);
    const next = `#${params.toString()}`;
    if (next !== window.location.hash) {
      window.history.replaceState(null, "", next);
    }
  }, [name]);
  return { get, set };
}

function loadFromStorage(): TabState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const active = localStorage.getItem(STORAGE_ACTIVE_KEY);
    if (!raw) return null;
    const tabs: Tab[] = JSON.parse(raw);
    return { tabs, activeId: active };
  } catch {
    return null;
  }
}

function saveToStorage(state: TabState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tabs));
    if (state.activeId) localStorage.setItem(STORAGE_ACTIVE_KEY, state.activeId);
  } catch {}
}

function genId(prefix = "tab"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TabState>(() => {
    const stored = loadFromStorage();
    if (stored) return stored;
    const id = genId('home');
    return { tabs: [{ id, type: 'home', title: 'Library' } as Tab], activeId: id };
  });
  const isRestoredRef = useRef(false);
  const tabParam = useHashParam("tab");

  // Persist to storage
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Sync active tab to hash
  useEffect(() => {
    if (state.activeId) tabParam.set(state.activeId);
  }, [state.activeId, tabParam]);

  // Restore from hash on mount
  useEffect(() => {
    if (isRestoredRef.current) return;
    isRestoredRef.current = true;
    const fromStorage = loadFromStorage();
    const hashActive = tabParam.get();
    let next: TabState | null = null;
    if (fromStorage) next = fromStorage;
    if (hashActive) {
      const base = next ?? state;
      if (base.tabs.some(t => t.id === hashActive)) {
        next = { ...base, activeId: hashActive };
      }
    }
    if (next) setState(next);
  }, [tabParam, state]);

  const open = useCallback<TabManager["open"]>((tab) => {
    const id = tab.id ?? genId(tab.type);
    setState((s) => {
      const exists = s.tabs.find(t => t.id === id);
      const nextTabs = exists ? s.tabs.map(t => t.id === id ? { ...t, ...tab, id } : t) : [...s.tabs, { ...tab, id } as Tab];
      return { tabs: nextTabs, activeId: id };
    });
    return id;
  }, []);

  const close = useCallback<TabManager["close"]>((id) => {
    setState((s) => {
      const idx = s.tabs.findIndex(t => t.id === id);
      if (idx === -1) return s;
      const nextTabs = s.tabs.slice();
      nextTabs.splice(idx, 1);
      const wasActive = s.activeId === id;
      const nextActive = wasActive ? (nextTabs[idx - 1]?.id ?? nextTabs[0]?.id ?? null) : s.activeId;
      return { tabs: nextTabs, activeId: nextActive };
    });
  }, []);

  const activate = useCallback<TabManager["activate"]>((id) => {
    setState((s) => (s.activeId === id ? s : { ...s, activeId: id }));
  }, []);

  const update = useCallback<TabManager["update"]>((id, updater) => {
    setState((s) => {
      let changed = false;
      const nextTabs = s.tabs.map(t => {
        if (t.id !== id) return t;
        const draft = { ...t } as Tab;
        updater(draft);
        // Shallow compare to avoid unnecessary state updates
        if (
          draft.id !== t.id ||
          draft.type !== t.type ||
          draft.title !== t.title ||
          draft.icon !== t.icon ||
          draft.dirty !== t.dirty ||
          draft.payload !== t.payload
        ) {
          changed = true;
          return draft;
        }
        return t;
      });
      if (!changed) return s; // no-op if updater produced no real change
      return { ...s, tabs: nextTabs };
    });
  }, []);

  const reorder = useCallback<TabManager["reorder"]>((ids) => {
    setState((s) => {
      const map = new Map(s.tabs.map(t => [t.id, t] as const));
      const nextTabs: Tab[] = [];
      ids.forEach((id) => { const t = map.get(id); if (t) nextTabs.push(t); });
      s.tabs.forEach((t) => { if (!ids.includes(t.id)) nextTabs.push(t); });
      return { ...s, tabs: nextTabs };
    });
  }, []);

  const value = useMemo<TabManager>(() => ({ ...state, open, close, activate, update, reorder }), [state, open, close, activate, update, reorder]);

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

export function useTabs(): TabManager {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("useTabs must be used within TabProvider");
  return ctx;
}
