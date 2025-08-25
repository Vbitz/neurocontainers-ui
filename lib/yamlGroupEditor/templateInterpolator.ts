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
function interpolateString(template: string, context: TemplateContext): unknown {
    // If the whole string is a single {{ ... }} expression, return raw evaluated value
    const fullMatch = template.match(/^\s*\{\{\s*([\s\S]+?)\s*\}\}\s*$/);
    if (fullMatch) {
        const expr = fullMatch[1];
        return evaluate(expr, context);
    }

    // Otherwise, replace all {{ ... }} occurrences with stringified evaluation
    return template.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (_m, expr) => {
        const val = evaluate(expr, context);
        if (Array.isArray(val)) return val.join(' ');
        if (val === null || val === undefined) return '';
        return String(val);
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

// Internal: use the expression evaluator from conditionEvaluator
import { evaluateExpression } from './conditionEvaluator';

function evaluate(expr: string, context: TemplateContext): unknown {
    // The expression language exposes `local.*` as top-level names in our evaluator,
    // so we pass a flattened context for convenience
    return evaluateExpression(expr, context);
}
