import { ContainerRecipe, Directive, GroupDirective, convertStructuredReadmeToText } from "@/components/common";
import { getGroupEditor } from "@/components/directives/group";

/**
 * Regenerates group directives that have custom properties by using their registered group editors
 */
export function regenerateGroups(recipe: ContainerRecipe): ContainerRecipe {
    if (!recipe.build?.directives) {
        return recipe;
    }

    const regeneratedDirectives = recipe.build.directives.map((directive): Directive => {
        // Check if this is a group directive with custom properties
        if ('group' in directive && directive.custom && directive.customParams) {
            const groupDirective = directive as GroupDirective;
            
            // Ensure custom is a string and customParams exists before using them
            if (typeof groupDirective.custom === 'string' && groupDirective.customParams) {
                const groupEditor = getGroupEditor(groupDirective.custom);
                if (groupEditor) {
                    try {
                        // Regenerate the group using the editor's updateDirective function
                        const updatedDirective = groupEditor.updateDirective(groupDirective.customParams);
                        
                        // Preserve the condition if it exists
                        if (groupDirective.condition) {
                            updatedDirective.condition = groupDirective.condition;
                        }
                        
                        // Preserve the custom name and params
                        updatedDirective.custom = groupDirective.custom;
                        updatedDirective.customParams = groupDirective.customParams;
                        
                        console.log(`Regenerated group "${groupDirective.custom}" with params:`, groupDirective.customParams);
                        return updatedDirective;
                    } catch (error) {
                        console.warn(`Failed to regenerate group "${groupDirective.custom}":`, error);
                        // Return the original directive if regeneration fails
                        return directive;
                    }
                }
            }
        }
        
        // Return the directive unchanged if it's not a custom group
        return directive;
    });

    return {
        ...recipe,
        build: {
            ...recipe.build,
            directives: regeneratedDirectives
        }
    };
}

/**
 * Regenerates the plain text readme from structured_readme if it exists
 */
export function regenerateStructuredReadme(recipe: ContainerRecipe): ContainerRecipe {
    if (!recipe.structured_readme || !recipe.name) {
        return recipe;
    }

    try {
        // Generate plain text readme from structured readme
        const plainTextReadme = convertStructuredReadmeToText(
            recipe.structured_readme,
            recipe.name,
            recipe.version || 'latest'
        );

        console.log(`Regenerated structured readme for container "${recipe.name}"`);

        return {
            ...recipe,
            readme: plainTextReadme
        };
    } catch (error) {
        console.warn(`Failed to regenerate structured readme for "${recipe.name}":`, error);
        return recipe;
    }
}

/**
 * Regenerates both groups and structured readme for a container recipe
 */
export function regenerateRecipe(recipe: ContainerRecipe): ContainerRecipe {
    console.log('Regenerating recipe before validation/publishing...');
    
    // First regenerate groups, then structured readme
    let updatedRecipe = regenerateGroups(recipe);
    updatedRecipe = regenerateStructuredReadme(updatedRecipe);
    
    return updatedRecipe;
}