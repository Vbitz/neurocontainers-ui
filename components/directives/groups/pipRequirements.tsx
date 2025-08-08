import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { registerGroupEditor } from "../group";
import type { ComponentType } from "react";
import { HelpSection } from "@/components/ui/HelpSection";
import pipRequirementsGroupHelpMarkdown from "@/copy/help/groups/pip-requirements-group.md";

registerGroupEditor("pipRequirements", {
    metadata: {
        key: "pipRequirements",
        label: "Pip Requirements",
        description: "Install Python packages from requirements.txt file",
        icon: DocumentTextIcon,
        color: { light: "bg-blue-50 border-blue-200 hover:bg-blue-100", dark: "bg-blue-900 border-blue-700 hover:bg-blue-800" },
        iconColor: { light: "text-blue-600", dark: "text-blue-400" },
        defaultValue: {
            group: [],
            custom: "pipRequirements",
        },
        keywords: ["pip", "python", "requirements", "packages", "install"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component: undefined as unknown as ComponentType<any>, // Will be set by registerGroupEditor
    },
    helpContent() {
        return <HelpSection 
            markdownContent={pipRequirementsGroupHelpMarkdown} 
            sourceFilePath="copy/help/groups/pip-requirements-group.md"
        />;
    },
    arguments: [
        {
            name: "requirements",
            type: "text",
            required: true,
            defaultValue: "numpy==1.21.0\nscipy>=1.7.0\nmatplotlib",
            description: "Content of the requirements.txt file. Each line should contain a package specification.",
            multiline: true,
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
    updateDirective({ requirements, pip_opts, cleanup, upgrade_pip }) {
        const installCommands = [];
        
        if (upgrade_pip) {
            installCommands.push("python -m pip install --upgrade pip");
        }
        
        const pipCommand = `python -m pip install ${pip_opts || ""} -r /tmp/requirements.txt`.trim();
        installCommands.push(pipCommand);
        
        if (cleanup) {
            installCommands.push("rm /tmp/requirements.txt");
        }
        
        return {
            group: [
                {
                    file: {
                        name: "requirements.txt",
                        contents: requirements as string,
                    },
                },
                {
                    run: [
                        "cp {{ get_file(\"requirements.txt\") }} /tmp/requirements.txt",
                        ...installCommands,
                    ],
                },
            ],
            custom: "pipRequirements",
        }
    },
})