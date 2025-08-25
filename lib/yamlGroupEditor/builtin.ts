// Utilities to list built-in YAML group definitions bundled with the app

export interface BuiltinYamlGroup {
  filename: string;
  yaml: string;
}

// Webpack-only: require.context to load raw YAML from the groups directory
// Note: path is relative to this file: lib/yamlGroupEditor -> ../../components/directives/groups
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires
const ctx: any = (require as unknown as { context: (p: string, r: boolean, re: RegExp) => any }).context(
  '../../components/directives/groups',
  false,
  /\.ya?ml$/
);

export function getBuiltinYamlGroups(): BuiltinYamlGroup[] {
  try {
    return ctx.keys().map((k: string) => ({ filename: k.replace(/^\.\//, ''), yaml: ctx(k) as string }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to enumerate built-in YAML groups', e);
    return [];
  }
}

