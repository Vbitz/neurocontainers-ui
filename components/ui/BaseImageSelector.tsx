import { useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { getThemePresets, iconStyles, textStyles, cn } from "@/lib/styles";
import { HelpSection } from "@/components/ui/HelpSection";
import baseImageSelectorHelpMarkdown from "@/copy/help/ui/base-image-selector.md";
import packageManagerHelpMarkdown from "@/copy/help/ui/package-manager.md";
import { useTheme } from "@/lib/ThemeContext";

const UBUNTU_VERSIONS = [
    { value: "ubuntu:24.04", label: "Ubuntu 24.04 LTS (Noble Numbat)" },
    { value: "ubuntu:22.04", label: "Ubuntu 22.04 LTS (Jammy Jellyfish)" },
    { value: "ubuntu:20.04", label: "Ubuntu 20.04 LTS (Focal Fossa)" },
    { value: "ubuntu:18.04", label: "Ubuntu 18.04 LTS (Bionic Beaver)" },
];

const OTHER_BASE_IMAGES = [
    { value: "neurodebian:jammy-non-free", label: "NeuroDebian Jammy Non-Free", pkgManager: "apt" },
    { value: "neurodebian:bullseye-non-free", label: "NeuroDebian Bullseye Non-Free", pkgManager: "apt" },
    { value: "neurodebian:bookworm-non-free", label: "NeuroDebian Bookworm Non-Free", pkgManager: "apt" },
    { value: "debian:12", label: "Debian 12 (Bookworm)", pkgManager: "apt" },
    { value: "debian:11", label: "Debian 11 (Bullseye)", pkgManager: "apt" },
    { value: "centos:8", label: "CentOS 8", pkgManager: "yum" },
    { value: "fedora:39", label: "Fedora 39", pkgManager: "yum" },
];

const LATEST_UBUNTU_VERSION = "ubuntu:24.04";

type BaseImageSource = "ubuntu" | "other" | "custom";

interface BaseImageSelectorProps {
    baseImage: string;
    pkgManager: string;
    addDefaultTemplate?: boolean;
    onChange: (baseImage: string, pkgManager: string) => void;
    onAddDefaultTemplateChange?: (addDefaultTemplate: boolean) => void;
}

export default function BaseImageSelector({
    baseImage,
    pkgManager,
    addDefaultTemplate = true,
    onChange,
    onAddDefaultTemplateChange,
}: BaseImageSelectorProps) {
    const { isDark } = useTheme();
    const [showBaseImageHelp, setShowBaseImageHelp] = useState(false);
    const [showPkgManagerHelp, setShowPkgManagerHelp] = useState(false);

    // Determine current base image source
    const getBaseImageSource = (): BaseImageSource => {
        if (UBUNTU_VERSIONS.some((img) => img.value === baseImage)) {
            return "ubuntu";
        } else if (OTHER_BASE_IMAGES.some((img) => img.value === baseImage)) {
            return "other";
        } else {
            return "custom";
        }
    };

    const baseImageSource = getBaseImageSource();

    const handleBaseImageSourceChange = (source: BaseImageSource) => {
        // Set default base image and package manager based on source
        if (source === "ubuntu") {
            onChange(LATEST_UBUNTU_VERSION, "apt");
        } else if (source === "other") {
            const defaultImage = OTHER_BASE_IMAGES[0];
            onChange(defaultImage.value, defaultImage.pkgManager);
        } else {
            onChange("", "apt");
        }
    };

    const handleBaseImageSelect = (value: string) => {
        // Auto-set package manager based on selected image
        if (baseImageSource === "ubuntu") {
            onChange(value, "apt");
        } else if (baseImageSource === "other") {
            const selectedImage = OTHER_BASE_IMAGES.find((img) => img.value === value);
            if (selectedImage) {
                onChange(value, selectedImage.pkgManager);
            }
        }
    };

    const handleCustomBaseImageChange = (value: string) => {
        onChange(value, pkgManager);
    };



    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
                <label className={getThemePresets(isDark).formLabel}>Base Image</label>
                <button
                    type="button"
                    className={cn(
                        "p-1 transition-colors",
                        iconStyles(isDark, 'sm', 'primary'),
                        isDark
                            ? "hover:text-[#7bb33a]"
                            : "hover:text-[#6aa329]",
                        showBaseImageHelp && (isDark ? "text-[#7bb33a]" : "text-[#6aa329]")
                    )}
                    onClick={() => setShowBaseImageHelp(!showBaseImageHelp)}
                    title={showBaseImageHelp ? "Hide documentation" : "Show documentation"}
                >
                    <InformationCircleIcon className={iconStyles(isDark, 'sm')} />
                </button>
            </div>

            {showBaseImageHelp && (
                <HelpSection 
                    markdownContent={baseImageSelectorHelpMarkdown} 
                    sourceFilePath="copy/help/ui/base-image-selector.md"
                    className="mb-6" 
                />
            )}

            {/* Base Image Source Selection */}
            <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="relative group">
                        <input
                            type="radio"
                            name="baseImageSource"
                            value="ubuntu"
                            checked={baseImageSource === "ubuntu"}
                            onChange={() => handleBaseImageSourceChange("ubuntu")}
                            className="sr-only"
                        />
                        <div
                            className={cn(
                                "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 h-full",
                                baseImageSource === "ubuntu"
                                    ? (isDark
                                        ? "border-[#7bb33a] bg-[#1f2e18] shadow-md ring-2 ring-[#7bb33a]/20"
                                        : "border-[#6aa329] bg-[#f0f7e7] shadow-md ring-2 ring-[#6aa329]/20")
                                    : (isDark
                                        ? "border-[#374151] hover:border-[#7bb33a]/50 hover:bg-[#2d4222] group-hover:shadow-sm"
                                        : "border-gray-200 hover:border-[#6aa329]/50 hover:bg-gray-50 group-hover:shadow-sm")
                            )}
                        >
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                        baseImageSource === "ubuntu"
                                            ? (isDark ? "border-[#7bb33a] bg-[#7bb33a]" : "border-[#6aa329] bg-[#6aa329]")
                                            : (isDark ? "border-[#6b7280]" : "border-gray-300")
                                    )}
                                >
                                    {baseImageSource === "ubuntu" && (
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <div>
                                    <div className={textStyles(isDark, { size: 'sm', weight: 'semibold', color: 'primary' })}>Ubuntu LTS</div>
                                    <div className={textStyles(isDark, { size: 'xs', color: 'muted' })}>
                                        Long-term support
                                        <br />
                                        <span className={cn(
                                            "font-medium",
                                            isDark ? "text-[#7bb33a]" : "text-[#6aa329]"
                                        )}>
                                            (Recommended)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </label>

                    <label className="relative group">
                        <input
                            type="radio"
                            name="baseImageSource"
                            value="other"
                            checked={baseImageSource === "other"}
                            onChange={() => handleBaseImageSourceChange("other")}
                            className="sr-only"
                        />
                        <div
                            className={cn(
                                "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 h-full",
                                baseImageSource === "other"
                                    ? (isDark
                                        ? "border-[#7bb33a] bg-[#1f2e18] shadow-md ring-2 ring-[#7bb33a]/20"
                                        : "border-[#6aa329] bg-[#f0f7e7] shadow-md ring-2 ring-[#6aa329]/20")
                                    : (isDark
                                        ? "border-[#374151] hover:border-[#7bb33a]/50 hover:bg-[#2d4222] group-hover:shadow-sm"
                                        : "border-gray-200 hover:border-[#6aa329]/50 hover:bg-gray-50 group-hover:shadow-sm")
                            )}
                        >
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                        baseImageSource === "other"
                                            ? (isDark ? "border-[#7bb33a] bg-[#7bb33a]" : "border-[#6aa329] bg-[#6aa329]")
                                            : (isDark ? "border-[#6b7280]" : "border-gray-300")
                                    )}
                                >
                                    {baseImageSource === "other" && (
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <div>
                                    <div className={textStyles(isDark, { size: 'sm', weight: 'semibold', color: 'primary' })}>Other Distros</div>
                                    <div className={textStyles(isDark, { size: 'xs', color: 'muted' })}>
                                        Debian, CentOS
                                        <br />
                                        Fedora
                                    </div>
                                </div>
                            </div>
                        </div>
                    </label>

                    <label className="relative group">
                        <input
                            type="radio"
                            name="baseImageSource"
                            value="custom"
                            checked={baseImageSource === "custom"}
                            onChange={() => handleBaseImageSourceChange("custom")}
                            className="sr-only"
                        />
                        <div
                            className={cn(
                                "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 h-full",
                                baseImageSource === "custom"
                                    ? (isDark
                                        ? "border-[#7bb33a] bg-[#1f2e18] shadow-md ring-2 ring-[#7bb33a]/20"
                                        : "border-[#6aa329] bg-[#f0f7e7] shadow-md ring-2 ring-[#6aa329]/20")
                                    : (isDark
                                        ? "border-[#374151] hover:border-[#7bb33a]/50 hover:bg-[#2d4222] group-hover:shadow-sm"
                                        : "border-gray-200 hover:border-[#6aa329]/50 hover:bg-gray-50 group-hover:shadow-sm")
                            )}
                        >
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                        baseImageSource === "custom"
                                            ? (isDark ? "border-[#7bb33a] bg-[#7bb33a]" : "border-[#6aa329] bg-[#6aa329]")
                                            : (isDark ? "border-[#6b7280]" : "border-gray-300")
                                    )}
                                >
                                    {baseImageSource === "custom" && (
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <div>
                                    <div className={textStyles(isDark, { size: 'sm', weight: 'semibold', color: 'primary' })}>Custom Image</div>
                                    <div className={textStyles(isDark, { size: 'xs', color: 'muted' })}>
                                        Any Docker Hub
                                        <br />
                                        image
                                    </div>
                                </div>
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Conditional Base Image Selection */}
            {baseImageSource === "ubuntu" && (
                <div className="mb-4">
                    <label className={cn(getThemePresets(isDark).formLabel, "block")}>Ubuntu Version</label>
                    <select
                        className={cn(
                            getThemePresets(isDark).input,
                            "px-4 py-3 rounded-lg",
                            isDark ? "bg-[#161a0e]" : "bg-white"
                        )}
                        value={baseImage}
                        onChange={(e) => handleBaseImageSelect(e.target.value)}
                    >
                        {UBUNTU_VERSIONS.map((version) => (
                            <option key={version.value} value={version.value}>
                                {version.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {baseImageSource === "other" && (
                <div className="mb-4">
                    <label className={cn(getThemePresets(isDark).formLabel, "block")}>Distribution</label>
                    <select
                        className={cn(
                            getThemePresets(isDark).input,
                            "px-4 py-3 rounded-lg",
                            isDark ? "bg-[#161a0e]" : "bg-white"
                        )}
                        value={baseImage}
                        onChange={(e) => handleBaseImageSelect(e.target.value)}
                    >
                        {OTHER_BASE_IMAGES.map((image) => (
                            <option key={image.value} value={image.value}>
                                {image.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {baseImageSource === "custom" && (
                <div className="mb-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className={cn(getThemePresets(isDark).formLabel, "block")}>
                                Custom Image
                            </label>
                            <input
                                className={cn(getThemePresets(isDark).input, "px-4 py-3 rounded-lg")}
                                value={baseImage}
                                onChange={(e) => handleCustomBaseImageChange(e.target.value)}
                                placeholder="e.g. neurodebian:sid"
                            />
                            <p className={textStyles(isDark, { size: 'xs', color: 'muted' })}>
                                Enter any valid Docker image name and tag
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <label className={getThemePresets(isDark).formLabel}>
                                    Package Manager
                                </label>
                                <button
                                    type="button"
                                    className={cn(
                                        "p-1 transition-colors",
                                        iconStyles(isDark, 'sm', 'primary'),
                                        isDark
                                            ? "hover:text-[#7bb33a]"
                                            : "hover:text-[#6aa329]",
                                        showPkgManagerHelp && (isDark ? "text-[#7bb33a]" : "text-[#6aa329]")
                                    )}
                                    onClick={() => setShowPkgManagerHelp(!showPkgManagerHelp)}
                                    title={showPkgManagerHelp ? "Hide documentation" : "Show documentation"}
                                >
                                    <InformationCircleIcon className={iconStyles(isDark, 'sm')} />
                                </button>
                            </div>

                            {showPkgManagerHelp && (
                                <HelpSection 
                                    markdownContent={packageManagerHelpMarkdown} 
                                    sourceFilePath="copy/help/ui/package-manager.md"
                                    className="mb-4" 
                                />
                            )}

                            <select
                                className={cn(
                                    getThemePresets(isDark).input,
                                    "px-4 py-3 rounded-lg",
                                    isDark ? "bg-[#161a0e]" : "bg-white"
                                )}
                                value={pkgManager}
                                onChange={(e) => onChange(baseImage, e.target.value)}
                            >
                                <option value="apt">apt (Debian/Ubuntu)</option>
                                <option value="yum">yum (RHEL/CentOS/Fedora)</option>
                            </select>
                        </div>
                    </div>

                    {/* Add Default Template Checkbox for Custom Images */}
                    <div className="mt-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={addDefaultTemplate}
                                onChange={(e) => onAddDefaultTemplateChange?.(e.target.checked)}
                                className={cn(
                                    "mr-3 h-4 w-4 rounded",
                                    isDark
                                        ? "text-[#7bb33a] focus:ring-[#7bb33a] border-[#374151] bg-[#161a0e]"
                                        : "text-[#6aa329] focus:ring-[#6aa329] border-gray-300"
                                )}
                            />
                            <span className={textStyles(isDark, { size: 'sm', color: 'muted' })}>
                                Add default template (disable for old containers where APT doesn&apos;t work)
                            </span>
                        </label>
                        <p className={cn(textStyles(isDark, { size: 'xs', color: 'muted' }), "mt-1 ml-7")}>
                            The default template includes common system updates and utilities.
                            Disable this for legacy base images with package manager issues.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}