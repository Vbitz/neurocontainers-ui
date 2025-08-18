import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { registerGroupEditor } from "../group";
import type { ComponentType } from "react";
import { HelpSection } from "@/components/ui/HelpSection";
import gitCloneGroupHelpMarkdown from "@/copy/help/groups/git-clone-group.md";

registerGroupEditor("gitClone", {
    metadata: {
        key: "gitClone",
        label: "Git Clone",
        description: "Clone a git repository with optional revision/tag support",
        icon: DocumentDuplicateIcon,
        color: { light: "bg-orange-50 border-orange-200 hover:bg-orange-100", dark: "bg-orange-900 border-orange-700 hover:bg-orange-800" },
        iconColor: { light: "text-orange-600", dark: "text-orange-400" },
        defaultValue: {
            group: [],
            custom: "gitClone",
        },
        keywords: ["git", "clone", "repository", "version", "tag", "branch", "source"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component: undefined as unknown as ComponentType<any>, // Will be set by registerGroupEditor
    },
    helpContent() {
        return <HelpSection 
            markdownContent={gitCloneGroupHelpMarkdown} 
            sourceFilePath="copy/help/groups/git-clone-group.md"
        />;
    },
    arguments: [
        {
            name: "repository_url",
            type: "text",
            required: true,
            defaultValue: "https://github.com/user/repo.git",
            description: "URL of the git repository to clone (HTTPS or SSH).",
        },
        {
            name: "destination_path",
            type: "text",
            required: false,
            defaultValue: "/opt/repository",
            description: "Path where the repository will be cloned.",
        },
        {
            name: "revision",
            type: "text",
            required: false,
            defaultValue: "",
            description: "Specific branch, tag, or commit hash to checkout (optional).",
        },
        {
            name: "recursive",
            type: "boolean",
            required: false,
            defaultValue: false,
            description: "Clone recursively to include git submodules.",
        },
        {
            name: "cleanup_git",
            type: "boolean",
            required: false,
            defaultValue: false,
            description: "Remove the .git directory after cloning to reduce image size.",
        },
    ],
    updateDirective({ repository_url, destination_path, revision, recursive, cleanup_git }) {
        const commands = [];
        
        // Build the git clone command
        let cloneCommand = "git clone";
        if (recursive) {
            cloneCommand += " --recursive";
        }
        cloneCommand += ` "${repository_url}" "${destination_path}"`;
        commands.push(cloneCommand);
        
        // Checkout specific revision if provided
        if (revision && String(revision).trim()) {
            commands.push(`cd "${destination_path}" && git checkout "${String(revision).trim()}"`);
        }
        
        // Clean up .git directory if requested
        if (cleanup_git) {
            commands.push(`rm -rf "${destination_path}/.git"`);
        }
        
        return {
            group: [
                {
                    run: commands,
                },
            ],
            custom: "gitClone",
        }
    },
})