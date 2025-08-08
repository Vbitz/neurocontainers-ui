import { DirectiveContainer, FormField, Select } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { HelpSection } from "@/components/ui/HelpSection";
import { IncludeMacro, IncludeMacros } from "@/components/common";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { registerDirective, DirectiveMetadata } from "./registry";
import includeHelpMarkdown from "@/copy/help/directives/include-directive.md";

export default function IncludeDirectiveComponent({
    include,
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
    include: IncludeMacro,
    onChange: (include: IncludeMacro) => void,
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
            markdownContent={includeHelpMarkdown} 
            sourceFilePath="copy/help/directives/include-directive.md"
        />
    );

    return (
        <DirectiveContainer
            title="Include"
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
            <FormField
                label="Macro"
                description="Select a predefined macro to include"
            >
                <Select
                    value={include}
                    onChange={documentationMode ? undefined : (e) => onChange(e.target.value as IncludeMacro)}
                    className="font-mono"
                    disabled={documentationMode}
                >
                    {Object.entries(IncludeMacros).map(([key, value]) => (
                        <option key={key} value={value}>
                            {value}
                        </option>
                    ))}
                </Select>
            </FormField>
        </DirectiveContainer>
    );
}

// Register this directive
export const includeDirectiveMetadata: DirectiveMetadata = {
    key: "include",
    label: "Include",
    description: "Include external macros or templates",
    icon: DocumentArrowDownIcon,
    color: { light: "bg-slate-50 border-slate-200 hover:bg-slate-100", dark: "bg-slate-900 border-slate-700 hover:bg-slate-800" },
    headerColor: { light: "bg-slate-50", dark: "bg-slate-900" },
    borderColor: { light: "border-slate-200", dark: "border-slate-700" },
    iconColor: { light: "text-slate-600", dark: "text-slate-400" },
    defaultValue: { include: "macros/openrecon/neurodocker.yaml" },
    keywords: ["include", "import", "external", "reference", "link"],
    component: IncludeDirectiveComponent,
};

registerDirective(includeDirectiveMetadata);