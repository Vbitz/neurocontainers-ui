import { DirectiveContainer } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { HelpSection } from "@/components/ui/HelpSection";
import { CogIcon } from "@heroicons/react/24/outline";
import { registerDirective, DirectiveMetadata } from "./registry";
import DeployEnvEditor from "../ui/DeployEnvEditor";
import environmentHelpMarkdown from "@/copy/help/directives/environment-directive.md";

export default function EnvironmentDirectiveComponent({
    environment,
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
    environment: { [key: string]: string },
    onChange: (environment: { [key: string]: string }) => void
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
            markdownContent={environmentHelpMarkdown} 
            sourceFilePath="copy/help/directives/environment-directive.md"
        />
    );

    return (
        <DirectiveContainer
            title="Environment Variables"
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
            <DeployEnvEditor
                data={environment}
                onChange={documentationMode ? () => {} : onChange}
                readOnly={documentationMode}
            />
        </DirectiveContainer>
    );
}

// Register this directive
export const environmentDirectiveMetadata: DirectiveMetadata = {
    key: "environment",
    label: "Environment",
    description: "Set environment variables",
    icon: CogIcon,
    color: { light: "bg-green-50 border-green-200 hover:bg-green-100", dark: "bg-green-900 border-green-700 hover:bg-green-800" },
    headerColor: { light: "bg-green-50", dark: "bg-green-900" },
    borderColor: { light: "border-green-200", dark: "border-green-700" },
    iconColor: { light: "text-green-600", dark: "text-green-400" },
    defaultValue: { environment: {} },
    keywords: ["environment", "env", "variables", "config", "settings"],
    component: EnvironmentDirectiveComponent,
};

registerDirective(environmentDirectiveMetadata);
