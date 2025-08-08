import { useState, useEffect } from "react";
import { loadPackageDatabase } from "@/lib/packages";
import { DirectiveContainer, FormField, Select } from "@/components/ui";
import { DirectiveControllers } from "@/components/ui/DirectiveContainer";
import { HelpSection } from "@/components/ui/HelpSection";
import PackageTagEditor from "@/components/ui/PackageTagEditor";
import { CommandLineIcon } from "@heroicons/react/24/outline";
import { registerDirective, DirectiveMetadata } from "./registry";
import { cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";
import installHelpMarkdown from "@/copy/help/directives/install-directive.md";

type PackageManager = "system";

const packageManagers: { value: PackageManager; label: string }[] = [
    { value: "system", label: "System Package Manager" },
];

interface Package {
    name: string;
    description: string;
    version?: string;
    section?: string;
}

export default function InstallDirectiveComponent({
    install,
    baseImage,
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
    install: string | string[];
    baseImage: string;
    onChange: (install: string) => void;
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
    const [packages, setPackages] = useState<string[]>([]);
    const [packageManager, setPackageManager] = useState<PackageManager>("system");
    const [isLoadingDatabase, setIsLoadingDatabase] = useState(true);
    const [databaseLoaded, setDatabaseLoaded] = useState(false);
    const [packageDatabase, setPackageDatabase] = useState<Package[]>([]);

    // Parse the install string into individual packages
    useEffect(() => {
        if (typeof install === "string") {
            setPackages(install.split(/\s+/).filter((pkg) => pkg.trim() !== ""));
        } else if (Array.isArray(install)) {
            const allPackages = install.flatMap((pkg) =>
                pkg.split(/\s+/).filter((p) => p.trim() !== "")
            );
            setPackages(allPackages);
        } else {
            setPackages([]);
        }
    }, [install]);

    // Load database on mount
    useEffect(() => {
        const loadDatabase = async () => {
            setIsLoadingDatabase(true);
            try {
                const db = await loadPackageDatabase();
                setPackageDatabase(db);
                setDatabaseLoaded(true);
            } catch (error) {
                console.error("Failed to load package database:", error);
            } finally {
                setIsLoadingDatabase(false);
            }
        };

        loadDatabase();
    }, []);

    const updatePackages = (newPackages: string[]) => {
        const newInstallString = newPackages.join(" ");
        onChange(newInstallString);
    };

    const helpContent = (
        <HelpSection 
            markdownContent={installHelpMarkdown} 
            sourceFilePath="copy/help/directives/install-directive.md"
        />
    );

    return (
        <DirectiveContainer
            title="Install"
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
            <FormField label="Package Manager">
                <Select
                    value={packageManager}
                    disabled={true} // Disable for now, only system package manager supported
                    onChange={(e) => setPackageManager(e.target.value as PackageManager)}
                    className={cn("cursor-not-allowed", isDark ? "bg-[#2d4222] text-[#e8f5d0]" : "text-gray-500 bg-gray-100")}
                >
                    {packageManagers.map((pm) => (
                        <option key={pm.value} value={pm.value}>
                            {pm.label}
                        </option>
                    ))}
                </Select>
            </FormField>

            <PackageTagEditor
                packages={packages}
                onChange={documentationMode ? () => {} : updatePackages}
                packageDatabase={packageDatabase}
                databaseLoaded={databaseLoaded}
                isLoadingDatabase={isLoadingDatabase}
                baseImage={baseImage}
                readOnly={documentationMode}
            />
        </DirectiveContainer>
    );
}

// Register this directive
export const installDirectiveMetadata: DirectiveMetadata = {
    key: "install",
    label: "Install",
    description: "Install packages or dependencies",
    icon: CommandLineIcon,
    color: { light: "bg-purple-50 border-purple-200 hover:bg-purple-100", dark: "bg-purple-900 border-purple-700 hover:bg-purple-800" },
    headerColor: { light: "bg-purple-50", dark: "bg-purple-900" },
    borderColor: { light: "border-purple-200", dark: "border-purple-700" },
    iconColor: { light: "text-purple-600", dark: "text-purple-400" },
    defaultValue: { install: "" },
    keywords: ["install", "package", "dependency", "apt", "yum", "npm"],
    component: InstallDirectiveComponent,
};

registerDirective(installDirectiveMetadata);