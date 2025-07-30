import React, { useRef, useEffect, useState } from "react";
import { DirectiveContainer, ListEditor, Jinja2TemplateInput } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { PlayIcon } from "@heroicons/react/24/outline";
import { registerDirective, DirectiveMetadata } from "./registry";
import { textareaStyles, cn, getHelpSection } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

export default function RunCommandDirectiveComponent({
    run,
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
    run: string[];
    onChange: (run: string[]) => void;
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
    const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Update refs array when run array changes
    useEffect(() => {
        const runLength = Array.isArray(run) ? run.length : 0;
        textareaRefs.current = textareaRefs.current.slice(0, runLength);
    }, [run]);

    const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        // Use line height to calculate minimum height for single line
        const computedStyle = getComputedStyle(textarea);
        const lineHeight = parseInt(computedStyle.lineHeight) || 20; // leading-5 = 1.25 * 16px = 20px
        const paddingTop = parseInt(computedStyle.paddingTop) || 6; // py-1.5 = 6px
        const paddingBottom = parseInt(computedStyle.paddingBottom) || 6; // py-1.5 = 6px
        const borderTop = parseInt(computedStyle.borderTopWidth) || 0;
        const borderBottom = parseInt(computedStyle.borderBottomWidth) || 0;

        const minHeight = lineHeight + paddingTop + paddingBottom + borderTop + borderBottom;
        const newHeight = Math.max(minHeight, scrollHeight);

        textarea.style.height = newHeight + "px";
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
        index: number
    ) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            // Insert new command after current one
            const currentRun = Array.isArray(run) ? run : [];
            const newRun = [...currentRun];
            newRun.splice(index + 1, 0, "");
            onChange(newRun);

            // Focus the new textarea after it's rendered
            setTimeout(() => {
                textareaRefs.current[index + 1]?.focus();
            }, 0);
        }
    };


    // Adjust height on mount and when content changes
    useEffect(() => {
        textareaRefs.current.forEach((textarea) => {
            if (textarea) {
                adjustTextareaHeight(textarea);
            }
        });
    }, [run]);

    const helpContent = (
        <div className={getHelpSection(isDark).container}>
            <h3 className={getHelpSection(isDark).title}>
                RUN Directive
            </h3>
            <div className={getHelpSection(isDark).text}>
                <p>
                    The RUN instruction executes commands in a new layer on top
                    of the current image and commits the results. Supports Jinja2 templates for dynamic values.
                </p>
                <div>
                    <strong>Usage:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>All lines are concatenated together as a single Docker layer</li>
                        <li>Press Enter to add a new command</li>
                        <li>Press Shift+Enter for a new line within a command</li>
                        <li>Use Jinja2 syntax like {`{{ context.version }}`} for templating</li>
                        <li>Autocomplete available inside {`{{ }}`} and {`{% %}`} tags</li>
                        <li>Drag the handle to reorder commands</li>
                    </ul>
                </div>
                <div>
                    <strong>Autocomplete Navigation:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                        <li>↑/↓ arrows: Navigate suggestions</li>
                        <li>Tab/Enter: Accept selected suggestion</li>
                        <li>Escape: Close suggestions</li>
                        <li>Ctrl+Space: Trigger autocomplete</li>
                        <li>PageUp/PageDown: Jump 5 suggestions</li>
                        <li>Home/End: First/last suggestion</li>
                    </ul>
                </div>
                <div>
                    <strong>Examples:</strong>
                    <pre className={getHelpSection(isDark).code}>
                        {`mkdir -p /app/data
wget https://example.com/v{{ context.version }}/file.tar.gz
dpkg -i package_{{ context.version }}.deb`}
                    </pre>
                </div>
            </div>
        </div>
    );

    return (
        <DirectiveContainer
            title="Run Commands"
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
                items={Array.isArray(run) ? run : []}
                onChange={documentationMode ? () => {} : onChange}
                createNewItem={() => ""}
                addButtonText="Add Command"
                emptyMessage="No commands to run."
                allowReorder={true}
                focusedIndex={focusedIndex}
                readOnly={documentationMode}
                renderItem={(command, index, onChangeCommand) => (
                    <Jinja2TemplateInput
                        ref={(el) => { (textareaRefs.current[index] = el) }}
                        className={cn(
                            textareaStyles(isDark, {
                                monospace: true,
                                height: 'min-h-[2.5rem]'
                            }),
                            "border-0 rounded-none focus:ring-0 focus:border-transparent resize-none leading-5"
                        )}
                        value={command}
                        onChange={documentationMode ? () => {} : onChangeCommand}
                        onKeyDown={documentationMode ? undefined : (e) => handleKeyDown(e, index)}
                        onFocus={documentationMode ? undefined : () => setFocusedIndex(index)}
                        onBlur={documentationMode ? undefined : () => setFocusedIndex(null)}
                        placeholder="Command to run with Jinja2 templates (e.g., wget {{ context.version }})"
                        rows={1}
                        readOnly={documentationMode}
                    />
                )}
            />
        </DirectiveContainer>
    );
}

// Register this directive
export const runDirectiveMetadata: DirectiveMetadata = {
    key: "run",
    label: "Run Commands",
    description: "Execute shell commands during container build",
    icon: PlayIcon,
    color: { light: "bg-red-50 border-red-200 hover:bg-red-100", dark: "bg-red-900 border-red-700 hover:bg-red-800" },
    headerColor: { light: "bg-red-50", dark: "bg-red-900" },
    borderColor: { light: "border-red-200", dark: "border-red-700" },
    iconColor: { light: "text-red-600", dark: "text-red-400" },
    defaultValue: { run: [] as string[] },
    keywords: ["run", "command", "execute", "bash"],
    component: RunCommandDirectiveComponent,
};

registerDirective(runDirectiveMetadata);