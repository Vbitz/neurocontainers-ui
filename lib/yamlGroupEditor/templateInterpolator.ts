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
    const trimmed = template.trim();

    // Find all placeholder matches
    const placeholderRegex = /\{\{\s*([\s\S]+?)\s*\}\}/g;
    const matches = Array.from(trimmed.matchAll(placeholderRegex));

    // If there's exactly one placeholder and it spans the whole trimmed string, evaluate raw
    if (matches.length === 1 && matches[0].index === 0 && matches[0][0].length === trimmed.length) {
        const expr = matches[0][1];
        try {
            // Only evaluate immediately when the expression references local.*
            if (!expressionReferencesLocal(expr)) {
                return template; // keep as-is for later resolution
            }
            return evaluate(expr, context);
        } catch (e) {
            // Defer unknown function/object expressions by preserving the placeholder
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes('Unknown function/filter') || msg.includes('Unknown object')) {
                return template; // keep as-is for later resolution
            }
            throw e;
        }
    }

    // Otherwise, replace all placeholders with stringified evaluation
    return template.replace(placeholderRegex, (m, expr) => {
        try {
            // Only evaluate immediately when the expression references local.*
            if (!expressionReferencesLocal(expr)) {
                return m; // preserve original placeholder for later resolution
            }
            const val = evaluate(expr, context);
            if (Array.isArray(val)) return val.join(' ');
            if (val === null || val === undefined) return '';
            return String(val);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes('Unknown function/filter') || msg.includes('Unknown object')) {
                return m; // preserve original placeholder for later resolution
            }
            throw e;
        }
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
import { evaluateExpression, expressionReferencesLocal } from './conditionEvaluator';

function evaluate(expr: string, context: TemplateContext): unknown {
    // The expression language exposes `local.*` as top-level names in our evaluator,
    // so we pass a flattened context for convenience
    return evaluateExpression(expr, context);
}
