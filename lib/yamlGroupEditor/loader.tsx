/**
 * YAML group loader for replacing TSX group editors
 * Loads YAML group definitions and registers them with the existing system
 */

import yaml from 'js-yaml';
import { registerGroupEditor } from '@/components/directives/group';
import type { GroupEditorArgument } from '@/components/directives/group';
import type { ComponentType } from 'react';
import { HelpSection } from '@/components/ui/HelpSection';
import { processYamlGroup, YamlGroup } from './index';
import { getIconByName } from './iconMapping';

// Color mapping for string colors to actual Tailwind classes
const COLOR_MAPPING = {
    orange: { 
        light: "bg-orange-50 border-orange-200 hover:bg-orange-100", 
        dark: "bg-orange-900 border-orange-700 hover:bg-orange-800" 
    },
    blue: { 
        light: "bg-blue-50 border-blue-200 hover:bg-blue-100", 
        dark: "bg-blue-900 border-blue-700 hover:bg-blue-800" 
    },
    green: { 
        light: "bg-green-50 border-green-200 hover:bg-green-100", 
        dark: "bg-green-900 border-green-700 hover:bg-green-800" 
    },
    gray: { 
        light: "bg-gray-50 border-gray-200 hover:bg-gray-100", 
        dark: "bg-gray-900 border-gray-700 hover:bg-gray-800" 
    },
    red: {
        light: "bg-red-50 border-red-200 hover:bg-red-100",
        dark: "bg-red-900 border-red-700 hover:bg-red-800"
    },
    yellow: {
        light: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
        dark: "bg-yellow-900 border-yellow-700 hover:bg-yellow-800"
    },
    purple: {
        light: "bg-purple-50 border-purple-200 hover:bg-purple-100",
        dark: "bg-purple-900 border-purple-700 hover:bg-purple-800"
    },
    pink: {
        light: "bg-pink-50 border-pink-200 hover:bg-pink-100",
        dark: "bg-pink-900 border-pink-700 hover:bg-pink-800"
    },
    indigo: {
        light: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
        dark: "bg-indigo-900 border-indigo-700 hover:bg-indigo-800"
    },
    teal: {
        light: "bg-teal-50 border-teal-200 hover:bg-teal-100",
        dark: "bg-teal-900 border-teal-700 hover:bg-teal-800"
    },
};

const ICON_COLOR_MAPPING = {
    orange: { light: "text-orange-600", dark: "text-orange-400" },
    blue: { light: "text-blue-600", dark: "text-blue-400" },
    green: { light: "text-green-600", dark: "text-green-400" },
    gray: { light: "text-gray-600", dark: "text-gray-400" },
    red: { light: "text-red-600", dark: "text-red-400" },
    yellow: { light: "text-yellow-600", dark: "text-yellow-400" },
    purple: { light: "text-purple-600", dark: "text-purple-400" },
    pink: { light: "text-pink-600", dark: "text-pink-400" },
    indigo: { light: "text-indigo-600", dark: "text-indigo-400" },
    teal: { light: "text-teal-600", dark: "text-teal-400" },
};

/**
 * Parse YAML content into a YamlGroup object
 */
export function parseYamlGroup(yamlContent: string): YamlGroup {
    try {
        const parsed = yaml.load(yamlContent) as YamlGroup;
        
        // Validate required fields
        if (!parsed.metadata || !parsed.arguments || !parsed.directives) {
            throw new Error('YAML group must have metadata, arguments, and directives');
        }
        
        if (!parsed.metadata.key || !parsed.metadata.label) {
            throw new Error('YAML group metadata must have key and label');
        }
        
        return parsed;
    } catch (error) {
        throw new Error(`Failed to parse YAML group: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Register a YAML group with the existing group editor system
 */
export async function registerYamlGroup(yamlContent: string): Promise<void> {
    const yamlGroup = parseYamlGroup(yamlContent);
    
    // Help content is now embedded in YAML, no need to preload
    
    // Get icon component
    const IconComponent = getIconByName(yamlGroup.metadata.icon);
    
    // Get color classes
    const colorName = yamlGroup.metadata.color as keyof typeof COLOR_MAPPING;
    const colorClasses = COLOR_MAPPING[colorName];
    const iconColorClasses = ICON_COLOR_MAPPING[colorName];
    
    if (!colorClasses || !iconColorClasses) {
        throw new Error(`Unknown color: ${yamlGroup.metadata.color}. Available colors: ${Object.keys(COLOR_MAPPING).join(', ')}`);
    }
    
    // Register with the existing system
    registerGroupEditor(yamlGroup.metadata.key, {
        metadata: {
            key: yamlGroup.metadata.key,
            label: yamlGroup.metadata.label,
            description: yamlGroup.metadata.description,
            icon: IconComponent,
            color: colorClasses,
            iconColor: iconColorClasses,
            defaultValue: {
                group: [],
                custom: yamlGroup.metadata.key,
            },
            keywords: yamlGroup.metadata.keywords,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            component: undefined as unknown as ComponentType<any>, // Will be set by registerGroupEditor
        },
        helpContent() {
            const helpContent = yamlGroup.metadata.helpContent || '';
                
            return (
                <HelpSection
                    markdownContent={helpContent}
                    sourceFilePath=""
                />
            );
        },
        arguments: yamlGroup.arguments.map(arg => ({
            ...arg,
            type: arg.type as "dropdown" | "text" | "array" | "boolean",
            multiline: (arg as unknown as { multiline?: boolean }).multiline ?? getMultilineFlag(arg.name),
        })) as GroupEditorArgument[],
        updateDirective(args: Record<string, unknown>) {
            // Use the YAML processor to generate directives
            const directives = processYamlGroup(yamlGroup, args);
            
            return {
                group: directives,
                custom: yamlGroup.metadata.key,
            };
        },
    });
}

/**
 * Determine if a field should be multiline based on field name and group type
 */
function getMultilineFlag(fieldName: string): boolean | undefined {
    const multilineFields = {
        content: true,        // shell script content
        requirements: true,   // pip requirements
        environment_yaml: true, // miniconda yaml content
    };
    
    return multilineFields[fieldName as keyof typeof multilineFields];
}

/**
 * Load and register multiple YAML groups
 */
export async function loadYamlGroups(yamlContents: Record<string, string>): Promise<void> {
    const registrationPromises = Object.entries(yamlContents).map(([filename, content]) => {
        try {
            return registerYamlGroup(content);
        } catch (error) {
            console.error(`Failed to register YAML group from ${filename}:`, error);
            throw error;
        }
    });
    
    await Promise.all(registrationPromises);
}
