import { DirectiveContainer, FormField, TagEditor } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { HelpSection } from "@/components/ui/HelpSection";
import { DeployInfo } from "@/components/common";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { registerDirective, DirectiveMetadata } from "./registry";
import deployHelpMarkdown from "@/copy/help/directives/deploy-directive.md";

export default function DeployDirectiveComponent({
    deploy,
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
    deploy: DeployInfo;
    onChange: (deploy: DeployInfo) => void;
    condition?: string;
    onConditionChange?: (condition: string | undefined) => void;
    headerColor?: { light: string, dark: string };
    borderColor?: { light: string, dark: string };
    iconColor?: { light: string, dark: string };
    icon?: React.ComponentType<{ className?: string }>;
    controllers: DirectiveControllers;
    documentationMode?: boolean;
}) {
    const updatePaths = (paths: string[]) => {
        onChange({
            ...deploy,
            path: paths,
        });
    };

    const updateBins = (bins: string[]) => {
        onChange({
            ...deploy,
            bins: bins,
        });
    };

    const helpContent = (
        <HelpSection 
            markdownContent={deployHelpMarkdown} 
            sourceFilePath="copy/help/directives/deploy-directive.md"
        />
    );

    return (
        <DirectiveContainer
            title="Deploy"
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
                label="Paths"
                description="Add directories to include in deployment"
            >
                <TagEditor
                    tags={deploy.path || []}
                    onChange={documentationMode ? () => {} : updatePaths}
                    placeholder="Add a path..."
                    emptyMessage="No paths added yet"
                />
            </FormField>

            <FormField
                label="Binaries"
                description="Add specific executable files to deploy"
            >
                <TagEditor
                    tags={deploy.bins || []}
                    onChange={documentationMode ? () => {} : updateBins}
                    placeholder="Add a binary..."
                    emptyMessage="No binaries added yet"
                />
            </FormField>
        </DirectiveContainer>
    );
}

// Register this directive
export const deployDirectiveMetadata: DirectiveMetadata = {
    key: "deploy",
    label: "Deploy",
    description: "Configure deployment settings for the container",
    icon: RocketLaunchIcon,
    color: { light: "bg-orange-50 border-orange-200 hover:bg-orange-100", dark: "bg-orange-900 border-orange-700 hover:bg-orange-800" },
    headerColor: { light: "bg-orange-50", dark: "bg-orange-900" },
    borderColor: { light: "border-orange-200", dark: "border-orange-700" },
    iconColor: { light: "text-orange-600", dark: "text-orange-400" },
    defaultValue: { deploy: { path: [] as string[], bins: [] as string[] } },
    keywords: ["deploy", "deployment", "publish", "release", "launch"],
    component: DeployDirectiveComponent,
};

registerDirective(deployDirectiveMetadata);
