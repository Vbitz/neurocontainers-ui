"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, CheckCircleIcon, ExclamationCircleIcon, ListBulletIcon, PencilSquareIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/styles';
import { useTheme } from '@/lib/ThemeContext';
import { loadStoredYamlGroups, saveStoredYamlGroups, upsertStoredYamlGroup, removeStoredYamlGroup, exportStoredYamlGroups, importStoredYamlGroups, StoredYamlGroup } from '@/lib/yamlGroupEditor/localStorage';
import { parseYamlGroup } from '@/lib/yamlGroupEditor/loader';
import processYamlGroup from '@/lib/yamlGroupEditor';
import { getBuiltinYamlGroups } from '@/lib/yamlGroupEditor/builtin';
import { dump as dumpYAML } from 'js-yaml';
import { getAvailableIcons, getIconByName } from '@/lib/yamlGroupEditor/iconMapping';
import DirectiveComponent from '@/components/directives/factory';
import AddDirectiveSection from '@/components/ui/AddDirectiveSection';
import type { Directive } from '@/components/common';
import { TagEditor } from '@/components/ui';

export default function YamlGroupEditorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isDark } = useTheme();
  const [groups, setGroups] = useState<StoredYamlGroup[]>([]);
  const [builtin, setBuiltin] = useState<{ filename: string; yaml: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [yamlText, setYamlText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [argValues, setArgValues] = useState<Record<string, unknown>>({});
  const [showLibrary, setShowLibrary] = useState(false);
  // UI state for custom pickers
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  // Measure library overlay height to avoid overlapping content
  const libraryRef = useRef<HTMLDivElement | null>(null);
  const [libraryHeight, setLibraryHeight] = useState(0);
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
        setYamlText(`metadata:\n  key: customGroup\n  label: Custom Group\n  description: ''\n  icon: CodeBracket\n  color: green\n  helpContent: ''\n  keywords: []\n\narguments: []\n\ndirectives:\n  - variables:\n      example: value\n`);
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
    // Merge existing values with new argument definitions; drop removed args
    const next: Record<string, unknown> = {};
    for (const arg of parsed.arguments) {
      if (argValues.hasOwnProperty(arg.name)) {
        next[arg.name] = argValues[arg.name];
      } else if (arg.defaultValue !== undefined) {
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

  // Helper: mutate current parsed group and sync YAML text
  const mutateGroup = (mutator: (g: Record<string, unknown>) => void) => {
    if (!parsed) return;
    const next = JSON.parse(JSON.stringify(parsed));
    mutator(next);
    setYamlText(dumpYAML(next));
    setInfo(null);
  };

  // Render helpers for Visual tab
  const renderMetadataEditor = () => {
    if (!parsed) return null;
    const m = parsed.metadata as Record<string, unknown>;
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
    const Icon = m.icon ? getIconByName(m.icon) : null;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>key</label>
            <input className={inputCls} value={m.key ?? ''} onChange={(e)=> mutateGroup(g=>{ g.metadata.key = e.target.value; })} />
          </div>
          <div>
            <label className={labelCls}>label</label>
            <input className={inputCls} value={m.label ?? ''} onChange={(e)=> mutateGroup(g=>{ g.metadata.label = e.target.value; })} />
          </div>
          {/* Icon picker */}
          <div className="relative">
            <label className={labelCls}>icon</label>
            <button
              type="button"
              className={cn(inputCls, 'flex items-center justify-between')}
              onClick={() => { setIconPickerOpen(v => !v); setColorPickerOpen(false); }}
            >
              <span className="flex items-center gap-2 truncate">
                {Icon ? <Icon className="h-5 w-5"/> : null}
                <span className="truncate">{m.icon ?? 'Select icon'}</span>
              </span>
              <span className={cn('text-xs', isDark? 'text-gray-400':'text-gray-500')}>▼</span>
            </button>
            {iconPickerOpen && (
              <div className={cn('absolute z-20 mt-1 w-72 max-h-72 overflow-auto rounded-md border shadow-lg', isDark? 'bg-[#0b0e0b] border-[#2d4222]/50':'bg-white border-gray-200')}>
                <div className="p-2 grid grid-cols-3 gap-2">
                  {iconOptions.map((icon) => {
                    const Ico = getIconByName(icon);
                    return (
                      <button
                        key={icon}
                        type="button"
                        className={cn('flex items-center gap-2 px-2 py-1.5 rounded hover:bg-black/5', isDark? 'hover:bg-white/5':'hover:bg-black/5')}
                        onClick={() => { mutateGroup(g=>{ g.metadata.icon = icon; }); setIconPickerOpen(false); }}
                        title={icon}
                      >
                        <Ico className="h-5 w-5"/>
                        <span className="truncate text-sm">{icon}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {/* Color picker */}
          <div className="relative">
            <label className={labelCls}>color</label>
            <button
              type="button"
              className={cn(inputCls, 'flex items-center gap-2')}
              onClick={() => { setColorPickerOpen(v => !v); setIconPickerOpen(false); }}
            >
              <span className={cn('h-4 w-4 rounded-full border',
                isDark ? colorPreview[m.color as keyof typeof colorPreview]?.borderDark : colorPreview[m.color as keyof typeof colorPreview]?.borderLight,
                isDark ? colorPreview[m.color as keyof typeof colorPreview]?.bgDark : colorPreview[m.color as keyof typeof colorPreview]?.bgLight
              )} />
              <span className="text-sm">{m.color ?? 'Select color'}</span>
            </button>
            {colorPickerOpen && (
              <div className={cn('absolute z-20 mt-1 w-56 rounded-md border shadow-lg p-2', isDark? 'bg-[#0b0e0b] border-[#2d4222]/50':'bg-white border-gray-200')}>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={cn('h-8 rounded-md border', isDark? colorPreview[c].borderDark : colorPreview[c].borderLight, isDark? colorPreview[c].bgDark : colorPreview[c].bgLight)}
                      onClick={() => { mutateGroup(g=>{ g.metadata.color = c; }); setColorPickerOpen(false); }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className={cn('px-2 py-1 rounded border text-xs', isDark ? `${colorPreview[m.color as keyof typeof colorPreview]?.bgDark} ${colorPreview[m.color as keyof typeof colorPreview]?.borderDark}` : `${colorPreview[m.color as keyof typeof colorPreview]?.bgLight} ${colorPreview[m.color as keyof typeof colorPreview]?.borderLight}`)}>
                Color preview
              </div>
              {Icon && (
                <Icon className={cn('h-5 w-5', isDark ? colorPreview[m.color as keyof typeof colorPreview]?.textDark : colorPreview[m.color as keyof typeof colorPreview]?.textLight)} />
              )}
            </div>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>description</label>
            <input className={inputCls} value={m.description ?? ''} onChange={(e)=> mutateGroup(g=>{ g.metadata.description = e.target.value; })} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>keywords</label>
            <TagEditor
              tags={(m.keywords ?? []) as string[]}
              onChange={(tags)=> mutateGroup(g=> { g.metadata.keywords = tags; })}
              placeholder="Add keyword..."
              emptyMessage="No keywords yet"
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>helpContent (Markdown)</label>
            <textarea rows={6} className={inputCls} value={m.helpContent ?? ''} onChange={(e)=> mutateGroup(g=>{ g.metadata.helpContent = e.target.value; })} />
          </div>
        </div>
      </div>
    );
  };

  const renderArgumentsEditor = () => {
    if (!parsed) return null;
    const inputCls = cn('w-full text-sm rounded-md border px-3 py-2', isDark ? 'bg-[#0b0e0b] border-[#2d4222]/50 text-[#e8f5d0]' : 'border-gray-300');
    const labelCls = cn('text-xs font-medium block mb-1', isDark ? 'text-gray-300' : 'text-gray-700');
    const btnCls = cn('px-2 py-1 rounded-md text-xs', isDark ? 'bg-[#1e2a16] text-[#c4e382]' : 'bg-green-50 text-green-700 hover:bg-green-100');
    const args = parsed.arguments as Record<string, unknown>[];
    const updateArg = (idx: number, patch: Record<string, unknown>) => mutateGroup(g=>{ (g.arguments as Record<string, unknown>[])[idx] = { ...(g.arguments as Record<string, unknown>[])[idx], ...patch }; });
    const removeArg = (idx: number) => mutateGroup(g=>{ g.arguments.splice(idx,1); });
    const addArg = () => mutateGroup(g=>{ g.arguments.push({ name: 'newArg', type: 'text', required: false, defaultValue: '', description: '' }); });
    const moveArg = (idx:number, dir:-1|1)=> mutateGroup(g=>{ const a=g.arguments; const j=idx+dir; if(j<0||j>=a.length)return; [a[idx],a[j]]=[a[j],a[idx]];});
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className={cn('text-sm font-medium', isDark? 'text-gray-200':'text-gray-800')}>Arguments</div>
          <button className={btnCls} onClick={addArg}><PlusIcon className="h-4 w-4 inline mr-1"/> Add Argument</button>
        </div>
        <div className="space-y-4">
          {args.map((arg, idx) => (
            <div key={idx} className={cn('p-4 rounded-lg border', isDark? 'border-[#2d4222]/50 bg-[#0b0e0b]/50':'border-gray-200 bg-gray-50/50')}>
              {/* Row 1: Name, Type, Required */}
              <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-3">
                  <label className={labelCls}>name</label>
                  <input className={inputCls} value={arg.name ?? ''} onChange={(e)=>updateArg(idx,{name:e.target.value})} placeholder="argumentName" />
                </div>
                <div className="col-span-3">
                  <label className={labelCls}>type</label>
                  <select className={inputCls} value={arg.type ?? 'text'} onChange={(e)=>updateArg(idx,{type:e.target.value})}>
                    <option value="text">text</option>
                    <option value="dropdown">dropdown</option>
                    <option value="array">array</option>
                    <option value="boolean">boolean</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>required</label>
                  <div className="h-[42px] flex items-center">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4"
                      checked={Boolean(arg.required)} 
                      onChange={(e)=>updateArg(idx,{required:e.target.checked})} 
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>advanced</label>
                  <div className="h-[42px] flex items-center">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4"
                      checked={Boolean(arg.advanced)} 
                      onChange={(e)=>updateArg(idx,{advanced:e.target.checked})} 
                    />
                  </div>
                </div>
                {arg.type === 'text' && (
                  <div className="col-span-2">
                    <label className={labelCls}>multiline</label>
                    <div className="h-[42px] flex items-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4"
                        checked={Boolean((arg as Record<string, unknown>).multiline)} 
                        onChange={(e)=>updateArg(idx,{multiline:e.target.checked})} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Description */}
              <div className="mb-4">
                <label className={labelCls}>description</label>
                <input className={inputCls} value={arg.description ?? ''} onChange={(e)=>updateArg(idx,{description:e.target.value})} placeholder="Describe what this argument does..." />
              </div>

              {/* Row 3: Type-specific fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {arg.type === 'dropdown' && (
                  <div>
                    <label className={labelCls}>options (comma-separated)</label>
                    <input 
                      className={inputCls} 
                      value={(arg.options ?? []).join(', ')} 
                      onChange={(e)=>updateArg(idx,{options:e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean)})} 
                      placeholder="option1, option2, option3"
                    />
                  </div>
                )}
                <div>
                  <label className={labelCls}>defaultValue</label>
                  {arg.type === 'boolean' ? (
                    <div className="h-[42px] flex items-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4"
                        checked={Boolean(arg.defaultValue)} 
                        onChange={(e)=>updateArg(idx,{defaultValue:e.target.checked})} 
                      />
                    </div>
                  ) : arg.type === 'array' ? (
                    <input 
                      className={inputCls} 
                      placeholder="item1, item2, item3" 
                      value={Array.isArray(arg.defaultValue) ? (arg.defaultValue as string[]).join(', ') : ''} 
                      onChange={(e)=>updateArg(idx,{defaultValue:e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean)})} 
                    />
                  ) : (
                    <input 
                      className={inputCls} 
                      value={String(arg.defaultValue ?? '')} 
                      onChange={(e)=>updateArg(idx,{defaultValue:e.target.value})} 
                      placeholder={arg.type === 'dropdown' ? 'Select default option...' : 'Enter default value...'}
                    />
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
                <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs',
                  arg.type==='text' ? (isDark? 'bg-white/5 text-gray-300':'bg-gray-100 text-gray-700') :
                  arg.type==='dropdown' ? (isDark? 'bg-blue-900/30 text-blue-300':'bg-blue-50 text-blue-700') :
                  arg.type==='array' ? (isDark? 'bg-purple-900/30 text-purple-300':'bg-purple-50 text-purple-700') :
                  (isDark? 'bg-green-900/30 text-green-300':'bg-green-50 text-green-700')
                )}>
                  {arg.type==='text' && <PencilSquareIcon className="h-3 w-3"/>}
                  {arg.type==='dropdown' && <ListBulletIcon className="h-3 w-3"/>}
                  {arg.type==='array' && <Squares2X2Icon className="h-3 w-3"/>}
                  {arg.type==='boolean' && <CheckCircleIcon className="h-3 w-3"/>}
                  <span className="uppercase tracking-wide font-medium">{arg.type}</span>
                </div>
                <div className="flex gap-2">
                  <button className={btnCls} onClick={()=>moveArg(idx,-1)} disabled={idx === 0}>Up</button>
                  <button className={btnCls} onClick={()=>moveArg(idx,1)} disabled={idx === args.length - 1}>Down</button>
                  <button className={cn(btnCls, isDark? 'bg-red-900/30 text-red-300 hover:bg-red-900/50':'bg-red-50 text-red-700 hover:bg-red-100')} onClick={()=>removeArg(idx)}>
                    <TrashIcon className="h-4 w-4 inline mr-1"/> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDirectivesEditor = () => {
    if (!parsed) return null;
    const list = parsed.directives as Directive[];
    const onChangeDirective = (idx: number, dir: Directive) => mutateGroup(g => { g.directives[idx] = dir; });
    const move = (idx:number, dir:-1|1)=> mutateGroup(g=>{ const a=g.directives; const j=idx+dir; if(j<0||j>=a.length)return; [a[idx],a[j]]=[a[j],a[idx]];});
    const remove = (idx:number)=> mutateGroup(g=>{ g.directives.splice(idx,1); });
    const addDirective = (d: Directive, index?: number) => mutateGroup(g=>{ if(index!==undefined){ g.directives.splice(index,0,d);} else { g.directives.push(d);} });
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
        'relative w-[98vw] max-w-7xl h-[94vh] rounded-xl overflow-hidden border shadow-xl',
        isDark ? 'bg-[#0f130f]/95 border-[#2d4222]/50' : 'bg-white/95 border-gray-200/60'
      )}>
        <div className={cn('flex items-center justify-between px-5 py-2 border-b', isDark ? 'border-[#2d4222]/50' : 'border-gray-200/60')}>
          <div className="flex items-center gap-2">
            <h2 className={cn('text-lg font-semibold', isDark ? 'text-[#e8f5d0]' : 'text-gray-900')}>Custom Group Editor (Beta)</h2>
            <button className={cn('px-2 py-1 rounded-md text-xs', isDark? 'bg-[#1e2a16] text-[#c4e382]':'bg-green-50 text-green-700 hover:bg-green-100')} onClick={()=> setShowLibrary(!showLibrary)}>
              {showLibrary ? 'Hide Library' : 'Show Library'}
            </button>
          </div>
          <button onClick={onClose} className={cn('p-2 rounded-lg', isDark ? 'hover:bg-[#1e2a16]' : 'hover:bg-gray-100')}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="relative h-[calc(94vh-44px)]">
          {showLibrary && (
            <div ref={libraryRef} className={cn('absolute inset-x-0 top-0 z-10 border-b backdrop-blur-md', isDark? 'bg-black/40 border-[#2d4222]/50':'bg-white/70 border-gray-200/60')}>
              <div className="p-3 flex items-center justify-between">
                <div className={cn('text-sm font-medium', isDark? 'text-gray-200':'text-gray-800')}>Library</div>
                <div className="flex items-center gap-2">
                  <button className={cn('px-3 py-1.5 rounded-md text-sm', isDark ? 'bg-[#1e2a16] text-[#c4e382]' : 'bg-green-50 text-green-700 hover:bg-green-100')} onClick={onNew}><PlusIcon className="h-4 w-4 inline"/> New</button>
                  <button className={cn('p-2 rounded-md', isDark ? 'hover:bg-[#1e2a16]' : 'hover:bg-gray-100')} onClick={onExportAll} title="Export all">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <label className={cn('p-2 rounded-md cursor-pointer', isDark ? 'hover:bg-[#1e2a16]' : 'hover:bg-gray-100')} title="Import">
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportAll(f); e.currentTarget.value=''; }} />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-3 max-h-64 overflow-auto">
                <div>
                  <div className={cn('px-2 py-1 text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>Built-in</div>
                  <div className="space-y-1">
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
                            onClick={() => { setYamlText(b.yaml); setActiveId(null); setShowLibrary(false); }}
                            title="Edit a copy"
                          >
                            Duplicate
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className={cn('px-2 py-1 text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>My Groups</div>
                  <div className="space-y-1">
                    {groups.map(g => (
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

          {/* Editor */}
          <div
            className={cn('absolute inset-0 top-[0px] flex flex-col')}
            style={{ paddingTop: showLibrary ? libraryHeight : 0 }}
          >
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
            <div className="flex-1 grid grid-cols-2 gap-0" style={{ height: `calc(100% - ${libraryHeight}px)` }}>
              <div className="overflow-y-auto p-5 space-y-6" style={{ paddingBottom: '4rem' }}>
                <div className={cn('rounded-md border', isDark? 'border-[#2d4222]/50':'border-gray-200')}>
                  <div className={cn('text-sm font-medium px-4 pt-3', isDark? 'text-gray-200':'text-gray-800')}>Metadata</div>
                  <div className="p-4">
                    {renderMetadataEditor()}
                  </div>
                </div>
                <div className={cn('rounded-md border p-4', isDark? 'border-[#2d4222]/50':'border-gray-200')}>
                  {renderArgumentsEditor()}
                </div>
                <div className={cn('rounded-md border p-4', isDark? 'border-[#2d4222]/50':'border-gray-200')}>
                  {renderDirectivesEditor()}
                </div>
              </div>
              <div className="overflow-y-auto p-5 space-y-4 border-l" style={{borderColor: isDark? '#2d422280':'#e5e7eb', paddingBottom: '4rem'}}>
                <div>
                  <div className={cn('text-sm font-medium mb-2', isDark? 'text-gray-200':'text-gray-800')}>Parameters</div>
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
                  <div className={cn('text-sm font-medium mb-2', isDark? 'text-gray-200':'text-gray-800')}>Directives (YAML)</div>
                  <pre className={cn('text-xs p-3 rounded-md overflow-auto', isDark ? 'bg-[#0b0e0b] text-[#e8f5d0] border border-[#2d4222]/40' : 'bg-gray-50')}>
{dumpYAML(directivesPreview).trim()}
                  </pre>
                </div>
                <div>
                  <div className={cn('text-sm font-medium mb-2', isDark? 'text-gray-200':'text-gray-800')}>Rendered</div>
                  <div className="space-y-3 pointer-events-none">
                    {(directivesPreview as Directive[]).map((d, i)=> (
                      <DirectiveComponent
                        key={i}
                        directive={d}
                        baseImage=""
                        onChange={()=>{}}
                        controllers={{}}
                        documentationMode={false}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
