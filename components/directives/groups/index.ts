// Auto-discover and register all YAML group files in this directory
// Note: This relies on Webpack's require.context which is available in Next.js webpack build.
import { registerYamlGroup } from "@/lib/yamlGroupEditor/loader";

interface WebpackContext {
  (key: string): string;
  keys(): string[];
}

interface RequireWithContext {
  context: (path: string, recursive: boolean, regex: RegExp) => WebpackContext;
}

const req: WebpackContext = (require as unknown as RequireWithContext).context(
  './',
  false,
  /\.ya?ml$/
);

req.keys().forEach((key: string) => {
  const content = req(key) as string;
  try {
    registerYamlGroup(content);
  } catch (err) {
    console.error(`Failed to register YAML group from ${key}:`, err);
  }
});
