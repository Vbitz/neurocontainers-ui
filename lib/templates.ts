import { ContainerRecipe, Architecture, CopyrightInfo } from "@/components/common";

export interface TemplateField {
    id: string;
    label: string;
    type: 'text' | 'url' | 'select' | 'textarea' | 'checkbox';
    required?: boolean;
    placeholder?: string;
    description?: string;
    options?: { value: string; label: string }[];
    validation?: (value: string) => string | null;
}

export interface ContainerTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    fields: TemplateField[];
    generateRecipe: (values: Record<string, string>) => ContainerRecipe;
}

// Common license options
export const LICENSE_OPTIONS = [
    { value: 'MIT', label: 'MIT License' },
    { value: 'Apache-2.0', label: 'Apache License 2.0' },
    { value: 'GPL-3.0', label: 'GNU General Public License v3.0' },
    { value: 'BSD-3-Clause', label: 'BSD 3-Clause License' },
    { value: 'BSD-2-Clause', label: 'BSD 2-Clause License' },
    { value: 'LGPL-2.1', label: 'GNU Lesser General Public License v2.1' },
    { value: 'LGPL-3.0', label: 'GNU Lesser General Public License v3.0' },
    { value: 'MPL-2.0', label: 'Mozilla Public License 2.0' },
    { value: 'AGPL-3.0', label: 'GNU Affero General Public License v3.0' },
    { value: 'Unlicense', label: 'The Unlicense' },
    { value: 'CC0-1.0', label: 'Creative Commons Zero v1.0 Universal' },
];

// Validation functions
export const validateGitHubUrl = (url: string): string | null => {
    if (!url.trim()) return "GitHub URL is required";
    const githubPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
    if (!githubPattern.test(url.trim())) {
        return "Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)";
    }
    return null;
};

export const validateContainerName = (name: string): string | null => {
    if (!name.trim()) return "Container name is required";
    if (name.length < 2) return "Container name must be at least 2 characters";
    if (name.length > 63) return "Container name cannot exceed 63 characters";
    
    // Container name validation: lowercase letters and numbers only
    const validNameRegex = /^[a-z0-9]+$/;
    if (!validNameRegex.test(name)) {
        return "Container name must be lowercase and can only contain letters and numbers";
    }
    return null;
};

export const validateVersion = (version: string): string | null => {
    if (!version.trim()) return "Version is required";
    return null;
};

// Python Package Template
export const PYTHON_PACKAGE_TEMPLATE: ContainerTemplate = {
    id: 'python-package',
    name: 'Python Package from GitHub',
    description: 'Create a container for a Python package hosted on GitHub with conda and pip installation',
    icon: '🐍',
    category: 'Programming',
    fields: [
        {
            id: 'githubUrl',
            label: 'GitHub Repository URL',
            type: 'url',
            required: true,
            placeholder: 'https://github.com/user/repository',
            description: 'The GitHub repository URL for the Python package you want to containerize',
            validation: validateGitHubUrl,
        },
        {
            id: 'containerName',
            label: 'Container Name',
            type: 'text',
            required: true,
            placeholder: 'mypackage',
            description: 'A unique name for your container (lowercase letters and numbers only)',
            validation: validateContainerName,
        },
        {
            id: 'version',
            label: 'Version',
            type: 'text',
            required: true,
            placeholder: '1.0.0',
            description: 'Version number for your container',
            validation: validateVersion,
        },
        {
            id: 'license',
            label: 'License',
            type: 'select',
            required: true,
            description: 'Choose the license for your container',
            options: LICENSE_OPTIONS,
        },
        {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            required: true,
            placeholder: 'Brief description of what this tool does...',
            description: 'A clear description of what your tool does and its purpose',
        },
        {
            id: 'additionalPackages',
            label: 'Additional Python Packages',
            type: 'textarea',
            required: false,
            placeholder: 'numpy\nscipy\nmatplotlib',
            description: 'Additional Python packages to install (one per line, optional)',
        },
        {
            id: 'condaPackages',
            label: 'Conda Packages',
            type: 'textarea',
            required: false,
            placeholder: 'python=3.9\nnumpy\nscipy',
            description: 'Conda packages to install (one per line, optional)',
        },
    ],
    generateRecipe: (values: Record<string, string>): ContainerRecipe => {
        const githubUrl = values.githubUrl.trim();
        const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        const repoName = repoMatch?.[2] || 'unknown';
        
        // Parse additional packages
        const additionalPackages = values.additionalPackages
            ? values.additionalPackages.split('\n').map(pkg => pkg.trim()).filter(pkg => pkg)
            : [];
            
        const condaPackages = values.condaPackages
            ? values.condaPackages.split('\n').map(pkg => pkg.trim()).filter(pkg => pkg)
            : ['python=3.9'];

        // Build pip install list
        const pipPackages = [githubUrl, ...additionalPackages];

        // Create copyright info
        const copyright: CopyrightInfo[] = [
            {
                license: values.license,
            }
        ];

        // Create directives
        const directives = [];

        // Add conda environment setup if conda packages specified
        if (condaPackages.length > 0) {
            directives.push({
                template: {
                    name: "miniconda",
                    version: "latest"
                }
            });

            // Install conda packages
            directives.push({
                run: [`conda install -y ${condaPackages.join(' ')}`]
            });
        }

        // Install pip packages
        directives.push({
            run: [`pip install ${pipPackages.join(' ')}`]
        });

        // Add deployment info
        directives.push({
            deploy: {
                path: ["/opt/miniconda/bin"],
                bins: []
            }
        });

        // Add basic test
        directives.push({
            test: {
                name: "python_import_test",
                script: `python -c "import ${repoName.replace('-', '_')}; print('${repoName} imported successfully')"`
            }
        });

        return {
            name: values.containerName,
            version: values.version,
            copyright,
            architectures: ["x86_64"] as Architecture[],
            structured_readme: {
                description: values.description,
                example: `# Example usage\n\n\`\`\`bash\n# Run the containerized tool\ndocker run --rm ${values.containerName}:${values.version} python -c "import ${repoName.replace('-', '_')}"\n\`\`\``,
                documentation: `This container packages the Python package from ${githubUrl}`,
                citation: `Please cite the original authors of ${repoName} when using this container.`
            },
            build: {
                kind: "neurodocker",
                "base-image": "ubuntu:22.04",
                "pkg-manager": "apt",
                directives
            },
            categories: ["programming"]
        };
    }
};

// Template registry
export const TEMPLATES: ContainerTemplate[] = [
    PYTHON_PACKAGE_TEMPLATE,
];

export const getTemplateById = (id: string): ContainerTemplate | undefined => {
    return TEMPLATES.find(template => template.id === id);
};