/**
 * Main YAML Group Editor implementation
 * Processes YAML-style group definitions with template interpolation and conditions
 */

import { Directive, GroupDirective } from "@/components/common";
import { interpolateTemplate, createInitialContext, mergeContext, TemplateContext } from "./templateInterpolator";
import { evaluateCondition } from "./conditionEvaluator";

export interface YamlGroupMetadata {
    key: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    helpContent: string;
    helpPath: string;
    keywords: string[];
}

export interface YamlArgumentDescription {
    name: string;
    type: string;
    required: boolean;
    defaultValue: unknown;
    description: string;
    options?: string[];
}

export interface YamlGroup {
    metadata: YamlGroupMetadata;
    arguments: YamlArgumentDescription[];
    directives: Directive[];
}

/**
 * Processes a YAML group definition with given arguments to generate final directives
 */
export function processYamlGroup(
    group: YamlGroup,
    args: Record<string, unknown>
): Directive[] {
    // Start with initial context from user arguments
    let context: TemplateContext = createInitialContext(args);
    const result: Directive[] = [];
    
    // Process each directive in order
    for (const directive of group.directives) {
        // Check if this directive should be included based on its condition
        if (directive.condition && !evaluateCondition(directive.condition, context)) {
            continue; // Skip this directive
        }
        
        // Handle special 'variables' directive type
        if ('variables' in directive && directive.variables) {
            // Process variable assignments and merge into context
            const interpolatedVariables = interpolateTemplate(directive.variables, context) as Record<string, unknown>;
            context = mergeContext(context, interpolatedVariables);
            continue; // Variables directive doesn't produce output, just updates context
        }
        
        // For all other directive types, interpolate templates and add to result
        const interpolatedDirective = interpolateTemplate(directive, context) as Directive;
        
        // Remove the condition from the final directive (it's only used for processing)
        if ('condition' in interpolatedDirective) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { condition, ...directiveWithoutCondition } = interpolatedDirective as unknown as Record<string, unknown>;
            result.push(directiveWithoutCondition as unknown as Directive);
        } else {
            result.push(interpolatedDirective);
        }
    }
    
    return result;
}

/**
 * Creates a registerYAMLGroupEditor function that integrates with the existing group editor system
 */
export function createYamlGroupRegistration() {
    return function registerYAMLGroupEditor(key: string, yamlGroup: YamlGroup): GroupDirective {
        // Generate directives using the YAML processing system
        const directives = processYamlGroup(yamlGroup, {});
        
        return {
            group: directives,
            custom: key,
        };
    };
}

/**
 * The main function to replace the placeholder in java.tsx
 * Note: This is a legacy placeholder function that is no longer used
 */
export function registerYAMLGroupEditor(key: string): GroupDirective {
    // For now, return empty group - this will be used to integrate with the existing system
    return {
        group: [],
        custom: key,
    };
}

// Export the processor function for use in tests and other modules
export { processYamlGroup as default };