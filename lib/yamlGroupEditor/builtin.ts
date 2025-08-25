// Utilities to list built-in YAML group definitions bundled with the app

export interface BuiltinYamlGroup {
  filename: string;
  yaml: string;
}

// Webpack-only: require.context to load raw YAML from the groups directory
// Note: path is relative to this file: lib/yamlGroupEditor -> ../../components/directives/groups
interface WebpackContext {
  (key: string): string;
  keys(): string[];
}

interface RequireWithContext {
  context: (path: string, recursive: boolean, regex: RegExp) => WebpackContext;
}

const ctx: WebpackContext = (require as unknown as RequireWithContext).context(
  '../../components/directives/groups',
  false,
  /\.ya?ml$/
);

export function getBuiltinYamlGroups(): BuiltinYamlGroup[] {
  try {
    return ctx.keys().map((k: string) => ({ filename: k.replace(/^\.\//, ''), yaml: ctx(k) as string }));
  } catch (e) {
    console.error('Failed to enumerate built-in YAML groups', e);
    return [];
  }
}

