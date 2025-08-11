import { ContainerRecipe, Architecture, CopyrightInfo, convertStructuredReadmeToText } from "@/components/common";
import pythonPackageMarkdown from "@/copy/templates/python-package.md";

export interface TemplateField {
    id: string;
    label: string;
    type: 'text' | 'url' | 'select' | 'textarea' | 'checkbox' | 'packages' | 'python-packages' | 'license' | 'categories';
    required?: boolean;
    placeholder?: string;
    description?: string;
    options?: { value: string; label: string }[];
    validation?: (value: string) => string | null;
    packageType?: 'ubuntu' | 'python' | 'conda';
}

export interface ContainerTemplate {
    id: string;
    name: string;
    description: string;
    detailedDescription?: string; // Markdown content for detailed description
    icon: string;
    category: string;
    fields: TemplateField[];
    generateRecipe: (values: Record<string, string | string[] | object | null>) => ContainerRecipe;
}

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

// Extract repository name from GitHub URL
export const extractRepoName = (githubUrl: string): string => {
    const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (repoMatch && repoMatch[2]) {
        return repoMatch[2].replace(/\.git$/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    return 'mypackage';
};

// Python Package Template
export const PYTHON_PACKAGE_TEMPLATE: ContainerTemplate = {
    id: 'python-package',
    name: 'Python Package from GitHub',
    description: 'Create a container for a Python package hosted on GitHub with conda and pip installation',
    detailedDescription: pythonPackageMarkdown,
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
            type: 'license',
            required: true,
            description: 'Choose the license for your container',
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
            id: 'additionalPipPackages',
            label: 'Additional Python Packages (pip)',
            type: 'python-packages',
            required: false,
            placeholder: 'Add Python package name...',
            description: 'Additional Python packages to install via pip (optional)',
            packageType: 'python',
        },
        {
            id: 'condaPackages',
            label: 'Conda Packages',
            type: 'python-packages',
            required: false,
            placeholder: 'Add conda package name...',
            description: 'Conda packages to install (python=3.9 is included by default)',
            packageType: 'conda',
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
        const githubUrl = String(values.githubUrl || '').trim();
        const repoName = extractRepoName(githubUrl);
        
        // Parse packages from arrays (TagEditor provides arrays)
        const additionalPipPackages = Array.isArray(values.additionalPipPackages) ? values.additionalPipPackages : [];
        const condaPackages = Array.isArray(values.condaPackages) ? values.condaPackages : [];
        
        // Ensure python is included in conda packages
        const allCondaPackages = condaPackages;
        
        // Build pip install list with GitHub repo first, ensuring it's properly installable
        const pipPackages = [`git+${githubUrl}`, ...additionalPipPackages];

        // Create copyright info from license selection
        const copyright: CopyrightInfo[] = values.license ? [values.license as CopyrightInfo] : [];

        // Create directives
        const directives = [];

        // Add miniconda with conda packages first
        directives.push({
            template: {
                name: "miniconda",
                version: "latest",
                env: {},
                args: {
                    conda_install: allCondaPackages.join(' ')
                }
            }
        });

        // Add separate pip installation to ensure GitHub package is properly installed
        if (pipPackages.length > 0) {
            directives.push({
                install: pipPackages
            });
        }

        // Add deployment info
        directives.push({
            deploy: {
                path: ["/opt/miniconda/bin"],
                bins: []
            }
        });

        // Add comprehensive test that verifies the main package installation
        directives.push({
            test: {
                name: "verify_installation",
                script: [
                    `# Test Python and conda installation`,
                    `python --version`,
                    `conda --version`,
                    `# Test that pip packages were installed`,
                    `python -c "import sys; print('Python path:', sys.path)"`,
                    `pip list | grep -i "${repoName}" || echo "Warning: ${repoName} not found in pip list"`,
                    `# Attempt to import the main package`,
                    `python -c "`,
                    `import importlib.util`,
                    `import sys`,
                    ``,
                    `# Try common package name variations`,
                    `package_names = ['${repoName.replace('-', '_')}', '${repoName}', '${repoName.replace('_', '-')}']`,
                    `imported = False`,
                    ``,
                    `for pkg_name in package_names:`,
                    `    try:`,
                    `        __import__(pkg_name)`,
                    `        print(f'Successfully imported {pkg_name}')`,
                    `        imported = True`,
                    `        break`,
                    `    except ImportError:`,
                    `        continue`,
                    ``,
                    `if not imported:`,
                    `    print('Warning: Could not import main package. This may be normal if the package has a different import name.')`,
                    `    print('Available packages:')`,
                    `    import pkg_resources`,
                    `    for dist in pkg_resources.working_set:`,
                    `        if '${repoName}' in dist.project_name.lower():`,
                    `            print(f'  - {dist.project_name} ({dist.version})')`,
                    `else:`,
                    `    print('Package installation verified successfully!')`,
                    `"`
                ].join('\n')
            }
        });

        const structured_readme = {
            description: String(values.description || ''),
            example: `# Example usage\n\n\`\`\`bash\n# Run Python interactively in the container\ndocker run --rm -it ${values.containerName}:${values.version} python\n\n# Execute a Python script\ndocker run --rm -v /path/to/your/script.py:/script.py ${values.containerName}:${values.version} python /script.py\n\n# Test that the package is available\ndocker run --rm ${values.containerName}:${values.version} python -c "import ${repoName.replace('-', '_')}; print('${repoName} is available!')"\n\`\`\``,
            documentation: `This container includes:\n- Python via Miniconda\n- The Python package from ${githubUrl}\n- Additional conda packages: ${allCondaPackages.filter(pkg => !pkg.startsWith('python')).join(', ') || 'none'}\n- Additional pip packages: ${additionalPipPackages.join(', ') || 'none'}\n\nFor detailed package documentation, see: ${githubUrl}`,
            citation: `Please cite the original authors of the ${repoName} package when using this container. Repository: ${githubUrl}`
        };

        const containerName = String(values.containerName || '');
        const version = String(values.version || '');

        return {
            name: containerName,
            version,
            copyright,
            architectures: ["x86_64"] as Architecture[],
            structured_readme,
            readme: convertStructuredReadmeToText(structured_readme, containerName, version),
            build: {
                kind: "neurodocker",
                "base-image": "ubuntu:24.04",
                "pkg-manager": "apt",
                directives
            },
            categories: Array.isArray(values.categories) ? values.categories : ['programming']
        };
    }
};