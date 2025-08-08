import { useState, useEffect } from "react";
import { DirectiveContainer, FormField, Input, Textarea, ToggleButtonGroup } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { HelpSection } from "@/components/ui/HelpSection";
import { FileInfo } from "@/components/common";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { registerDirective, DirectiveMetadata } from "./registry";
import fileHelpMarkdown from "@/copy/help/directives/file-directive.md";

export default function FileDirectiveComponent({
    file,
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
    file: FileInfo;
    onChange: (file: FileInfo) => void;
    condition?: string;
    onConditionChange?: (condition: string | undefined) => void;
    headerColor?: { light: string, dark: string };
    borderColor?: { light: string, dark: string };
    iconColor?: { light: string, dark: string };
    icon?: React.ComponentType<{ className?: string }>;
    controllers: DirectiveControllers;
    documentationMode?: boolean;
}) {
    const [fileContent, setFileContent] = useState(file.contents || "");

    // Determine input type based on file properties
    const getInputType: () => "content" | "url" | "filename" = () => {
        if (file.contents !== undefined) return "content";
        if (file.url !== undefined) return "url";
        return "filename";
    };

    const inputType = getInputType();

    useEffect(() => {
        // Update local state when file changes externally
        setFileContent(file.contents || "");
    }, [file.contents]);

    const updateName = (value: string) => {
        onChange({ ...file, name: value });
    };

    const updateFilename = (value: string) => {
        onChange({
            ...file,
            filename: value,
            contents: undefined,
            url: undefined,
        });
    };

    const updateContents = (value: string) => {
        setFileContent(value);
        onChange({
            ...file,
            contents: value,
            filename: undefined,
            url: undefined,
        });
    };

    const updateUrl = (value: string) => {
        onChange({
            ...file,
            url: value,
            contents: undefined,
            filename: undefined,
        });
    };

    const toggleInputType = (type: "content" | "filename" | "url") => {
        if (type === inputType) return;

        if (type === "content") {
            onChange({
                ...file,
                contents: fileContent,
                filename: undefined,
                url: undefined,
            });
        } else if (type === "filename") {
            onChange({
                ...file,
                contents: undefined,
                filename: file.filename || "",
                url: undefined,
            });
        } else if (type === "url") {
            onChange({
                ...file,
                contents: undefined,
                filename: undefined,
                url: file.url || "",
            });
        }
    };

    const helpContent = (
        <HelpSection 
            markdownContent={fileHelpMarkdown} 
            sourceFilePath="copy/help/directives/file-directive.md"
        />
    );

    return (
        <DirectiveContainer
            title={`File: ${file.name || 'Untitled'}`}
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
            <FormField label="Name">
                <Input
                    value={file.name}
                    onChange={documentationMode ? undefined : (e) => updateName(e.target.value)}
                    placeholder="Enter file name"
                    readOnly={documentationMode}
                />
            </FormField>

            <FormField label="File Source">
                <ToggleButtonGroup
                    options={[
                        { value: "content", label: "Enter Content" },
                        { value: "filename", label: "Provide Filename" },
                        { value: "url", label: "Provide URL" }
                    ]}
                    value={inputType}
                    onChange={documentationMode ? () => {} : (value) => toggleInputType(value as "content" | "filename" | "url")}
                />
            </FormField>

            {inputType === "content" ? (
                <FormField label="File Contents">
                    <Textarea
                        value={fileContent}
                        onChange={documentationMode ? undefined : (e) => updateContents(e.target.value)}
                        placeholder="Enter file contents here..."
                        className="min-h-[200px] w-full"
                        monospace
                        readOnly={documentationMode}
                    />
                </FormField>
            ) : inputType === "filename" ? (
                <FormField
                    label="Filename"
                    description="Enter the path to an existing file"
                >
                    <Input
                        value={file.filename || ""}
                        onChange={documentationMode ? undefined : (e) => updateFilename(e.target.value)}
                        placeholder="Path to the file"
                        monospace
                        readOnly={documentationMode}
                    />
                </FormField>
            ) : (
                <FormField
                    label="URL"
                    description="Enter a URL to reference a file from the web"
                >
                    <Input
                        value={file.url || ""}
                        onChange={documentationMode ? undefined : (e) => updateUrl(e.target.value)}
                        placeholder="https://example.com/file.txt"
                        readOnly={documentationMode}
                    />
                </FormField>
            )}
        </DirectiveContainer>
    );
}

// Register this directive
export const fileDirectiveMetadata: DirectiveMetadata = {
    key: "file",
    label: "File",
    description: "Create or manage files in the container",
    icon: ClipboardDocumentListIcon,
    color: { light: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100", dark: "bg-emerald-900 border-emerald-700 hover:bg-emerald-800" },
    headerColor: { light: "bg-emerald-50", dark: "bg-emerald-900" },
    borderColor: { light: "border-emerald-200", dark: "border-emerald-700" },
    iconColor: { light: "text-emerald-600", dark: "text-emerald-400" },
    defaultValue: { file: { name: "", filename: "" } },
    keywords: ["file", "create", "manage", "document", "content"],
    component: FileDirectiveComponent,
};

registerDirective(fileDirectiveMetadata);