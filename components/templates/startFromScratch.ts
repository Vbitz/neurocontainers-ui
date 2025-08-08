import { ContainerRecipe, Architecture } from "@/components/common";
import type { ContainerTemplate } from './pythonPackage';

// Start from Scratch Template - minimal template for custom containers
export const START_FROM_SCRATCH_TEMPLATE: ContainerTemplate = {
    id: 'start-from-scratch',
    name: 'Start from Scratch',
    description: 'Create a new container with full control over all settings',
    icon: '⚙️', // This will be replaced by getTemplateIcon
    category: 'Custom',
    fields: [
        {
            id: 'containerName',
            label: 'Container Name',
            type: 'text',
            required: true,
            placeholder: 'my-container',
            description: 'A unique name for your container (lowercase letters and numbers only)',
            validation: (name: string): string | null => {
                if (!name.trim()) return "Container name is required";
                if (name.length < 2) return "Container name must be at least 2 characters";
                if (name.length > 63) return "Container name cannot exceed 63 characters";
                
                // Container name validation: lowercase letters and numbers only
                const validNameRegex = /^[a-z0-9]+$/;
                if (!validNameRegex.test(name)) {
                    return "Container name must be lowercase and can only contain letters and numbers";
                }
                return null;
            },
        },
        {
            id: 'version',
            label: 'Version',
            type: 'text',
            required: true,
            placeholder: '1.0.0',
            description: 'Version number for your container',
            validation: (version: string): string | null => {
                if (!version.trim()) return "Version is required";
                return null;
            },
        },
        {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            required: false,
            placeholder: 'Brief description of what this container does...',
            description: 'A clear description of what your container does and its purpose',
        },
        {
            id: 'categories',
            label: 'Categories',
            type: 'categories',
            required: true,
            description: 'Select categories that best describe your container',
        },
    ],
    generateRecipe: (values: Record<string, string | string[] | object | null>): ContainerRecipe => {
        return {
            name: String(values.containerName || ''),
            version: String(values.version || '1.0.0'),
            copyright: [],
            architectures: ["x86_64"] as Architecture[],
            structured_readme: {
                description: String(values.description || ''),
                example: `# Example usage\n\n\`\`\`bash\n# Run the containerized tool\ndocker run --rm ${values.containerName}:${values.version}\n\`\`\``,
                documentation: `This container was created from scratch.`,
                citation: `Please cite appropriately when using this container.`
            },
            build: {
                kind: "neurodocker",
                "base-image": "ubuntu:22.04",
                "pkg-manager": "apt",
                directives: []
            },
            categories: Array.isArray(values.categories) ? values.categories : ['utilities']
        };
    }
};