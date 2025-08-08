import { DirectiveContainer, Input } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { HelpSection } from "@/components/ui/HelpSection";
import { UserIcon } from "@heroicons/react/24/outline";
import { registerDirective, DirectiveMetadata } from "./registry";
import userHelpMarkdown from "@/copy/help/directives/user-directive.md";

export default function UserDirectiveComponent({
    user,
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
    user: string,
    onChange: (user: string) => void,
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
            markdownContent={userHelpMarkdown} 
            sourceFilePath="copy/help/directives/user-directive.md"
        />
    );

    return (
        <DirectiveContainer
            title="User"
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
                value={user}
                onChange={documentationMode ? undefined : (e) => onChange(e.target.value)}
                placeholder="username or UID"
                monospace
                readOnly={documentationMode}
            />
        </DirectiveContainer>
    );
}

// Register this directive
export const userDirectiveMetadata: DirectiveMetadata = {
    key: "user",
    label: "User",
    description: "Set the user context for subsequent commands",
    icon: UserIcon,
    color: { light: "bg-teal-50 border-teal-200 hover:bg-teal-100", dark: "bg-teal-900 border-teal-700 hover:bg-teal-800" },
    headerColor: { light: "bg-teal-50", dark: "bg-teal-900" },
    borderColor: { light: "border-teal-200", dark: "border-teal-700" },
    iconColor: { light: "text-teal-600", dark: "text-teal-400" },
    defaultValue: { user: "" },
    keywords: ["user", "account", "permission", "context", "identity"],
    component: UserDirectiveComponent,
};

registerDirective(userDirectiveMetadata);