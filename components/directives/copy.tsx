import { DirectiveContainer, ListEditor, Input } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { HelpSection } from "@/components/ui/HelpSection";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { registerDirective, DirectiveMetadata } from "./registry";
import copyHelpMarkdown from "@/copy/help/directives/copy-directive.md";

export default function CopyDirectiveComponent({
    copy,
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
    copy: string[] | string,
    onChange: (copy: string[]) => void,
    condition?: string;
    onConditionChange?: (condition: string | undefined) => void;
    headerColor?: { light: string, dark: string };
    borderColor?: { light: string, dark: string };
    iconColor?: { light: string, dark: string };
    icon?: React.ComponentType<{ className?: string }>;
    controllers: DirectiveControllers;
    documentationMode?: boolean;
}) {
    const copyAsArray = Array.isArray(copy) ? copy : copy.split(" ");

    const helpContent = (
        <HelpSection 
            markdownContent={copyHelpMarkdown} 
            sourceFilePath="copy/help/directives/copy-directive.md"
        />
    );

    return (
        <DirectiveContainer
            title="Copy"
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
            <ListEditor
                items={copyAsArray}
                onChange={onChange}
                createNewItem={() => ""}
                addButtonText="Add Path"
                emptyMessage="No files or directories to copy."
                allowReorder={true}
                renderItem={(path, index, onChangePath) => (
                    <Input
                        value={path}
                        onChange={(e) => onChangePath(e.target.value)}
                        placeholder="source:destination"
                        monospace
                    />
                )}
            />
        </DirectiveContainer>
    );
}

// Register this directive
export const copyDirectiveMetadata: DirectiveMetadata = {
    key: "copy",
    label: "Copy",
    description: "Copy files and directories into the container",
    icon: DocumentIcon,
    color: { light: "bg-cyan-50 border-cyan-200 hover:bg-cyan-100", dark: "bg-cyan-900 border-cyan-700 hover:bg-cyan-800" },
    headerColor: { light: "bg-cyan-50", dark: "bg-cyan-900" },
    borderColor: { light: "border-cyan-200", dark: "border-cyan-700" },
    iconColor: { light: "text-cyan-600", dark: "text-cyan-400" },
    defaultValue: { copy: [] as string[] },
    keywords: ["copy", "file", "transfer", "duplicate", "move"],
    component: CopyDirectiveComponent,
};

registerDirective(copyDirectiveMetadata);