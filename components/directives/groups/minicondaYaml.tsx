import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { registerGroupEditor } from "../group";
import type { ComponentType } from "react";
import type { GroupEditorArgument } from "../group";
import { HelpSection } from "@/components/ui/HelpSection";
import minicondaYamlGroupHelpMarkdown from "@/copy/help/groups/miniconda-yaml-group.md";
import { processYamlGroup, YamlGroup } from "@/lib/yamlGroupEditor";

// Define the YAML-based Miniconda Environment group
const minicondaYamlGroupDefinition: YamlGroup = {
    metadata: {
        key: "minicondaYaml",
        label: "Miniconda Environment",
        description: "Install Miniconda and create environment from YAML file",
        icon: "DocumentDuplicate",
        color: "green",
        helpContent: minicondaYamlGroupHelpMarkdown,
        helpPath: "copy/help/groups/miniconda-yaml-group.md",
        keywords: ["conda", "miniconda", "environment", "yaml", "packages"],
    },
    arguments: [
        {
            name: "environment_yaml",
            type: "text",
            required: true,
            defaultValue: `name: myenv
channels:
  - conda-forge
  - defaults
dependencies:
  - python=3.9
  - numpy
  - scipy
  - matplotlib
  - pip
  - pip:
    - nibabel
    - nilearn`,
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

// Register the group using the new YAML-based system
registerGroupEditor("minicondaYaml", {
    metadata: {
        key: "minicondaYaml",
        label: "Miniconda Environment",
        description: "Install Miniconda and create environment from YAML file",
        icon: DocumentDuplicateIcon,
        color: { light: "bg-green-50 border-green-200 hover:bg-green-100", dark: "bg-green-900 border-green-700 hover:bg-green-800" },
        iconColor: { light: "text-green-600", dark: "text-green-400" },
        defaultValue: {
            group: [],
            custom: "minicondaYaml",
        },
        keywords: ["conda", "miniconda", "environment", "yaml", "packages"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component: undefined as unknown as ComponentType<any>, // Will be set by registerGroupEditor
    },
    helpContent() {
        return <HelpSection
            markdownContent={minicondaYamlGroupHelpMarkdown}
            sourceFilePath="copy/help/groups/miniconda-yaml-group.md"
        />;
    },
    arguments: minicondaYamlGroupDefinition.arguments.map(arg => ({
        ...arg,
        type: arg.type as "dropdown" | "text" | "array" | "boolean",
        multiline: arg.name === "environment_yaml" ? true : undefined,
    })) as GroupEditorArgument[],
    updateDirective(args: Record<string, unknown>) {
        // Use the new YAML processor to generate directives
        const directives = processYamlGroup(minicondaYamlGroupDefinition, args);
        
        return {
            group: directives,
            custom: "minicondaYaml",
        };
    },
})