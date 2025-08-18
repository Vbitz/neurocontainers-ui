import { CubeIcon } from "@heroicons/react/24/outline";
import { registerGroupEditor } from "../group";
import type { ComponentType } from "react";
import { HelpSection } from "@/components/ui/HelpSection";
import pipInstallGroupHelpMarkdown from "@/copy/help/groups/pip-install-group.md";

registerGroupEditor("pipInstall", {
    metadata: {
        key: "pipInstall",
        label: "Pip Install",
        description: "Install Python packages with conda environment support",
        icon: CubeIcon,
        color: { light: "bg-purple-50 border-purple-200 hover:bg-purple-100", dark: "bg-purple-900 border-purple-700 hover:bg-purple-800" },
        iconColor: { light: "text-purple-600", dark: "text-purple-400" },
        defaultValue: {
            group: [],
            custom: "pipInstall",
        },
        keywords: ["pip", "python", "install", "conda", "environment", "packages"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component: undefined as unknown as ComponentType<any>, // Will be set by registerGroupEditor
    },
    helpContent() {
        return <HelpSection 
            markdownContent={pipInstallGroupHelpMarkdown} 
            sourceFilePath="copy/help/groups/pip-install-group.md"
        />;
    },
    arguments: [
        {
            name: "packages",
            type: "text",
            required: true,
            defaultValue: "numpy\nscipy\nmatplotlib",
            description: "Python packages to install. One package per line. Supports version specifications (e.g., numpy==1.21.0).",
            multiline: true,
        },
        {
            name: "conda_environment",
            type: "text",
            required: false,
            defaultValue: "",
            description: "Name of conda environment to install packages into (optional).",
        },
        {
            name: "pip_opts",
            type: "text",
            required: false,
            defaultValue: "--no-cache-dir",
            description: "Additional options to pass to pip install command.",
        },
        {
            name: "upgrade_pip",
            type: "boolean",
            required: false,
            defaultValue: true,
            description: "Upgrade pip to the latest version before installing packages.",
        },
        {
            name: "index_url",
            type: "text",
            required: false,
            defaultValue: "",
            description: "Custom PyPI index URL (e.g., for private repositories).",
            advanced: true,
        },
        {
            name: "extra_index_url",
            type: "text",
            required: false,
            defaultValue: "",
            description: "Additional PyPI index URL to search for packages.",
            advanced: true,
        },
    ],
    updateDirective({ packages, conda_environment, pip_opts, upgrade_pip, index_url, extra_index_url }) {
        const commands = [];
        
        // Build pip command with environment activation if specified
        const envPrefix = conda_environment && String(conda_environment).trim() 
            ? `conda run -n "${String(conda_environment).trim()}" ` 
            : "";
        
        // Upgrade pip if requested
        if (upgrade_pip) {
            commands.push(`${envPrefix}python -m pip install --upgrade pip`);
        }
        
        // Process packages - split by lines and filter out empty lines
        const packageList = String(packages || "")
            .split("\n")
            .map(pkg => pkg.trim())
            .filter(pkg => pkg.length > 0);
        
        if (packageList.length > 0) {
            // Build pip install command
            let pipCommand = `${envPrefix}python -m pip install`;
            
            // Add pip options
            if (pip_opts && String(pip_opts).trim()) {
                pipCommand += ` ${String(pip_opts).trim()}`;
            }
            
            // Add index URL options
            if (index_url && String(index_url).trim()) {
                pipCommand += ` --index-url "${String(index_url).trim()}"`;
            }
            
            if (extra_index_url && String(extra_index_url).trim()) {
                pipCommand += ` --extra-index-url "${String(extra_index_url).trim()}"`;
            }
            
            // Add packages
            pipCommand += ` ${packageList.join(" ")}`;
            
            commands.push(pipCommand);
        }
        
        return {
            group: [
                {
                    run: commands,
                },
            ],
            custom: "pipInstall",
        }
    },
})