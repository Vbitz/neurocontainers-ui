import { FolderIcon } from "@heroicons/react/24/outline";
import { registerGroupEditor } from "../group";
import type { ComponentType } from "react";
import type { GroupEditorArgument } from "../group";
import { HelpSection } from "@/components/ui/HelpSection";
import shellScriptGroupHelpMarkdown from "@/copy/help/groups/shell-script-group.md";
import { processYamlGroup, YamlGroup } from "@/lib/yamlGroupEditor";

// Define the YAML-based Shell Script group
const shellScriptGroupDefinition: YamlGroup = {
    metadata: {
        key: "shellScript",
        label: "Shell Script",
        description: "Create a shell script",
        icon: "Folder",
        color: "gray",
        helpContent: shellScriptGroupHelpMarkdown,
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

// Register the group using the new YAML-based system
registerGroupEditor("shellScript", {
    metadata: {
        key: "shellScript",
        label: "Shell Script",
        description: "Create a shell script",
        icon: FolderIcon,
        color: { light: "bg-gray-50 border-gray-200 hover:bg-gray-100", dark: "bg-gray-900 border-gray-700 hover:bg-gray-800" },
        iconColor: { light: "text-gray-600", dark: "text-gray-400" },
        defaultValue: {
            group: [],
            custom: "shellScript",
        },
        keywords: ["shell", "script", "bash", "sh", "executable"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component: undefined as unknown as ComponentType<any>, // Will be set by registerGroupEditor
    },
    helpContent() {
        return <HelpSection 
            markdownContent={shellScriptGroupHelpMarkdown} 
            sourceFilePath="copy/help/groups/shell-script-group.md"
        />;
    },
    arguments: shellScriptGroupDefinition.arguments.map(arg => ({
        ...arg,
        type: arg.type as "dropdown" | "text" | "array" | "boolean",
        multiline: arg.name === "content" ? true : undefined,
    })) as GroupEditorArgument[],
    updateDirective(args: Record<string, unknown>) {
        // Use the new YAML processor to generate directives
        const directives = processYamlGroup(shellScriptGroupDefinition, args);
        
        return {
            group: directives,
            custom: "shellScript",
        };
    },
})