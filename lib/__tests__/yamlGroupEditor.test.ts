import { processYamlGroup, YamlGroup } from "@/lib/yamlGroupEditor";
import { interpolateTemplate } from "@/lib/yamlGroupEditor/templateInterpolator";
import { evaluateCondition } from "@/lib/yamlGroupEditor/conditionEvaluator";

describe('YAML Group Editor', () => {
    const javaGroupDefinition: YamlGroup = {
        metadata: {
            key: "java",
            label: "Java",
            description: "Install Java Development Kit (JDK)",
            icon: "CodeBracket",
            color: "orange",
            helpContent: "",
            helpPath: "copy/help/groups/java-group.md",
            keywords: ["java", "jdk", "openjdk", "jre", "javac", "jar"],
        },
        arguments: [
            {
                name: "version",
                type: "dropdown",
                required: true,
                defaultValue: "17",
                description: "Java version to install",
                options: ["default", "8", "11", "17", "21"],
            },
            {
                name: "type",
                type: "dropdown",
                required: true,
                defaultValue: "jdk",
                description: "Install JDK (development) or JRE (runtime only)",
                options: ["jdk", "jre"],
            },
            {
                name: "setJavaHome",
                type: "boolean",
                required: false,
                defaultValue: true,
                description: "Set JAVA_HOME environment variable",
            },
        ],
        directives: [
            {
                variables: {
                    javaHome: "/usr/lib/jvm/default-java",
                    javaPackages: ["default-{{ local.type }}"]
                },
                condition: "version == \"default\""
            },
            {
                variables: {
                    javaHome: "/usr/lib/jvm/java-{{ local.version }}-openjdk-amd64",
                    javaPackages: ["openjdk-{{ local.version }}-{{ local.type }}"]
                },
                condition: "version != \"default\""
            },
            {
                install: "{{ local.javaPackages }}",
            },
            {
                environment: {
                    JAVA_HOME: "{{ local.javaHome }}",
                    PATH: "{{ local.javaHome }}/bin:$PATH",
                },
                condition: "local.setJavaHome",
            }
        ],
    };

    describe('template interpolation', () => {
        it('should interpolate simple variables', () => {
            // Test case: {{ local.type }} should become "jdk"
            const template = "default-{{ local.type }}";
            const context = { type: "jdk" };
            const result = interpolateTemplate(template, context);
            
            expect(result).toBe("default-jdk");
        });

        it('should interpolate complex paths', () => {
            // Test case: {{ local.javaHome }}/bin:$PATH
            const template = "{{ local.javaHome }}/bin:$PATH";
            const context = { javaHome: "/usr/lib/jvm/java-17-openjdk-amd64" };
            const result = interpolateTemplate(template, context);
            
            expect(result).toBe("/usr/lib/jvm/java-17-openjdk-amd64/bin:$PATH");
        });

        it('should handle array templates', () => {
            // Test case: ["openjdk-{{ local.version }}-{{ local.type }}"]
            const template = ["openjdk-{{ local.version }}-{{ local.type }}"];
            const context = { version: "17", type: "jdk" };
            const result = interpolateTemplate(template, context);
            
            expect(result).toEqual(["openjdk-17-jdk"]);
        });

        it('should handle object templates', () => {
            const template = {
                JAVA_HOME: "{{ local.javaHome }}",
                PATH: "{{ local.javaHome }}/bin:$PATH"
            };
            const context = { javaHome: "/usr/lib/jvm/default-java" };
            const result = interpolateTemplate(template, context);
            
            expect(result).toEqual({
                JAVA_HOME: "/usr/lib/jvm/default-java",
                PATH: "/usr/lib/jvm/default-java/bin:$PATH"
            });
        });
    });

    describe('condition evaluation', () => {
        it('should evaluate equality conditions', () => {
            // Test case: version == "default"
            const condition = 'version == "default"';
            const args1 = { version: "default" };
            const args2 = { version: "17" };
            
            expect(evaluateCondition(condition, args1)).toBe(true);
            expect(evaluateCondition(condition, args2)).toBe(false);
        });

        it('should evaluate inequality conditions', () => {
            // Test case: version != "default"
            const condition = 'version != "default"';
            const args1 = { version: "17" };
            const args2 = { version: "default" };
            
            expect(evaluateCondition(condition, args1)).toBe(true);
            expect(evaluateCondition(condition, args2)).toBe(false);
        });

        it('should evaluate boolean conditions', () => {
            // Test case: local.setJavaHome
            const condition = 'local.setJavaHome';
            const context1 = { setJavaHome: true };
            const context2 = { setJavaHome: false };
            
            expect(evaluateCondition(condition, context1)).toBe(true);
            expect(evaluateCondition(condition, context2)).toBe(false);
        });

        it('should handle empty conditions as true', () => {
            expect(evaluateCondition('', {})).toBe(true);
            expect(evaluateCondition('   ', {})).toBe(true);
        });

        it('should handle complex expressions with parentheses', () => {
            const condition = '(version == "default" || version == "8") && local.setJavaHome';
            const context1 = { version: "default", setJavaHome: true };
            const context2 = { version: "8", setJavaHome: true };
            const context3 = { version: "17", setJavaHome: true };
            const context4 = { version: "default", setJavaHome: false };
            
            expect(evaluateCondition(condition, context1)).toBe(true);
            expect(evaluateCondition(condition, context2)).toBe(true);
            expect(evaluateCondition(condition, context3)).toBe(false);
            expect(evaluateCondition(condition, context4)).toBe(false);
        });

        it('should handle negation operator', () => {
            const condition = '!local.setJavaHome';
            const context1 = { setJavaHome: true };
            const context2 = { setJavaHome: false };
            
            expect(evaluateCondition(condition, context1)).toBe(false);
            expect(evaluateCondition(condition, context2)).toBe(true);
        });

        it('should handle boolean literals', () => {
            expect(evaluateCondition('true', {})).toBe(true);
            expect(evaluateCondition('false', {})).toBe(false);
            expect(evaluateCondition('true && false', {})).toBe(false);
            expect(evaluateCondition('true || false', {})).toBe(true);
        });

        it('should handle string comparisons', () => {
            const condition = 'version == "default"';
            const context1 = { version: "default" };
            const context2 = { version: "17" };
            
            expect(evaluateCondition(condition, context1)).toBe(true);
            expect(evaluateCondition(condition, context2)).toBe(false);
        });

        it('should handle operator precedence correctly', () => {
            // AND has higher precedence than OR
            const condition = 'false || true && false';
            // Should be evaluated as: false || (true && false) = false || false = false
            expect(evaluateCondition(condition, {})).toBe(false);
            
            const condition2 = 'true && false || true';
            // Should be evaluated as: (true && false) || true = false || true = true
            expect(evaluateCondition(condition2, {})).toBe(true);
        });
    });

    describe('directive generation', () => {
        it('should generate correct directives for default Java version', () => {
            const args = { version: "default", type: "jdk", setJavaHome: true };
            const result = processYamlGroup(javaGroupDefinition, args);
            
            // Expected directives:
            // 1. install: ["default-jdk"]
            // 2. environment: { JAVA_HOME: "/usr/lib/jvm/default-java", PATH: "/usr/lib/jvm/default-java/bin:$PATH" }
            
            expect(result).toHaveLength(2);
            
            // Check install directive
            const installDirective = result.find(d => 'install' in d);
            expect(installDirective).toBeDefined();
            expect(installDirective?.install).toEqual("default-jdk");
            
            // Check environment directive
            const envDirective = result.find(d => 'environment' in d);
            expect(envDirective).toBeDefined();
            expect(envDirective?.environment).toEqual({
                JAVA_HOME: "/usr/lib/jvm/default-java",
                PATH: "/usr/lib/jvm/default-java/bin:$PATH"
            });
        });

        it('should generate correct directives for specific Java version', () => {
            const args = { version: "17", type: "jre", setJavaHome: false };
            const result = processYamlGroup(javaGroupDefinition, args);
            
            // Expected directives:
            // 1. install: ["openjdk-17-jre"]
            // 2. No environment directive (setJavaHome is false)
            
            expect(result).toHaveLength(1);
            
            // Check install directive
            const installDirective = result.find(d => 'install' in d);
            expect(installDirective).toBeDefined();
            expect(installDirective?.install).toEqual("openjdk-17-jre");
            
            // Should not have environment directive
            const envDirective = result.find(d => 'environment' in d);
            expect(envDirective).toBeUndefined();
        });

        it('should filter directives based on conditions', () => {
            const args = { version: "11", type: "jdk", setJavaHome: false };
            const result = processYamlGroup(javaGroupDefinition, args);
            
            // Should not include environment directive because setJavaHome is false
            // Should use the version != "default" variable set
            
            expect(result).toHaveLength(1);
            
            const installDirective = result.find(d => 'install' in d);
            expect(installDirective).toBeDefined();
            expect(installDirective?.install).toEqual("openjdk-11-jdk");
        });

        it('should handle all directives with proper variable context', () => {
            const args = { version: "21", type: "jdk", setJavaHome: true };
            const result = processYamlGroup(javaGroupDefinition, args);
            
            expect(result).toHaveLength(2);
            
            // Verify the install directive uses interpolated values
            const installDirective = result.find(d => 'install' in d);
            expect(installDirective?.install).toEqual("openjdk-21-jdk");
            
            // Verify the environment directive uses interpolated values  
            const envDirective = result.find(d => 'environment' in d);
            expect(envDirective?.environment).toEqual({
                JAVA_HOME: "/usr/lib/jvm/java-21-openjdk-amd64",
                PATH: "/usr/lib/jvm/java-21-openjdk-amd64/bin:$PATH"
            });
        });
    });

    describe('variable directive processing', () => {
        it('should process variable directives and build context', () => {
            // Variables directives should set local context that can be used in later directives
            const args = { version: "17", type: "jdk", setJavaHome: true };
            const result = processYamlGroup(javaGroupDefinition, args);
            
            // The second variables directive should set:
            // javaHome: "/usr/lib/jvm/java-17-openjdk-amd64"
            // javaPackages: ["openjdk-17-jdk"]
            
            // Verify that the install directive got the correct interpolated value
            const installDirective = result.find(d => 'install' in d);
            expect(installDirective?.install).toEqual("openjdk-17-jdk");
            
            // Verify that the environment directive got the correct interpolated value
            const envDirective = result.find(d => 'environment' in d);
            expect(envDirective?.environment?.JAVA_HOME).toEqual("/usr/lib/jvm/java-17-openjdk-amd64");
        });

        it('should handle conditional variable directives', () => {
            // Only one of the two variable directives should be processed based on condition
            const args1 = { version: "default", type: "jre", setJavaHome: true };
            const args2 = { version: "11", type: "jdk", setJavaHome: true };
            
            const result1 = processYamlGroup(javaGroupDefinition, args1);
            const result2 = processYamlGroup(javaGroupDefinition, args2);
            
            // For args1: should use first variables directive (default Java)
            const install1 = result1.find(d => 'install' in d);
            expect(install1?.install).toEqual("default-jre");
            
            const env1 = result1.find(d => 'environment' in d);
            expect(env1?.environment?.JAVA_HOME).toEqual("/usr/lib/jvm/default-java");
            
            // For args2: should use second variables directive (specific version)
            const install2 = result2.find(d => 'install' in d);
            expect(install2?.install).toEqual("openjdk-11-jdk");
            
            const env2 = result2.find(d => 'environment' in d);
            expect(env2?.environment?.JAVA_HOME).toEqual("/usr/lib/jvm/java-11-openjdk-amd64");
        });
    });

    describe('Shell Script group editor', () => {
        const shellScriptGroupDefinition = {
            metadata: {
                key: "shellScript",
                label: "Shell Script",
                description: "Create a shell script",
                icon: "Folder",
                color: "gray",
                helpContent: "",
                helpPath: "copy/help/groups/shell-script-group.md",
                keywords: ["shell", "script", "bash", "sh", "executable"],
            },
            arguments: [
                {
                    name: "name",
                    type: "text",
                    required: true,
                    defaultValue: "myscript",
                    description: "Name of the shell script file.",
                },
                {
                    name: "path",
                    type: "text",
                    required: true,
                    defaultValue: "/usr/local/bin",
                    description: "Path where the shell script will be created. Must be an absolute path.",
                },
                {
                    name: "content",
                    type: "text",
                    required: true,
                    defaultValue: "#!/bin/bash\n\necho 'Hello, World!'",
                    description: "Content of the shell script. This should be a valid shell script.",
                },
                {
                    name: "executable",
                    type: "boolean",
                    required: false,
                    defaultValue: true,
                    description: "Make the script executable. If true, the script will be given execute permissions.",
                },
                {
                    name: "addToPath",
                    type: "boolean",
                    required: false,
                    defaultValue: true,
                    description: "Add the script's directory to the PATH environment variable.",
                },
                {
                    name: "makeDeployBin",
                    type: "boolean",
                    required: false,
                    defaultValue: true,
                    description: "Register the script as a deploy binary, making it available outside the container.",
                },
            ],
            directives: [
                {
                    variables: {
                        scriptPath: "{{ local.path }}/{{ local.name }}",
                    },
                },
                {
                    file: {
                        name: "{{ local.name }}",
                        contents: "{{ local.content }}",
                    },
                },
                {
                    run: [
                        "cp {{ get_file(\"{{ local.name }}\") }} {{ local.scriptPath }}",
                    ],
                },
                {
                    run: ["chmod +x {{ local.scriptPath }}"],
                    condition: "local.executable",
                },
                {
                    environment: {
                        PATH: "$PATH:{{ local.path }}",
                    },
                    condition: "local.addToPath",
                },
                {
                    deploy: {
                        bins: ["{{ local.name }}"],
                    },
                    condition: "local.makeDeployBin",
                },
            ],
        };

        it('should generate correct directives with all options enabled', () => {
            const args = {
                name: "test-script",
                path: "/usr/local/bin",
                content: "#!/bin/bash\necho 'test'",
                executable: true,
                addToPath: true,
                makeDeployBin: true,
            };
            const result = processYamlGroup(shellScriptGroupDefinition, args);

            // Should have: file, run (copy), run (chmod), environment, deploy
            expect(result).toHaveLength(5);

            // Check file directive
            const fileDirective = result.find(d => 'file' in d);
            expect(fileDirective?.file).toEqual({
                name: "test-script",
                contents: "#!/bin/bash\necho 'test'",
            });

            // Check chmod directive - need to look for array containing string with chmod
            const chmodDirective = result.find(d => 'run' in d && Array.isArray(d.run) && d.run.some(cmd => cmd.includes('chmod')));
            expect(chmodDirective?.run).toEqual(["chmod +x /usr/local/bin/test-script"]);

            // Check environment directive
            const envDirective = result.find(d => 'environment' in d);
            expect(envDirective?.environment).toEqual({
                PATH: "$PATH:/usr/local/bin",
            });

            // Check deploy directive
            const deployDirective = result.find(d => 'deploy' in d);
            expect(deployDirective?.deploy).toEqual({
                bins: ["test-script"],
            });
        });

        it('should generate minimal directives when optional features are disabled', () => {
            const args = {
                name: "simple-script",
                path: "/opt/scripts",
                content: "#!/bin/sh\nls",
                executable: false,
                addToPath: false,
                makeDeployBin: false,
            };
            const result = processYamlGroup(shellScriptGroupDefinition, args);

            // Should only have: file, run (copy)
            expect(result).toHaveLength(2);

            // Should not have chmod, environment, or deploy directives
            expect(result.find(d => 'run' in d && d.run.some(cmd => cmd.includes('chmod')))).toBeUndefined();
            expect(result.find(d => 'environment' in d)).toBeUndefined();
            expect(result.find(d => 'deploy' in d)).toBeUndefined();
        });
    });

    describe('Pip Requirements group editor', () => {
        const pipRequirementsGroupDefinition = {
            metadata: {
                key: "pipRequirements",
                label: "Pip Requirements",
                description: "Install Python packages from requirements.txt file",
                icon: "DocumentText",
                color: "blue",
                helpContent: "",
                helpPath: "copy/help/groups/pip-requirements-group.md",
                keywords: ["pip", "python", "requirements", "packages", "install"],
            },
            arguments: [
                {
                    name: "requirements",
                    type: "text",
                    required: true,
                    defaultValue: "numpy==1.21.0\nscipy>=1.7.0\nmatplotlib",
                    description: "Content of the requirements.txt file. Each line should contain a package specification.",
                },
                {
                    name: "pip_opts",
                    type: "text",
                    required: false,
                    defaultValue: "--no-cache-dir",
                    description: "Additional options to pass to pip install command.",
                },
                {
                    name: "cleanup",
                    type: "boolean",
                    required: false,
                    defaultValue: true,
                    description: "Remove the requirements.txt file after installation to reduce image size.",
                },
                {
                    name: "upgrade_pip",
                    type: "boolean",
                    required: false,
                    defaultValue: true,
                    description: "Upgrade pip to the latest version before installing packages.",
                },
            ],
            directives: [
                {
                    file: {
                        name: "requirements.txt",
                        contents: "{{ local.requirements }}",
                    },
                },
                {
                    run: ["cp {{ get_file(\"requirements.txt\") }} /tmp/requirements.txt"],
                },
                {
                    run: ["python -m pip install --upgrade pip"],
                    condition: "local.upgrade_pip",
                },
                {
                    run: ["python -m pip install {{ local.pip_opts }} -r /tmp/requirements.txt"],
                },
                {
                    run: ["rm /tmp/requirements.txt"],
                    condition: "local.cleanup",
                },
            ],
        };

        it('should generate correct directives with all options enabled', () => {
            const args = {
                requirements: "numpy\nscipy\nmatplotlib",
                pip_opts: "--no-cache-dir --user",
                cleanup: true,
                upgrade_pip: true,
            };
            const result = processYamlGroup(pipRequirementsGroupDefinition, args);

            // Should have: file, run (copy), run (upgrade pip), run (install), run (cleanup)
            expect(result).toHaveLength(5);

            // Check upgrade pip directive
            const upgradeDirective = result.find(d => 'run' in d && Array.isArray(d.run) && d.run.some(cmd => cmd.includes('--upgrade pip')));
            expect(upgradeDirective?.run).toEqual(["python -m pip install --upgrade pip"]);

            // Check install directive
            const installDirective = result.find(d => 'run' in d && Array.isArray(d.run) && d.run.some(cmd => cmd.includes('--no-cache-dir --user')));
            expect(installDirective?.run).toEqual(["python -m pip install --no-cache-dir --user -r /tmp/requirements.txt"]);

            // Check cleanup directive
            const cleanupDirective = result.find(d => 'run' in d && Array.isArray(d.run) && d.run.some(cmd => cmd.includes('rm /tmp/requirements.txt')));
            expect(cleanupDirective?.run).toEqual(["rm /tmp/requirements.txt"]);
        });

        it('should skip optional commands when disabled', () => {
            const args = {
                requirements: "pandas",
                pip_opts: "",
                cleanup: false,
                upgrade_pip: false,
            };
            const result = processYamlGroup(pipRequirementsGroupDefinition, args);

            // Should have: file, run (copy), run (install)
            expect(result).toHaveLength(3);

            // Should not have upgrade pip or cleanup directives
            expect(result.find(d => 'run' in d && d.run.some(cmd => cmd.includes('--upgrade pip')))).toBeUndefined();
            expect(result.find(d => 'run' in d && d.run.some(cmd => cmd.includes('rm /tmp/requirements.txt')))).toBeUndefined();
        });
    });

    describe('Miniconda YAML group editor', () => {
        const minicondaYamlGroupDefinition = {
            metadata: {
                key: "minicondaYaml",
                label: "Miniconda Environment",
                description: "Install Miniconda and create environment from YAML file",
                icon: "DocumentDuplicate",
                color: "green",
                helpContent: "",
                helpPath: "copy/help/groups/miniconda-yaml-group.md",
                keywords: ["conda", "miniconda", "environment", "yaml", "packages"],
            },
            arguments: [
                {
                    name: "environment_yaml",
                    type: "text",
                    required: true,
                    defaultValue: "name: myenv\nchannels:\n  - conda-forge\ndependencies:\n  - python=3.9",
                    description: "YAML content for the conda environment specification.",
                },
                {
                    name: "environment_name",
                    type: "text",
                    required: false,
                    defaultValue: "myenv",
                    description: "Name of the conda environment to create. If not specified, uses name from YAML.",
                },
                {
                    name: "install_path",
                    type: "text",
                    required: false,
                    defaultValue: "/opt/miniconda",
                    description: "Path where Miniconda will be installed.",
                },
                {
                    name: "activate_env",
                    type: "boolean",
                    required: false,
                    defaultValue: true,
                    description: "Set the created environment as the default activated environment.",
                },
                {
                    name: "mamba",
                    type: "boolean",
                    required: false,
                    defaultValue: true,
                    description: "Use Mamba instead of Conda for faster package resolution and installation.",
                },
                {
                    name: "cleanup",
                    type: "boolean",
                    required: false,
                    defaultValue: true,
                    description: "Remove the environment.yml file after environment creation to reduce image size.",
                },
            ],
            directives: [
                {
                    variables: {
                        envName: "{{ local.environment_name }}",
                        envPath: "{{ local.install_path }}/envs/{{ local.environment_name }}",
                    },
                },
                {
                    file: {
                        name: "environment.yml",
                        contents: "{{ local.environment_yaml }}",
                    },
                },
                {
                    template: {
                        name: "miniconda",
                        version: "latest",
                        install_path: "{{ local.install_path }}",
                        mamba: "{{ local.mamba }}",
                    },
                },
                {
                    run: [
                        "cp {{ get_file(\"environment.yml\") }} /tmp/environment.yml",
                        "conda config --set channel_priority flexible",
                        "conda env create -f /tmp/environment.yml",
                    ],
                },
                {
                    run: ["rm /tmp/environment.yml"],
                    condition: "local.cleanup",
                },
                {
                    environment: {
                        CONDA_DEFAULT_ENV: "{{ local.envName }}",
                        PATH: "{{ local.envPath }}/bin:$PATH",
                    },
                    condition: "local.activate_env",
                },
                {
                    run: ["echo \"conda activate {{ local.envName }}\" >> ~/.bashrc"],
                    condition: "local.activate_env",
                },
            ],
        };

        it('should generate correct directives with all options enabled', () => {
            const args = {
                environment_yaml: "name: testenv\nchannels:\n  - conda-forge\ndependencies:\n  - python=3.9",
                environment_name: "testenv",
                install_path: "/opt/miniconda",
                activate_env: true,
                mamba: true,
                cleanup: true,
            };
            const result = processYamlGroup(minicondaYamlGroupDefinition, args);

            // Should have: file, template, run (create env), run (cleanup), environment, run (bashrc)
            expect(result).toHaveLength(6);

            // Check template directive
            const templateDirective = result.find(d => 'template' in d);
            expect(templateDirective?.template).toEqual({
                name: "miniconda",
                version: "latest",
                install_path: "/opt/miniconda",
                mamba: "true", // Boolean is converted to string by template interpolation
            });

            // Check environment directive
            const envDirective = result.find(d => 'environment' in d);
            expect(envDirective?.environment).toEqual({
                CONDA_DEFAULT_ENV: "testenv",
                PATH: "/opt/miniconda/envs/testenv/bin:$PATH",
            });

            // Check bashrc directive
            const bashrcDirective = result.find(d => 'run' in d && d.run.some(cmd => cmd.includes('bashrc')));
            expect(bashrcDirective?.run).toEqual(["echo \"conda activate testenv\" >> ~/.bashrc"]);
        });

        it('should skip environment setup when activate_env is false', () => {
            const args = {
                environment_yaml: "name: minimal\ndependencies:\n  - python",
                environment_name: "minimal",
                install_path: "/opt/conda",
                activate_env: false,
                mamba: false,
                cleanup: false,
            };
            const result = processYamlGroup(minicondaYamlGroupDefinition, args);

            // Should have: file, template, run (create env) - no environment or bashrc
            expect(result).toHaveLength(3);

            // Should not have environment or bashrc directives
            expect(result.find(d => 'environment' in d)).toBeUndefined();
            expect(result.find(d => 'run' in d && d.run.some(cmd => cmd.includes('bashrc')))).toBeUndefined();
            expect(result.find(d => 'run' in d && d.run.some(cmd => cmd.includes('rm /tmp/environment.yml')))).toBeUndefined();
        });
    });
});