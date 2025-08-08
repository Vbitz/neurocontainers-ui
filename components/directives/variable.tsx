import { DirectiveContainer, FormField, Input, Textarea, ListEditor } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { HelpSection } from "@/components/ui/HelpSection";
import { Variable } from "@/components/common";
import { TrashIcon, CubeTransparentIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { registerDirective, DirectiveMetadata } from "./registry";
import { cn, useThemeStyles, buttonStyles } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";
import variableHelpMarkdown from "@/copy/help/directives/variable-directive.md";

export function VariableComponent({ variable, onChange, documentationMode = false }: { variable: Variable, onChange?: (variable: Variable) => void, documentationMode?: boolean }) {
    const { isDark } = useTheme();

    if (typeof variable === 'string') {
        return (
            <Input
                value={variable}
                onChange={documentationMode ? undefined : (e) => onChange && onChange(e.target.value)}
                monospace
                placeholder="Enter string value"
                readOnly={documentationMode}
            />
        );
    } else if (Array.isArray(variable)) {
        const stringArray = variable.map(item => JSON.stringify(item));

        const handleArrayChange = (newStringArray: string[]) => {
            if (onChange) {
                try {
                    const parsed = newStringArray.map(str => JSON.parse(str));
                    onChange(parsed);
                } catch {
                    // Handle parse error - keep as strings for now
                    onChange(newStringArray);
                }
            }
        };

        return (
            <ListEditor
                items={stringArray}
                onChange={documentationMode ? () => {} : handleArrayChange}
                createNewItem={() => '""'}
                addButtonText="Add Item"
                emptyMessage="No array items"
                allowReorder={true}
                readOnly={documentationMode}
                renderItem={(item, index, onChangeItem) => (
                    <Input
                        value={item}
                        onChange={documentationMode ? undefined : (e) => onChangeItem(e.target.value)}
                        placeholder="JSON value"
                        monospace
                        readOnly={documentationMode}
                    />
                )}
            />
        );
    } else {
        return (
            <Textarea
                value={JSON.stringify(variable, null, 2)}
                onChange={documentationMode ? undefined : (e) => {
                    if (onChange) {
                        try {
                            onChange(JSON.parse(e.target.value));
                        } catch {
                            // Handle parse error silently for now
                        }
                    }
                }}
                readOnly={documentationMode}
                placeholder="Enter JSON object"
                className={cn(
                    "w-full min-h-[80px] px-3 py-2",
                    "border rounded-md",
                    isDark
                        ? "border-gray-700 bg-gray-800 text-gray-200"
                        : "border-gray-200 bg-white text-gray-900",
                    "focus:outline-none focus:ring-1 focus:ring-[#6aa329] focus:border-[#6aa329]",
                    "resize-none font-mono text-sm",
                )}
            />
        );
    }
}

export default function VariableDirectiveComponent({
    variables,
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
    variables: { [key: string]: Variable },
    onChange: (variables: { [key: string]: Variable }) => void,
    condition?: string;
    onConditionChange?: (condition: string | undefined) => void;
    headerColor?: { light: string, dark: string };
    borderColor?: { light: string, dark: string };
    iconColor?: { light: string, dark: string };
    icon?: React.ComponentType<{ className?: string }>;
    controllers: DirectiveControllers;
    documentationMode?: boolean;
}) {
    const { isDark } = useTheme();
    const styles = useThemeStyles(isDark);
    const [newVarKey, setNewVarKey] = useState("");

    const updateVariable = (key: string, value: Variable) => {
        onChange({ ...variables, [key]: value });
    };

    const removeVariable = (key: string) => {
        const updated = { ...variables };
        delete updated[key];
        onChange(updated);
    };

    const addVariable = () => {
        if (newVarKey.trim()) {
            onChange({ ...variables, [newVarKey]: "" });
            setNewVarKey("");
        }
    };

    const helpContent = (
        <HelpSection 
            markdownContent={variableHelpMarkdown} 
            sourceFilePath="copy/help/directives/variable-directive.md"
        />
    );

    return (
        <DirectiveContainer
            title="Variables"
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
            {Object.entries(variables).map(([key, value]) => (
                <FormField
                    key={key}
                    label={
                        <div className="flex justify-between items-center">
                            <span>{key}</span>
                            <button
                                className={cn(styles.buttons.icon, "ml-2")}
                                onClick={documentationMode ? undefined : () => removeVariable(key)}
                                title={`Remove variable ${key}`}
                                disabled={documentationMode}
                            >
                                <TrashIcon className={styles.icon("sm")} />
                            </button>
                        </div>
                    }
                    className="border-l-4 border-[#d3e7b6] pl-4"
                >
                    <VariableComponent
                        variable={value}
                        onChange={documentationMode ? undefined : (updated) => updateVariable(key, updated)}
                        documentationMode={documentationMode}
                    />
                </FormField>
            ))}

            <FormField label="Add New Variable">
                <div className="flex">
                    <Input
                        className="rounded-r-none"
                        placeholder="Variable name"
                        value={newVarKey}
                        onChange={documentationMode ? undefined : (e) => setNewVarKey(e.target.value)}
                        onKeyDown={documentationMode ? undefined : (e) => e.key === 'Enter' && addVariable()}
                        readOnly={documentationMode}
                    />
                    <button
                        className={cn(
                            buttonStyles(isDark, 'primary', 'md'),
                            "rounded-l-none rounded-r-md min-h-[44px] md:min-h-[auto]",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        onClick={documentationMode ? undefined : addVariable}
                        disabled={documentationMode || !newVarKey.trim()}
                    >
                        Add
                    </button>
                </div>
            </FormField>
        </DirectiveContainer>
    );
}

// Register this directive
export const variablesDirectiveMetadata: DirectiveMetadata = {
    key: "variables",
    label: "Variables",
    description: "Define template variables for dynamic values",
    icon: CubeTransparentIcon,
    color: { light: "bg-green-50 border-green-200 hover:bg-green-100", dark: "bg-green-900 border-green-700 hover:bg-green-800" },
    headerColor: { light: "bg-green-50", dark: "bg-green-900" },
    borderColor: { light: "border-green-200", dark: "border-green-700" },
    iconColor: { light: "text-green-600", dark: "text-green-400" },
    defaultValue: { variables: {} },
    keywords: ["variables", "var", "template", "placeholder", "substitution"],
    component: VariableDirectiveComponent,
};

registerDirective(variablesDirectiveMetadata);