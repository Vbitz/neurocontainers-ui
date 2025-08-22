/**
 * Template interpolation system for YAML group editors
 * Handles {{ local.variableName }} syntax
 */

export interface TemplateContext {
    [key: string]: unknown;
}

/**
 * Interpolates template strings with values from context
 * Supports syntax like {{ local.variableName }}
 */
export function interpolateTemplate(
    template: unknown,
    context: TemplateContext
): unknown {
    if (typeof template === 'string') {
        return interpolateString(template, context);
    }
    
    if (Array.isArray(template)) {
        return template.map(item => interpolateTemplate(item, context));
    }
    
    if (template && typeof template === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(template)) {
            result[key] = interpolateTemplate(value, context);
        }
        return result;
    }
    
    return template;
}

/**
 * Interpolates a single string template
 */
function interpolateString(template: string, context: TemplateContext): string {
    // Match {{ local.variableName }} patterns
    return template.replace(/\{\{\s*local\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (match, variableName) => {
        const value = context[variableName];
        
        if (value === undefined || value === null) {
            throw new Error(`Template variable 'local.${variableName}' is not defined in context`);
        }
        
        if (Array.isArray(value)) {
            // For arrays, join with spaces (common for package lists)
            return value.join(' ');
        }
        
        return String(value);
    });
}

/**
 * Merges template context with new variables
 */
export function mergeContext(
    baseContext: TemplateContext,
    newVariables: Record<string, unknown>
): TemplateContext {
    return {
        ...baseContext,
        ...newVariables
    };
}

/**
 * Creates initial context from user arguments
 */
export function createInitialContext(args: Record<string, unknown>): TemplateContext {
    return { ...args };
}