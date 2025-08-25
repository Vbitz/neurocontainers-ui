"use client";

import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/styles';
import { useTheme } from '@/lib/ThemeContext';
import { loadStoredYamlGroups, saveStoredYamlGroups, upsertStoredYamlGroup, removeStoredYamlGroup, exportStoredYamlGroups, importStoredYamlGroups, StoredYamlGroup } from '@/lib/yamlGroupEditor/localStorage';
import { parseYamlGroup } from '@/lib/yamlGroupEditor/loader';
import processYamlGroup from '@/lib/yamlGroupEditor';
import { getBuiltinYamlGroups } from '@/lib/yamlGroupEditor/builtin';
import { dump as dumpYAML } from 'js-yaml';

export default function YamlGroupEditorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isDark } = useTheme();
  const [groups, setGroups] = useState<StoredYamlGroup[]>([]);
  const [builtin, setBuiltin] = useState<{ filename: string; yaml: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [yamlText, setYamlText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [argValues, setArgValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!isOpen) return;
    try {
      const loaded = loadStoredYamlGroups();
      setGroups(loaded);
      setBuiltin(getBuiltinYamlGroups());
      if (loaded.length > 0) {
        setActiveId(loaded[0].id);
        setYamlText(loaded[0].yaml);
      } else {
        setActiveId(null);
        setYamlText('');
      }
      setError(null);
      setInfo(null);
    } catch (e) {
      setError(`Failed to load stored groups: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [isOpen]);

  const parsed = useMemo(() => {
    if (!yamlText.trim()) return null;
    try {
      const parsed = parseYamlGroup(yamlText);
      setError(null);
      return parsed;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [yamlText]);

  // Initialize or reset argument values when parsed group changes
  useEffect(() => {
    if (!parsed) {
      setArgValues({});
      return;
    }
    const initial: Record<string, unknown> = {};
    for (const arg of parsed.arguments) {
      // Respect defaultValue; fall back to sensible empty values
      if (arg.defaultValue !== undefined) {
        initial[arg.name] = arg.defaultValue as unknown;
      } else {
        switch (arg.type) {
          case 'boolean': initial[arg.name] = false; break;
          case 'array': initial[arg.name] = []; break;
          default: initial[arg.name] = '';
        }
      }
    }
    setArgValues(initial);
  }, [parsed]);

  const directivesPreview = useMemo(() => {
    try {
      if (!parsed) return [] as unknown[];
      return processYamlGroup(parsed, argValues);
    } catch {
      return [];
    }
  }, [parsed, argValues]);

  const onNew = () => {
    setActiveId(null);
    setYamlText('');
    setError(null);
    setInfo(null);
  };

  const onSave = () => {
    try {
      const p = parseYamlGroup(yamlText);
      const key = p.metadata.key;
      const updated = upsertStoredYamlGroup({ id: activeId ?? undefined, key, yaml: yamlText, enabled: true });
      setGroups(updated);
      const rec = updated.find(g => g.key === key && g.yaml === yamlText);
      setActiveId(rec?.id ?? null);
      setInfo('Saved to local storage and enabled. It will auto-register on reload.');
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onDelete = (id: string) => {
    const updated = removeStoredYamlGroup(id);
    setGroups(updated);
    if (activeId === id) {
      setActiveId(null);
      setYamlText('');
    }
  };

  const toggleEnabled = (id: string) => {
    const updated = groups.map(g => g.id === id ? { ...g, enabled: !g.enabled, updatedAt: Date.now() } : g);
    saveStoredYamlGroups(updated);
    setGroups(updated);
  };

  const onExportAll = () => {
    const blob = new Blob([exportStoredYamlGroups()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yaml-groups.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportAll = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const updated = importStoredYamlGroups(text);
        setGroups(updated);
        setInfo('Imported YAML groups from file.');
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={cn(
        'relative w-[95vw] max-w-6xl max-h-[90vh] rounded-xl overflow-hidden border shadow-xl',
        isDark ? 'bg-[#0f130f]/95 border-[#2d4222]/50' : 'bg-white/95 border-gray-200/60'
      )}>
        <div className={cn('flex items-center justify-between px-4 py-3 border-b', isDark ? 'border-[#2d4222]/50' : 'border-gray-200/60')}>
          <h2 className={cn('text-lg font-semibold', isDark ? 'text-[#e8f5d0]' : 'text-gray-900')}>Custom Group Editor (Beta)</h2>
          <button onClick={onClose} className={cn('p-2 rounded-lg', isDark ? 'hover:bg-[#1e2a16]' : 'hover:bg-gray-100')}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex h-[70vh]">
          {/* Left: stored groups */}
          <div className={cn('w-64 border-r overflow-y-auto', isDark ? 'border-[#2d4222]/50' : 'border-gray-200/60')}>
            <div className="p-3 flex items-center justify-between">
              <button className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md text-sm', isDark ? 'bg-[#1e2a16] text-[#c4e382]' : 'bg-green-50 text-green-700 hover:bg-green-100')} onClick={onNew}>
                <PlusIcon className="h-4 w-4" /> New
              </button>
              <div className="flex items-center gap-2">
                <button className={cn('p-2 rounded-md', isDark ? 'hover:bg-[#1e2a16]' : 'hover:bg-gray-100')} onClick={onExportAll} title="Export all">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
                <label className={cn('p-2 rounded-md cursor-pointer', isDark ? 'hover:bg-[#1e2a16]' : 'hover:bg-gray-100')} title="Import">
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportAll(f); e.currentTarget.value=''; }} />
                </label>
              </div>
            </div>
            <div className="px-2 pb-2 space-y-1">
              <div className={cn('px-2 py-1 text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>Built-in</div>
              {builtin.map(b => {
                let key = '';
                try { key = parseYamlGroup(b.yaml).metadata.key; } catch { key = b.filename; }
                return (
                  <div key={b.filename} className={cn('flex items-center justify-between px-2 py-2 rounded-md')}>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{key}</span>
                      <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{b.filename}</span>
                    </div>
                    <button
                      className={cn('px-2 py-1 rounded-md text-xs', isDark ? 'bg-[#1e2a16] text-[#c4e382]' : 'bg-green-50 text-green-700 hover:bg-green-100')}
                      onClick={() => { setYamlText(b.yaml); setActiveId(null); }}
                      title="Edit a copy"
                    >
                      Duplicate
                    </button>
                  </div>
                );
              })}

              <div className={cn('px-2 mt-2 py-1 text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>My Groups</div>
              {groups.map(g => (
                <div key={g.id} className={cn('flex items-center justify-between px-2 py-2 rounded-md cursor-pointer', activeId === g.id ? (isDark ? 'bg-[#1e2a16]' : 'bg-gray-100') : '')} onClick={() => { setActiveId(g.id); setYamlText(g.yaml); }}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{g.key}</span>
                    <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{new Date(g.updatedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className={cn('p-1 rounded-md text-xs', g.enabled ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-gray-400' : 'text-gray-500'))} onClick={(e) => { e.stopPropagation(); toggleEnabled(g.id); }}>
                      {g.enabled ? <CheckCircleIcon className="h-4 w-4" /> : <ExclamationCircleIcon className="h-4 w-4" />}
                    </button>
                    <button className={cn('p-1 rounded-md text-xs', isDark ? 'hover:bg-[#2a3a1f]' : 'hover:bg-gray-200')} onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}>
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: editor */}
          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button className={cn('px-3 py-1.5 rounded-md text-sm', isDark ? 'bg-[#1e2a16] text-[#c4e382]' : 'bg-green-50 text-green-700 hover:bg-green-100')} onClick={onSave}>Save & Enable</button>
                {parsed ? (
                  <span className={cn('text-xs flex items-center gap-1', isDark ? 'text-green-300' : 'text-green-700')}>
                    <CheckCircleIcon className="h-4 w-4" /> {parsed.metadata.key} • {directivesPreview.length} directives
                  </span>
                ) : error ? (
                  <span className={cn('text-xs flex items-center gap-1', isDark ? 'text-red-300' : 'text-red-700')}>
                    <ExclamationCircleIcon className="h-4 w-4" /> Invalid YAML
                  </span>
                ) : null}
              </div>
              {info && <span className={cn('text-xs', isDark ? 'text-blue-300' : 'text-blue-700')}>{info}</span>}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-0 h-full">
              <div className="p-3 h-full">
                <textarea className={cn('w-full h-full resize-none rounded-md border p-3 font-mono text-sm', isDark ? 'bg-[#0b0e0b] border-[#2d4222]/50 text-[#e8f5d0]' : 'border-gray-200')} value={yamlText} onChange={(e) => setYamlText(e.target.value)} placeholder="Paste or write YAML group definition here..." />
                {error && <div className={cn('mt-2 text-xs', isDark ? 'text-red-300' : 'text-red-700')}>{error}</div>}
              </div>
              <div className="p-3 h-full overflow-auto space-y-3">
                <div>
                  <div className={cn('text-xs mb-2 font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>Arguments</div>
                  <div className="grid grid-cols-2 gap-3">
                    {parsed?.arguments.map((arg) => {
                      const val = argValues[arg.name];
                      const update = (v: unknown) => setArgValues(prev => ({ ...prev, [arg.name]: v }));
                      const labelCls = cn('text-xs block mb-1', isDark ? 'text-gray-300' : 'text-gray-700');
                      const inputCls = cn('w-full text-sm rounded-md border px-2 py-1', isDark ? 'bg-[#0b0e0b] border-[#2d4222]/50 text-[#e8f5d0]' : 'border-gray-300');
                      switch (arg.type) {
                        case 'dropdown':
                          return (
                            <div key={arg.name}>
                              <label className={labelCls}>{arg.name}</label>
                              <select className={inputCls} value={String(val ?? '')} onChange={(e) => update(e.target.value)}>
                                {(arg.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                          );
                        case 'boolean':
                          return (
                            <label key={arg.name} className={cn('flex items-center gap-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                              <input type="checkbox" checked={Boolean(val)} onChange={(e) => update(e.target.checked)} />
                              <span className="text-xs">{arg.name}</span>
                            </label>
                          );
                        case 'array':
                          return (
                            <div key={arg.name}>
                              <label className={labelCls}>{arg.name} (comma-separated)</label>
                              <input className={inputCls} value={Array.isArray(val) ? (val as string[]).join(', ') : ''} onChange={(e) => update(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                            </div>
                          );
                        case 'text':
                        default:
                          if ((arg as unknown as { multiline?: boolean }).multiline) {
                            return (
                              <div key={arg.name} className="col-span-2">
                                <label className={labelCls}>{arg.name}</label>
                                <textarea rows={4} className={inputCls} value={String(val ?? '')} onChange={(e) => update(e.target.value)} />
                              </div>
                            );
                          }
                          return (
                            <div key={arg.name}>
                              <label className={labelCls}>{arg.name}</label>
                              <input className={inputCls} value={String(val ?? '')} onChange={(e) => update(e.target.value)} />
                            </div>
                          );
                      }
                    })}
                  </div>
                </div>
                <div>
                  <div className={cn('text-xs mb-2 font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>Directives preview (YAML)</div>
                  <pre className={cn('text-xs p-3 rounded-md overflow-auto', isDark ? 'bg-[#0b0e0b] text-[#e8f5d0] border border-[#2d4222]/40' : 'bg-gray-50')}>
{dumpYAML(directivesPreview).trim()}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
