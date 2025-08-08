import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { registerGroupEditor } from "../group";
import type { ComponentType } from "react";
import { HelpSection } from "@/components/ui/HelpSection";
import minicondaYamlGroupHelpMarkdown from "@/copy/help/groups/miniconda-yaml-group.md";
import type { Directive } from "@/components/common";

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
            multiline: true,
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
    updateDirective({ environment_yaml, environment_name, install_path, activate_env, mamba, cleanup }) {
        const envName = environment_name as string || "myenv";
        const solver = mamba ? "mamba" : "conda";
        
        const createCommands = [
            "cp {{ get_file(\"environment.yml\") }} /tmp/environment.yml",
            `${solver} env create -f /tmp/environment.yml`,
        ];
        
        if (cleanup) {
            createCommands.push("rm /tmp/environment.yml");
        }
        
        const directives: Directive[] = [
            {
                file: {
                    name: "environment.yml",
                    contents: environment_yaml as string,
                },
            },
            {
                template: {
                    name: "miniconda",
                    version: "latest",
                    install_path: install_path as string,
                    mamba: mamba as boolean,
                },
            },
            {
                run: createCommands,
            },
        ];
        
        if (activate_env) {
            directives.push({
                environment: {
                    CONDA_DEFAULT_ENV: envName,
                    PATH: `${install_path}/envs/${envName}/bin:$PATH`,
                },
            });
            
            directives.push({
                run: [
                    `echo "conda activate ${envName}" >> ~/.bashrc`,
                ],
            });
        }
        
        return {
            group: directives,
            custom: "minicondaYaml",
        }
    },
})