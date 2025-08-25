// Auto-discover and register all YAML group files in this directory
// Note: This relies on Webpack's require.context which is available in Next.js webpack build.
import { registerYamlGroup } from "@/lib/yamlGroupEditor/loader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires
const req: any = (require as unknown as { context: (p: string, r: boolean, re: RegExp) => any }).context(
  './',
  false,
  /\.ya?ml$/
);

req.keys().forEach((key: string) => {
  const content = req(key) as string;
  try {
    registerYamlGroup(content);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to register YAML group from ${key}:`, err);
  }
});
