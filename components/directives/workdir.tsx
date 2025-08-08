import { DirectiveContainer, Input } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { HelpSection } from "@/components/ui/HelpSection";
import { FolderOpenIcon } from "@heroicons/react/24/outline";
import { registerDirective, DirectiveMetadata } from "./registry";
import workdirHelpMarkdown from "@/copy/help/directives/workdir-directive.md";

export default function WorkingDirectoryDirectiveComponent({
    workdir,
    onChange,
    condition,
    onConditionChange,
    headerColor,
    borderColor,
    iconColor,
    icon,
    controllers,
    documentationMode = false,
}: {
    workdir: string,
    onChange: (workdir: string) => void,
    condition?: string;
    onConditionChange?: (condition: string | undefined) => void;
    headerColor?: { light: string, dark: string };
    borderColor?: { light: string, dark: string };
    iconColor?: { light: string, dark: string };
    icon?: React.ComponentType<{ className?: string }>;
    controllers: DirectiveControllers;
    documentationMode?: boolean;
}) {
    const helpContent = (
        <HelpSection 
            markdownContent={workdirHelpMarkdown} 
            sourceFilePath="copy/help/directives/workdir-directive.md"
        />
    );

    return (
        <DirectiveContainer
            title="Working Directory"
            helpContent={helpContent}
            condition={condition}
            onConditionChange={onConditionChange}
            headerColor={headerColor}
            borderColor={borderColor}
            iconColor={iconColor}
            icon={icon}
            controllers={controllers}
            documentationMode={documentationMode}
        >
            <Input
                value={workdir}
                onChange={documentationMode ? undefined : (e) => onChange(e.target.value)}
                placeholder="/path/to/directory"
                monospace
                readOnly={documentationMode}
            />
        </DirectiveContainer>
    );
}

// Register this directive
export const workdirDirectiveMetadata: DirectiveMetadata = {
    key: "workdir",
    label: "Working Directory",
    description: "Set the working directory for subsequent commands",
    icon: FolderOpenIcon,
    color: { light: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100", dark: "bg-yellow-900 border-yellow-700 hover:bg-yellow-800" },
    headerColor: { light: "bg-yellow-50", dark: "bg-yellow-900" },
    borderColor: { light: "border-yellow-200", dark: "border-yellow-700" },
    iconColor: { light: "text-yellow-600", dark: "text-yellow-400" },
    defaultValue: { workdir: "" },
    keywords: ["workdir", "directory", "folder", "path", "cd"],
    component: WorkingDirectoryDirectiveComponent,
};

registerDirective(workdirDirectiveMetadata);