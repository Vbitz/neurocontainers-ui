"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { PlusIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { cn, buttonStyles, textStyles } from '@/lib/styles';
import { useTheme } from '@/lib/ThemeContext';
import { loadStoredYamlGroups, saveStoredYamlGroups, upsertStoredYamlGroup, removeStoredYamlGroup, importStoredYamlGroups, exportStoredYamlGroups, StoredYamlGroup } from '@/lib/yamlGroupEditor/localStorage';
import { parseYamlGroup, registerYamlGroup } from '@/lib/yamlGroupEditor/loader';
import processYamlGroup from '@/lib/yamlGroupEditor';
import { getBuiltinYamlGroups } from '@/lib/yamlGroupEditor/builtin';
import { dump as dumpYAML } from 'js-yaml';
import { getAvailableIcons, getIconByName } from '@/lib/yamlGroupEditor/iconMapping';
import DirectiveComponent from '@/components/directives/factory';
import AddDirectiveSection from '@/components/ui/AddDirectiveSection';
import type { Directive } from '@/components/common';
import { TagEditor } from '@/components/ui';

// Lightweight panel version of the YAML Group Editor (no modal). Uses full height of container.
export default function YamlGroupEditorPanel() {
  const { isDark } = useTheme();
  const [groups, setGroups] = useState<StoredYamlGroup[]>([]);
  const [builtin, setBuiltin] = useState<{ filename: string; yaml: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [yamlText, setYamlText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [argValues, setArgValues] = useState<Record<string, unknown>>({});
  const [showLibrary, setShowLibrary] = useState(true);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const libraryRef = useRef<HTMLDivElement | null>(null);
  const [libraryHeight, setLibraryHeight] = useState(0);
  const [librarySearch, setLibrarySearch] = useState('');
  const [fullScreen, setFullScreen] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement | null>(null);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const iconButtonRef = useRef<HTMLButtonElement | null>(null);
  const colorButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    try {
      const loaded = loadStoredYamlGroups();
      setGroups(loaded);
      setBuiltin(getBuiltinYamlGroups());
      if (loaded.length > 0) {
        setActiveId(loaded[0].id);
        setYamlText(loaded[0].yaml);
      } else {
        setActiveId(null);
        setYamlText(`metadata:\n  key: customGroup\n  label: Custom Group\n  description: ''\n  icon: CodeBracket\n  color: green\n  helpContent: ''\n  keywords: []\n\narguments: []\n\ndirectives:\n  - variables:\n      example: value\n`);
      }
      setError(null);
      setInfo(null);
    } catch (e) {
      setError(`Failed to load stored groups: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (showLibrary && libraryRef.current) {
        setLibraryHeight(libraryRef.current.getBoundingClientRect().height);
      } else {
        setLibraryHeight(0);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [showLibrary]);

  // Close pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (iconPickerOpen) {
        if (!iconPickerRef.current?.contains(target) && !iconButtonRef.current?.contains(target)) {
          setIconPickerOpen(false);
        }
      }
      if (colorPickerOpen) {
        if (!colorPickerRef.current?.contains(target) && !colorButtonRef.current?.contains(target)) {
          setColorPickerOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [iconPickerOpen, colorPickerOpen]);

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

  useEffect(() => {
    if (!parsed) {
      setArgValues({});
      return;
    }
    const next: Record<string, unknown> = {};
    for (const arg of parsed.arguments) {
      if (argValues.hasOwnProperty(arg.name)) {
        next[arg.name] = argValues[arg.name];
      } else if ('defaultValue' in arg && arg.defaultValue !== undefined) {
        next[arg.name] = arg.defaultValue as unknown;
      } else {
        switch (arg.type) {
          case 'boolean': next[arg.name] = false; break;
          case 'array': next[arg.name] = []; break;
          default: next[arg.name] = '';
        }
      }
    }
    setArgValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed?.arguments?.map(a=>a.name+'|'+a.type).join(',')]);

  const directivesPreview = useMemo(() => {
    try {
      if (!parsed) return [] as unknown[];
      return processYamlGroup(parsed, argValues);
    } catch {
      return [];
    }
  }, [parsed, argValues]);

  const mutateGroup = (mutator: (g: Record<string, unknown>) => void) => {
    if (!parsed) return;
    const next = JSON.parse(JSON.stringify(parsed));
    mutator(next);
    setYamlText(dumpYAML(next));
    setInfo(null);
  };

  const renderMetadataEditor = () => {
    if (!parsed) return null;
    const m = parsed.metadata as unknown as Record<string, unknown>;
    const inputCls = cn('w-full text-sm rounded-md border px-2 py-1', isDark ? 'bg-[#0b0e0b] border-[#2d4222]/50 text-[#e8f5d0]' : 'border-gray-300');
    const labelCls = cn('text-xs block mb-1', isDark ? 'text-gray-300' : 'text-gray-700');
    const iconOptions = getAvailableIcons();
    const colorOptions = ['orange','blue','green','gray','red','yellow','purple','pink','indigo','teal'] as const;
    const colorPreview: Record<(typeof colorOptions)[number], { bgLight:string; bgDark:string; textLight:string; textDark:string; borderLight:string; borderDark:string; }> = {
      orange: { bgLight:'bg-orange-50', bgDark:'bg-orange-900', textLight:'text-orange-600', textDark:'text-orange-400', borderLight:'border-orange-200', borderDark:'border-orange-700' },
      blue: { bgLight:'bg-blue-50', bgDark:'bg-blue-900', textLight:'text-blue-600', textDark:'text-blue-400', borderLight:'border-blue-200', borderDark:'border-blue-700' },
      green: { bgLight:'bg-green-50', bgDark:'bg-green-900', textLight:'text-green-600', textDark:'text-green-400', borderLight:'border-green-200', borderDark:'border-green-700' },
      gray: { bgLight:'bg-gray-50', bgDark:'bg-gray-900', textLight:'text-gray-600', textDark:'text-gray-400', borderLight:'border-gray-200', borderDark:'border-gray-700' },
      red: { bgLight:'bg-red-50', bgDark:'bg-red-900', textLight:'text-red-600', textDark:'text-red-400', borderLight:'border-red-200', borderDark:'border-red-700' },
      yellow: { bgLight:'bg-yellow-50', bgDark:'bg-yellow-900', textLight:'text-yellow-600', textDark:'text-yellow-400', borderLight:'border-yellow-200', borderDark:'border-yellow-700' },
      purple: { bgLight:'bg-purple-50', bgDark:'bg-purple-900', textLight:'text-purple-600', textDark:'text-purple-400', borderLight:'border-purple-200', borderDark:'border-purple-700' },
      pink: { bgLight:'bg-pink-50', bgDark:'bg-pink-900', textLight:'text-pink-600', textDark:'text-pink-400', borderLight:'border-pink-200', borderDark:'border-pink-700' },
      indigo: { bgLight:'bg-indigo-50', bgDark:'bg-indigo-900', textLight:'text-indigo-600', textDark:'text-indigo-400', borderLight:'border-indigo-200', borderDark:'border-indigo-700' },
      teal: { bgLight:'bg-teal-50', bgDark:'bg-teal-900', textLight:'text-teal-600', textDark:'text-teal-400', borderLight:'border-teal-200', borderDark:'border-teal-700' },
    };
    const Icon = m.icon ? getIconByName(m.icon as string) : null;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>key</label>
            <input className={inputCls} value={(m.key as string) ?? ''} onChange={(e)=> mutateGroup(g=>{ (g.metadata as Record<string, unknown>).key = e.target.value; })} />
          </div>
          <div>
            <label className={labelCls}>label</label>
            <input className={inputCls} value={(m.label as string) ?? ''} onChange={(e)=> mutateGroup(g=>{ (g.metadata as Record<string, unknown>).label = e.target.value; })} />
          </div>
          <div className="relative">
            <label className={labelCls}>icon</label>
            <button ref={iconButtonRef} type="button" className={cn(inputCls, 'flex items-center justify-between')} onClick={() => { setIconPickerOpen(v => !v); setColorPickerOpen(false); }}>
              <span className="flex items-center gap-2 truncate">{Icon ? <Icon className="h-5 w-5"/> : null}<span className="truncate">{(m.icon as string) ?? 'Select icon'}</span></span>
              <span className={cn('text-xs', isDark? 'text-gray-400':'text-gray-500')}>▼</span>
            </button>
            {iconPickerOpen && (
              <div ref={iconPickerRef} className={cn('absolute z-20 mt-1 w-72 max-h-80 rounded-md border shadow-lg', isDark? 'bg-[#0b0e0b] border-[#2d4222]/50':'bg-white border-gray-200')}>
                <div className="p-2 border-b">
                  <input
                    value={iconSearch}
                    onChange={(e)=>setIconSearch(e.target.value)}
                    placeholder="Search icons..."
                    className={cn('w-full text-xs rounded-md border px-2 py-1', isDark ? 'bg-[#0b0e0b] border-[#2d4222]/50 text-[#e8f5d0]' : 'border-gray-300')}
                  />
                </div>
                <div className="p-2 grid grid-cols-3 gap-2 overflow-auto max-h-64">
                  {iconOptions.filter(i => i.toLowerCase().includes(iconSearch.toLowerCase())).map((icon) => {
                    const Ico = getIconByName(icon);
                    return (
                      <button key={icon} type="button" className={cn('flex items-center gap-2 px-2 py-1.5 rounded hover:bg-black/5', isDark? 'hover:bg-white/5':'hover:bg-black/5')} onClick={() => { mutateGroup(g=>{ (g.metadata as Record<string, unknown>).icon = icon; }); setIconPickerOpen(false); }} title={icon}>
                        <Ico className="h-5 w-5"/>
                        <span className="truncate text-sm">{icon}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <label className={labelCls}>color</label>
            <button ref={colorButtonRef} type="button" className={cn(inputCls, 'flex items-center gap-2')} onClick={() => { setColorPickerOpen(v => !v); setIconPickerOpen(false); }}>
              <span className={cn('h-4 w-4 rounded-full border', isDark ? colorPreview[m.color as keyof typeof colorPreview]?.borderDark : colorPreview[m.color as keyof typeof colorPreview]?.borderLight, isDark ? colorPreview[m.color as keyof typeof colorPreview]?.bgDark : colorPreview[m.color as keyof typeof colorPreview]?.bgLight)} />
              <span className="text-sm">{(m.color as string) ?? 'Select color'}</span>
            </button>
            {colorPickerOpen && (
              <div ref={colorPickerRef} className={cn('absolute z-20 mt-1 w-56 rounded-md border shadow-lg p-2', isDark? 'bg-[#0b0e0b] border-[#2d4222]/50':'bg-white border-gray-200')}>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((c) => (
                    <button key={c} type="button" className={cn('h-8 rounded-md border', isDark? colorPreview[c].borderDark : colorPreview[c].borderLight, isDark? colorPreview[c].bgDark : colorPreview[c].bgLight)} onClick={() => { mutateGroup(g=>{ (g.metadata as Record<string, unknown>).color = c; }); setColorPickerOpen(false); }} title={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className={cn('px-2 py-1 rounded border text-xs', isDark ? `${colorPreview[m.color as keyof typeof colorPreview]?.bgDark} ${colorPreview[m.color as keyof typeof colorPreview]?.borderDark}` : `${colorPreview[m.color as keyof typeof colorPreview]?.bgLight} ${colorPreview[m.color as keyof typeof colorPreview]?.borderLight}`)}>Color preview</div>
              {Icon && (<Icon className={cn('h-5 w-5', isDark ? colorPreview[m.color as keyof typeof colorPreview]?.textDark : colorPreview[m.color as keyof typeof colorPreview]?.textLight)} />)}
            </div>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>description</label>
            <input className={inputCls} value={(m.description as string) ?? ''} onChange={(e)=> mutateGroup(g=>{ (g.metadata as Record<string, unknown>).description = e.target.value; })} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>keywords</label>
            <TagEditor tags={(m.keywords ?? []) as string[]} onChange={(tags)=> mutateGroup(g=> { (g.metadata as Record<string, unknown>).keywords = tags; })} placeholder="Add keyword..." emptyMessage="No keywords yet" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>helpContent (Markdown)</label>
            <textarea rows={6} className={inputCls} value={(m.helpContent as string) ?? ''} onChange={(e)=> mutateGroup(g=>{ (g.metadata as Record<string, unknown>).helpContent = e.target.value; })} />
          </div>
        </div>
      </div>
    );
  };

  const renderArgumentsEditor = () => {
    if (!parsed) return null;
    const args = parsed.arguments || [];
    const labelCls = cn('text-xs block mb-1', isDark ? 'text-gray-300' : 'text-gray-700');
    const inputCls = cn('w-full text-sm rounded-md border px-2 py-1', isDark ? 'bg-[#0b0e0b] border-[#2d4222]/50 text-[#e8f5d0]' : 'border-gray-300');
    
    return (
      <div className="space-y-3">
        <div className={cn('text-sm font-medium', isDark? 'text-gray-200':'text-gray-800')}>Arguments</div>
        {args.length === 0 ? (
          <div className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>No arguments defined</div>
        ) : (
          <div className="space-y-3">
            {args.map((arg, idx) => (
              <div key={idx} className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>name</label>
                    <input className={inputCls} value={arg.name || ''} onChange={(e) => mutateGroup(g => { (g.arguments as unknown[])[idx] = {...arg, name: e.target.value}; })} />
                  </div>
                  <div>
                    <label className={labelCls}>type</label>
                    <select className={inputCls} value={arg.type || 'text'} onChange={(e) => mutateGroup(g => { (g.arguments as unknown[])[idx] = {...arg, type: e.target.value}; })}>
                      <option value="text">text</option>
                      <option value="boolean">boolean</option>
                      <option value="array">array</option>
                      <option value="dropdown">dropdown</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>description</label>
                  <input className={inputCls} value={arg.description || ''} onChange={(e) => mutateGroup(g => { (g.arguments as unknown[])[idx] = {...arg, description: e.target.value}; })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDirectivesEditor = () => {
    if (!parsed) return null;
    const list = parsed.directives as Directive[];
    const onChangeDirective = (idx: number, dir: Directive) => mutateGroup(g => { (g.directives as Directive[])[idx] = dir; });
    const move = (idx:number, dir:-1|1)=> mutateGroup(g=>{ const a=g.directives as Directive[]; const j=idx+dir; if(j<0||j>=a.length)return; [a[idx],a[j]]=[a[j],a[idx]];});
    const remove = (idx:number)=> mutateGroup(g=>{ (g.directives as Directive[]).splice(idx,1); });
    const addDirective = (d: Directive, index?: number) => mutateGroup(g=>{ const directives = g.directives as Directive[]; if(index!==undefined){ directives.splice(index,0,d);} else { directives.push(d);} });
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className={cn('text-sm font-medium', isDark? 'text-gray-200':'text-gray-800')}>Directives</div>
        </div>
        <div className="space-y-3">
          {list.map((d, idx)=> (
            <DirectiveComponent
              key={idx}
              directive={d}
              baseImage=""
              onChange={(dir)=> onChangeDirective(idx, dir)}
              controllers={{
                onMoveUp: () => move(idx,-1),
                onMoveDown: () => move(idx,1),
                onDelete: () => remove(idx),
                canMoveUp: idx>0,
                canMoveDown: idx<list.length-1,
                stepNumber: idx+1,
              }}
              documentationMode={false}
            />
          ))}
          <AddDirectiveSection onAddDirective={(d, index)=> addDirective(d, index)} variant="inline" />
        </div>
      </div>
    );
  };

  const onNew = () => {
    setActiveId(null);
    setYamlText(`metadata:\n  key: customGroup\n  label: Custom Group\n  description: ''\n  icon: CodeBracket\n  color: green\n  helpContent: ''\n  keywords: []\n\narguments: []\n\ndirectives:\n  - variables:\n      example: value\n`);
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
      // Register immediately so it shows up without reload
      void registerYamlGroup(yamlText);
      setInfo('Saved, enabled, and registered immediately.');
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
    // If enabling, register now so it becomes available immediately
    const justEnabled = updated.find(g => g.id === id && g.enabled);
    if (justEnabled) {
      try { void registerYamlGroup(justEnabled.yaml); } catch { /* noop */ }
    }
  };

  return (
    <div className={cn(fullScreen ? 'fixed inset-0 z-[120]' : 'relative', 'flex flex-col h-screen')}>
      <div className={cn('flex items-center justify-between px-5 py-2 border-b', isDark ? 'border-[#2d4222]/50' : 'border-gray-200/60')}>
        <div className="flex items-center gap-2">
          <h2 className={cn('text-lg font-semibold', isDark ? 'text-[#e8f5d0]' : 'text-gray-900')}>Custom Group Editor</h2>
        </div>
        <button
          onClick={() => setFullScreen(v => !v)}
          className={cn('px-2 py-1 rounded-md text-xs', isDark? 'bg-[#1e2a16] text-[#c4e382]':'bg-green-50 text-green-700 hover:bg-green-100')}
        >
          {fullScreen ? <><ArrowsPointingInIcon className="h-4 w-4 inline"/> Exit Full Screen</> : <><ArrowsPointingOutIcon className="h-4 w-4 inline"/> Full Screen</>}
        </button>
      </div>

      <div className="relative flex-1">
        {showLibrary && (
          <div ref={libraryRef} className={cn('absolute inset-x-0 top-0 z-10 border-b backdrop-blur-md', isDark? 'bg-black/40 border-[#2d4222]/50':'bg-white/70 border-gray-200/60')}>
            <div className="p-3 flex items-center justify-between">
              <div className="flex-1 flex items-center gap-3">
                <div className={textStyles(isDark, { size: 'sm', weight: 'medium', color: 'primary' })}>Library</div>
                <div className="relative max-w-xs w-full">
                  <input
                    value={librarySearch}
                    onChange={(e)=>setLibrarySearch(e.target.value)}
                    placeholder="Search groups..."
                    className={cn('w-full text-xs rounded-md border pl-8 pr-2 py-1.5', isDark ? 'bg-[#0b0e0b] border-[#2d4222]/50 text-[#e8f5d0]' : 'border-gray-300')}
                  />
                  <svg className={cn('absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5', isDark?'text-gray-400':'text-gray-500')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className={buttonStyles(isDark, 'primary', 'sm')} onClick={onNew}><PlusIcon className="h-4 w-4 inline"/> New</button>
                <button className={buttonStyles(isDark, 'secondary', 'sm')} onClick={onSave} title="Save & Enable">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
                <button className={buttonStyles(isDark, 'secondary', 'sm')} onClick={() => {
                  try {
                    const json = exportStoredYamlGroups();
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'yaml-groups.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                  } catch (e) { console.error('Failed to export groups', e); }
                }} title="Export all">
                  <ArrowUpTrayIcon className="h-4 w-4 rotate-180" />
                </button>
                <label className={cn(buttonStyles(isDark, 'secondary', 'sm'), 'cursor-pointer')} title="Import">
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) {
                    const reader = new FileReader();
                    reader.onload = () => { try { const text = String(reader.result||''); const updated = importStoredYamlGroups(text); setGroups(updated);
                      // Register all enabled groups immediately
                      try { updated.filter(g=>g.enabled).forEach(g=>{ void registerYamlGroup(g.yaml); }); } catch {}
                      setInfo('Imported and registered enabled YAML groups.'); setError(null);} catch (e) { setError(e instanceof Error ? e.message : String(e)); } }; reader.readAsText(f);
                  } e.currentTarget.value=''; }} />
                </label>
                <button className={buttonStyles(isDark, 'ghost', 'sm')} onClick={()=> setShowLibrary(false)}>Hide</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-3 max-h-64 overflow-auto">
              <div>
                <div className={cn('px-2 py-1 text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>Built-in</div>
                <div className="space-y-1">
                  {builtin
                    .filter(b => {
                      if (!librarySearch.trim()) return true;
                      try { const k = parseYamlGroup(b.yaml).metadata.key.toLowerCase(); return k.includes(librarySearch.toLowerCase()); } catch { return b.filename.toLowerCase().includes(librarySearch.toLowerCase()); }
                    })
                    .sort((a,b)=>{
                      const ka = (()=>{ try { return parseYamlGroup(a.yaml).metadata.key as string; } catch { return a.filename; }})();
                      const kb = (()=>{ try { return parseYamlGroup(b.yaml).metadata.key as string; } catch { return b.filename; }})();
                      return ka.localeCompare(kb);
                    })
                    .map(b => {
                    let key = '';
                    try { key = parseYamlGroup(b.yaml).metadata.key; } catch { key = b.filename; }
                    return (
                      <div key={b.filename} className={cn('flex items-center justify-between px-2 py-2 rounded-md')}>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{key}</span>
                          <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{b.filename}</span>
                        </div>
                        <button className={cn('px-2 py-1 rounded-md text-xs', isDark ? 'bg-[#1e2a16] text-[#c4e382]' : 'bg-green-50 text-green-700 hover:bg-green-100')} onClick={() => { setYamlText(b.yaml); setActiveId(null); setShowLibrary(false); }} title="Edit a copy">Duplicate</button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className={cn('px-2 py-1 text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>My Groups</div>
                <div className="space-y-1">
                  {groups
                    .slice()
                    .sort((a,b)=> b.updatedAt - a.updatedAt)
                    .filter(g => !librarySearch.trim() || g.key.toLowerCase().includes(librarySearch.toLowerCase()))
                    .map(g => (
                    <div key={g.id} className={cn('flex items-center justify-between px-2 py-2 rounded-md cursor-pointer', activeId === g.id ? (isDark ? 'bg-[#1e2a16]' : 'bg-gray-100') : '')} onClick={() => { setActiveId(g.id); setYamlText(g.yaml); setShowLibrary(false); }}>
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
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex flex-col" style={{ paddingTop: showLibrary ? libraryHeight : 0 }}>
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
            <div className="overflow-auto p-5 space-y-6">
              <div className={cn('rounded-md border', isDark? 'border-[#2d4222]/50':'border-gray-200')}>
                <div className={cn('text-sm font-medium px-4 pt-3', isDark? 'text-gray-200':'text-gray-800')}>Metadata</div>
                <div className="p-4">{renderMetadataEditor()}</div>
              </div>
              <div className={cn('rounded-md border p-4', isDark? 'border-[#2d4222]/50':'border-gray-200')}>
                {renderArgumentsEditor()}
              </div>
              <div className={cn('rounded-md border p-4', isDark? 'border-[#2d4222]/50':'border-gray-200')}>
                <div className={cn('text-sm font-medium mb-2', isDark? 'text-gray-200':'text-gray-800')}>Directives (YAML)</div>
                <pre className={cn('text-xs p-3 rounded-md overflow-auto', isDark ? 'bg-[#0b0e0b] text-[#e8f5d0] border border-[#2d4222]/40' : 'bg-gray-50')}>
{dumpYAML(directivesPreview).trim()}
                </pre>
              </div>
              <div className={cn('rounded-md border p-4', isDark? 'border-[#2d4222]/50':'border-gray-200')}>
                {renderDirectivesEditor()}
              </div>
            </div>
            <div className="overflow-auto p-5 space-y-4 border-l" style={{borderColor: isDark? '#2d422280':'#e5e7eb'}}>
              <div>
                <div className={cn('text-sm font-medium mb-2', isDark? 'text-gray-200':'text-gray-800')}>Parameters</div>
                <div className="grid grid-cols-2 gap-3 mb-6">
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
                              {(arg.options ?? []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        );
                      case 'boolean':
                        return (
                          <div key={arg.name}>
                            <label className={labelCls}>{arg.name}</label>
                            <div className="h-[34px] flex items-center">
                              <input type="checkbox" checked={Boolean(val)} onChange={(e)=>update(e.target.checked)} />
                            </div>
                          </div>
                        );
                      case 'array':
                        return (
                          <div key={arg.name} className="col-span-2">
                            <label className={labelCls}>{arg.name}</label>
                            <input className={inputCls} placeholder="a, b, c" value={Array.isArray(val) ? (val as string[]).join(', ') : ''} onChange={(e)=>update(e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean))} />
                          </div>
                        );
                      case 'text':
                      default:
                        if ('multiline' in arg && arg.multiline) {
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
                <div className={cn('text-sm font-medium mb-2', isDark? 'text-gray-200':'text-gray-800')}>Rendered</div>
                <div className="space-y-3 pointer-events-none">
                  {(directivesPreview as Directive[]).map((d, i)=> (
                    <DirectiveComponent key={i} directive={d} baseImage="" onChange={()=>{}} controllers={{}} documentationMode={false} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
