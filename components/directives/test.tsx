import { DirectiveContainer, FormField, Input, Textarea } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { HelpSection } from "@/components/ui/HelpSection";
import { TestInfo, ScriptTest, BuiltinTest } from "@/components/common";
import { BeakerIcon } from "@heroicons/react/24/outline";
import { registerDirective, DirectiveMetadata } from "./registry";
import { cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";
import testHelpMarkdown from "@/copy/help/directives/test-directive.md";

export default function TestDirectiveComponent({
    test,
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
    test: TestInfo,
    onChange: (test: TestInfo) => void,
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
    const isBuiltin = 'builtin' in test;

    const updateName = (value: string) => {
        onChange({ ...test, name: value });
    };

    const updateScript = (value: string) => {
        if (!isBuiltin) {
            onChange({ ...test, script: value } as ScriptTest);
        }
    };

    const helpContent = (
        <HelpSection 
            markdownContent={testHelpMarkdown} 
            sourceFilePath="copy/help/directives/test-directive.md"
        />
    );

    const testTypeLabel = isBuiltin ? 'Builtin' : 'Script';
    const title = `Test: ${test.name} (${testTypeLabel})`;

    return (
        <DirectiveContainer
            title={title}
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
            <FormField label="Test Name">
                <Input
                    value={test.name}
                    onChange={documentationMode ? undefined : (e) => updateName(e.target.value)}
                    placeholder="Enter test name"
                    readOnly={documentationMode}
                />
            </FormField>

            <FormField
                label={isBuiltin ? 'Builtin Test Script' : 'Test Script'}
                description={isBuiltin ? 'This test uses a predefined builtin script' : 'Write your custom test script'}
            >
                {isBuiltin ? (
                    <div className={cn(
                        "px-3 py-1.5 border rounded-md font-mono text-sm",
                        isDark ? "border-[#2d4222] bg-[#161a0e] text-[#575c4e]" : "border-gray-200 bg-gray-50 text-gray-500"
                    )}>
                        {(test as BuiltinTest).builtin}
                    </div>
                ) : (
                    <Textarea
                        value={(test as ScriptTest).script}
                        onChange={documentationMode ? undefined : (e) => updateScript(e.target.value)}
                        placeholder="Enter test script commands..."
                        className="h-64"
                        monospace
                        readOnly={documentationMode}
                    />
                )}
            </FormField>
        </DirectiveContainer>
    );
}

// Register this directive
export const testDirectiveMetadata: DirectiveMetadata = {
    key: "test",
    label: "Test",
    description: "Define test scripts to validate container functionality",
    icon: BeakerIcon,
    color: { light: "bg-violet-50 border-violet-200 hover:bg-violet-100", dark: "bg-violet-900 border-violet-700 hover:bg-violet-800" },
    headerColor: { light: "bg-violet-50", dark: "bg-violet-900" },
    borderColor: { light: "border-violet-200", dark: "border-violet-700" },
    iconColor: { light: "text-violet-600", dark: "text-violet-400" },
    defaultValue: { test: { name: "", script: "" } },
    keywords: ["test", "testing", "validation", "check", "verify"],
    component: TestDirectiveComponent,
};

registerDirective(testDirectiveMetadata);