export interface StoredYamlGroup {
  id: string;
  key: string; // metadata.key for quick reference
  yaml: string;
  enabled: boolean;
  updatedAt: number;
}

const STORAGE_KEY = 'neurocontainers.yamlGroups';

export function loadStoredYamlGroups(): StoredYamlGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as StoredYamlGroup[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveStoredYamlGroups(groups: StoredYamlGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function upsertStoredYamlGroup(group: Omit<StoredYamlGroup, 'id' | 'updatedAt'> & { id?: string }): StoredYamlGroup[] {
  const groups = loadStoredYamlGroups();
  const id = group.id ?? cryptoRandomId();
  const updated: StoredYamlGroup = { ...group, id, updatedAt: Date.now() } as StoredYamlGroup;
  const idx = groups.findIndex(g => g.id === id);
  if (idx >= 0) groups[idx] = updated; else groups.push(updated);
  saveStoredYamlGroups(groups);
  return groups;
}

export function removeStoredYamlGroup(id: string): StoredYamlGroup[] {
  const groups = loadStoredYamlGroups().filter(g => g.id !== id);
  saveStoredYamlGroups(groups);
  return groups;
}

export function exportStoredYamlGroups(): string {
  return JSON.stringify(loadStoredYamlGroups(), null, 2);
}

export function importStoredYamlGroups(json: string): StoredYamlGroup[] {
  const data = JSON.parse(json) as StoredYamlGroup[];
  if (!Array.isArray(data)) throw new Error('Invalid import format');
  saveStoredYamlGroups(data);
  return data;
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (crypto as any).randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2);
}
