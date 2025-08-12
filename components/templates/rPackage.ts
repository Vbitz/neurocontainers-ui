import { ContainerRecipe, Architecture, CopyrightInfo, convertStructuredReadmeToText } from "@/components/common";
import rPackageMarkdown from "@/copy/templates/r-package.md";
import { validateGitHubUrl, validateContainerName, validateVersion } from "./pythonPackage";
import type { ContainerTemplate } from "./pythonPackage";

// R Package specific validation
export const validateRPackageName = (name: string): string | null => {
    if (!name.trim()) return "R package name is required";
    // R package names should be valid R identifiers
    const validRNameRegex = /^[a-zA-Z][a-zA-Z0-9.]*$/;
    if (!validRNameRegex.test(name)) {
        return "R package name must start with a letter and contain only letters, numbers, and dots";
    }
    return null;
};

// Extract R package name from GitHub URL or use fallback
export const extractRPackageName = (githubUrl: string): string => {
    const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (repoMatch && repoMatch[2]) {
        return repoMatch[2].replace(/\.git$/, '');
    }
    return 'MyRPackage';
};

// R Package Template
export const R_PACKAGE_TEMPLATE: ContainerTemplate = {
    id: 'r-package',
    name: 'R Package from GitHub',
    description: 'Create a container for an R package hosted on GitHub with CRAN and Bioconductor support',
    detailedDescription: rPackageMarkdown,
    icon: '📊',
    category: 'Programming',
    fields: [
        {
            id: 'githubUrl',
            label: 'GitHub Repository URL',
            type: 'url',
            required: true,
            placeholder: 'https://github.com/user/MyRPackage',
            description: 'The GitHub repository URL for the R package you want to containerize',
            validation: validateGitHubUrl,
        },
        {
            id: 'containerName',
            label: 'Container Name',
            type: 'text',
            required: true,
            placeholder: 'myrpackage',
            description: 'A unique name for your container (lowercase letters and numbers only)',
            validation: validateContainerName,
        },
        {
            id: 'rPackageName',
            label: 'R Package Name',
            type: 'text',
            required: true,
            placeholder: 'MyRPackage',
            description: 'The name of the R package (as it appears in DESCRIPTION file)',
            validation: validateRPackageName,
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
            id: 'rVersion',
            label: 'R Version',
            type: 'select',
            required: true,
            description: 'R version to use in the container',
            options: [
                { value: '4.4.0', label: 'R 4.4.0 (Latest)' },
                { value: '4.3.3', label: 'R 4.3.3' },
                { value: '4.3.0', label: 'R 4.3.0' },
                { value: '4.2.3', label: 'R 4.2.3' },
            ],
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
            placeholder: 'Brief description of what this R package does...',
            description: 'A clear description of what your R package does and its purpose',
        },
        {
            id: 'cranPackages',
            label: 'Additional CRAN Packages',
            type: 'string-list',
            required: false,
            placeholder: 'Add CRAN package name...',
            description: 'Additional CRAN packages to install (e.g., ggplot2, dplyr, tidyr)',
        },
        {
            id: 'biocPackages',
            label: 'Bioconductor Packages',
            type: 'string-list',
            required: false,
            placeholder: 'Add Bioconductor package name...',
            description: 'Bioconductor packages to install (e.g., GenomicRanges, DESeq2)',
        },
        {
            id: 'systemPackages',
            label: 'System Dependencies',
            type: 'string-list',
            required: false,
            placeholder: 'Add system package name...',
            description: 'System packages needed for compilation (e.g., libxml2-dev, libcurl4-openssl-dev)',
        },
        {
            id: 'deployBins',
            label: 'Deploy Scripts',
            type: 'string-list',
            required: false,
            placeholder: 'Add script name...',
            description: 'R scripts or shell scripts that should be available as commands (e.g., run-analysis.R)',
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
        const rPackageName = String(values.rPackageName || extractRPackageName(githubUrl));
        const rVersion = String(values.rVersion || '4.4.0');

        // Parse packages from arrays
        const cranPackages = Array.isArray(values.cranPackages) ? values.cranPackages : [];
        const biocPackages = Array.isArray(values.biocPackages) ? values.biocPackages : [];
        const systemPackages = Array.isArray(values.systemPackages) ? values.systemPackages : [];
        const deployBins = Array.isArray(values.deployBins) ? values.deployBins : [];

        // Create copyright info from license selection
        const copyright: CopyrightInfo[] = values.license ? [values.license as CopyrightInfo] : [];

        // Create directives
        const directives = [];

        // Install system dependencies if any
        if (systemPackages.length > 0) {
            directives.push({
                install: systemPackages
            });
        }

        // Install R with specified version
        directives.push({
            install: [`r-base=${rVersion}*`, 'r-base-dev']
        });

        // Install additional CRAN packages
        if (cranPackages.length > 0) {
            const rInstallScript = [
                'R --slave -e "',
                `  packages <- c(${cranPackages.map(pkg => `"${pkg}"`).join(', ')})`,
                '  install.packages(packages, repos="https://cloud.r-project.org/", dependencies=TRUE)',
                '  cat("Installed CRAN packages:\\n")',
                '  cat(paste(packages, collapse=", "), "\\n")',
                '"'
            ].join('\\n');

            directives.push({
                run: [rInstallScript]
            });
        }

        // Install Bioconductor packages
        if (biocPackages.length > 0) {
            const biocInstallScript = [
                'R --slave -e "',
                '  if (!require(\\"BiocManager\\", quietly = TRUE))',
                '    install.packages(\\"BiocManager\\", repos=\\"https://cloud.r-project.org/\\")',
                `  packages <- c(${biocPackages.map(pkg => `"${pkg}"`).join(', ')})`,
                '  BiocManager::install(packages)',
                '  cat("Installed Bioconductor packages:\\n")',
                '  cat(paste(packages, collapse=", "), "\\n")',
                '"'
            ].join('\\n');

            directives.push({
                run: [biocInstallScript]
            });
        }

        // Install devtools and the main package from GitHub
        const mainPackageInstall = [
            'R --slave -e "',
            '  if (!require(\\"devtools\\", quietly = TRUE))',
            '    install.packages(\\"devtools\\", repos=\\"https://cloud.r-project.org/\\")',
            `  devtools::install_github(\\"${githubUrl.replace('https://github.com/', '')}\\"`,
            '    , dependencies=TRUE, upgrade=\\"never\\")',
            `  cat("Installed ${rPackageName} from GitHub\\n")`,
            '"'
        ].join('\\n');

        directives.push({
            run: [mainPackageInstall]
        });

        // Add deployment info if scripts are specified
        if (deployBins.length > 0) {
            directives.push({
                deploy: {
                    bins: deployBins
                }
            });
        }

        // Add comprehensive test
        directives.push({
            test: {
                name: "verify_r_installation",
                script: [
                    `# Test R installation`,
                    `R --version`,
                    `echo "Testing R package installation..."`,
                    `R --slave -e "`,
                    `  # Check R version`,
                    `  cat('R version:', R.version.string, '\\n')`,
                    `  `,
                    `  # Test main package`,
                    `  tryCatch({`,
                    `    library(${rPackageName})`,
                    `    cat('Successfully loaded ${rPackageName}\\n')`,
                    `    `,
                    `    # Try to get package info`,
                    `    pkg_info <- packageDescription('${rPackageName}')`,
                    `    if (!is.na(pkg_info)) {`,
                    `      cat('Package version:', pkg_info[['Version']], '\\n')`,
                    `      cat('Package title:', pkg_info[['Title']], '\\n')`,
                    `    }`,
                    `  }, error = function(e) {`,
                    `    cat('Warning: Could not load ${rPackageName}:', e[['message']], '\\n')`,
                    `    cat('Installed packages:\\n')`,
                    `    print(installed.packages()[,c('Package', 'Version')])`,
                    `  })`,
                    `  `,
                    `  # List key installed packages`,
                    `  key_packages <- c(${[...cranPackages, ...biocPackages].map(pkg => `"${pkg}"`).join(', ')})`,
                    `  if (length(key_packages) > 0) {`,
                    `    cat('Checking additional packages:\\n')`,
                    `    for (pkg in key_packages) {`,
                    `      if (require(pkg, character.only = TRUE, quietly = TRUE)) {`,
                    `        cat('  ✓', pkg, '\\n')`,
                    `      } else {`,
                    `        cat('  ✗', pkg, '(not found)\\n')`,
                    `      }`,
                    `    }`,
                    `  }`,
                    `"`
                ].join('\\n')
            }
        });

        const structured_readme = {
            description: String(values.description || ''),
            example: `# Example usage\n\n\`\`\`bash\n# Run R interactively in the container\ndocker run --rm -it ${values.containerName}:${values.version} R\n\n# Execute an R script\ndocker run --rm -v /path/to/your/script.R:/script.R ${values.containerName}:${values.version} Rscript /script.R\n\n# Test that the package is available\ndocker run --rm ${values.containerName}:${values.version} R --slave -e "library(${rPackageName}); cat('${rPackageName} is available!\\\\n')"\n${deployBins.length > 0 ? `\n# Use deployed scripts\n${deployBins.map(bin => `docker run --rm ${values.containerName}:${values.version} ${bin}`).join('\n')}` : ''}\n\`\`\``,
            documentation: `This container includes:\n- R ${rVersion}\n- The R package ${rPackageName} from ${githubUrl}\n- Additional CRAN packages: ${cranPackages.join(', ') || 'none'}\n- Additional Bioconductor packages: ${biocPackages.join(', ') || 'none'}\n- System dependencies: ${systemPackages.join(', ') || 'none'}\n- Deployed scripts: ${deployBins.join(', ') || 'none'}\n\nFor detailed package documentation, see: ${githubUrl}`,
            citation: `Please cite the original authors of the ${rPackageName} package when using this container. Repository: ${githubUrl}`
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