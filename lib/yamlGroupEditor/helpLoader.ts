/**
 * Help content loader for YAML group editors
 * Dynamically loads markdown help content
 */

// Cache for loaded help content
const helpContentCache = new Map<string, string>();

/**
 * Load help content from a markdown file path
 */
export async function loadHelpContent(helpPath: string): Promise<string> {
    // Check cache first
    if (helpContentCache.has(helpPath)) {
        return helpContentCache.get(helpPath)!;
    }

    try {
        // Dynamically import the markdown file with specific extension
        // Only allow .md files to prevent webpack from trying to load other file types
        if (!helpPath.endsWith('.md')) {
            throw new Error('Only .md files are supported for help content');
        }
        
        const helpModule = await import(`../../${helpPath}`);
        const content = helpModule.default || '';
        
        // Cache the content
        helpContentCache.set(helpPath, content);
        
        return content;
    } catch (error) {
        console.error(`Failed to load help content from ${helpPath}:`, error);
        return `Help content not available for ${helpPath}`;
    }
}

/**
 * Synchronously get cached help content (for components that need immediate access)
 */
export function getCachedHelpContent(helpPath: string): string {
    return helpContentCache.get(helpPath) || '';
}

/**
 * Preload help content for multiple paths
 */
export async function preloadHelpContent(helpPaths: string[]): Promise<void> {
    await Promise.all(helpPaths.map(path => loadHelpContent(path)));
}