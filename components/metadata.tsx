import { InformationCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ContainerRecipe, Architecture, CopyrightInfo, StructuredReadme, convertStructuredReadmeToText, CATEGORIES } from "@/components/common";
import { useState, useEffect } from "react";
import {
    BasicInfoSection,
    ArchitectureSelector,
    CategorySelector,
    DocumentationSection,
    LicenseSection,
    ValidationSummary,
} from "@/components/ui";
import { HelpSection } from "@/components/ui/HelpSection";
import { iconStyles, textStyles, cn, cardStyles, buttonStyles } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";
import IconEditor from "@/components/IconEditor";
import basicInformationHelpMarkdown from "@/copy/help/metadata/basic-information.md";
import targetArchitecturesHelpMarkdown from "@/copy/help/metadata/target-architectures.md";
import documentationHelpMarkdown from "@/copy/help/metadata/documentation.md";
import licenseInformationHelpMarkdown from "@/copy/help/metadata/license-information.md";
import containerCategoriesHelpMarkdown from "@/copy/help/metadata/container-categories.md";

// Validation functions
function validateName(name: string): string | null {
    if (!name.trim()) return "Container name is required";
    if (name.length < 2) return "Container name must be at least 2 characters";
    if (name.length > 63) return "Container name cannot exceed 63 characters";

    // Container name validation: lowercase letters and numbers only, no hyphens
    const validNameRegex = /^[a-z0-9]+$/;
    if (!validNameRegex.test(name)) {
        return "Container name must be lowercase and can only contain letters and numbers";
    }
    return null;
}

function validateVersion(version: string): string | null {
    if (!version.trim()) return "Version is required";
    return null;
}

function validateDocumentation(recipe: ContainerRecipe): string | null {
    const hasReadme = recipe.readme && recipe.readme.trim();
    const hasReadmeUrl = recipe.readme_url && recipe.readme_url.trim();
    const hasStructuredReadme = recipe.structured_readme && (
        recipe.structured_readme.description.trim() ||
        recipe.structured_readme.example.trim() ||
        recipe.structured_readme.documentation.trim() ||
        recipe.structured_readme.citation.trim()
    );

    if (!hasReadme && !hasReadmeUrl && !hasStructuredReadme) {
        return "Documentation is required (either content, structured, or URL)";
    }

    if (hasReadmeUrl && !/^https?:\/\/.+/.test(recipe.readme_url!)) {
        return "Documentation URL must be a valid HTTP/HTTPS URL";
    }

    return null;
}

export default function ContainerMetadata({
    recipe,
    onChange,
    onNameEditStart,
    onNameEditFinish,
    onValidationChange,
}: {
    recipe: ContainerRecipe;
    onChange: (recipe: ContainerRecipe) => void;
    onNameEditStart?: () => void;
    onNameEditFinish?: () => void;
    onValidationChange?: (hasErrors: boolean) => void;
}) {
    const { isDark } = useTheme();
    const [showInputTypeWarning, setShowInputTypeWarning] = useState(false);
    const [pendingInputType, setPendingInputType] = useState<"content" | "url" | null>(null);
    const [showValidation, setShowValidation] = useState(false);
    const [showBasicInfoHelp, setShowBasicInfoHelp] = useState(false);
    const [showArchitectureHelp, setShowArchitectureHelp] = useState(false);
    const [showDocumentationHelp, setShowDocumentationHelp] = useState(false);
    const [showLicenseHelp, setShowLicenseHelp] = useState(false);
    const [showCategoryHelp, setShowCategoryHelp] = useState(false);

    // Reset state when recipe changes (different container loaded)
    useEffect(() => {
        setShowInputTypeWarning(false);
        setPendingInputType(null);
        setShowValidation(false);
        setShowBasicInfoHelp(false);
        setShowArchitectureHelp(false);
        setShowDocumentationHelp(false);
        setShowLicenseHelp(false);
        setShowCategoryHelp(false);
    }, [recipe.name, recipe.version, recipe.readme, recipe.readme_url, recipe.structured_readme]); // Reset when container or documentation changes

    // Validation states
    const nameError = validateName(recipe.name);
    const versionError = validateVersion(recipe.version);
    const documentationError = validateDocumentation(recipe);
    const architectureError = recipe.architectures.length === 0 ? "At least one architecture must be selected" : null;
    const categoryError = !recipe.categories || recipe.categories.length === 0 ? "At least one category must be selected" : null;

    const hasErrors = !!(nameError || versionError || documentationError || architectureError || categoryError);

    // Show validation after user has interacted with the form
    useEffect(() => {
        // Always show validation for required fields that are empty
        const hasRequiredEmptyFields = !recipe.name.trim() || !recipe.version.trim() ||
            (!recipe.readme?.trim() && !recipe.readme_url?.trim() && !recipe.structured_readme) ||
            recipe.architectures.length === 0 || !recipe.categories || recipe.categories.length === 0;

        if (recipe.name || recipe.version || recipe.readme || recipe.readme_url || recipe.structured_readme || hasRequiredEmptyFields) {
            setShowValidation(true);
        }
    }, [recipe.name, recipe.version, recipe.readme, recipe.readme_url, recipe.structured_readme, recipe.architectures, recipe.categories]);

    // Notify parent about validation state changes
    useEffect(() => {
        onValidationChange?.(hasErrors);
    }, [hasErrors, onValidationChange]);

    const updateName = (name: string) => {
        onChange({ ...recipe, name });
    };

    const updateVersion = (version: string) => {
        onChange({ ...recipe, version });
    };

    const updateIcon = (icon: string | undefined) => {
        onChange({ ...recipe, icon });
    };

    const updateArchitectures = (architectures: Architecture[]) => {
        onChange({ ...recipe, architectures });
    };

    const updateCategories = (categories: (keyof typeof CATEGORIES)[]) => {
        onChange({ ...recipe, categories });
    };

    const updateReadme = (readme: string) => {
        onChange({ ...recipe, readme, readme_url: undefined, structured_readme: undefined });
    };

    const updateReadmeUrl = (readme_url: string) => {
        onChange({ ...recipe, readme_url, readme: undefined, structured_readme: undefined });
    };

    const updateStructuredReadme = (structured_readme: StructuredReadme) => {
        // Auto-generate plain text readme for builder
        const plainTextReadme = convertStructuredReadmeToText(structured_readme, recipe.name, recipe.version);
        onChange({
            ...recipe,
            structured_readme,
            readme: plainTextReadme,
            readme_url: undefined
        });
    };

    const updateCopyright = (copyright: CopyrightInfo[]) => {
        onChange({ ...recipe, copyright });
    };

    const addLicense = (index?: number) => {
        const newLicense = { license: "", url: "" };
        const licenses = [...(recipe.copyright || [])];
        if (index !== undefined) {
            licenses.splice(index, 0, newLicense);
        } else {
            licenses.push(newLicense);
        }
        updateCopyright(licenses);
    };

    const moveLicense = (index: number, direction: "up" | "down") => {
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= (recipe.copyright || []).length) return;

        const updatedLicenses = [...(recipe.copyright || [])];
        const temp = updatedLicenses[index];
        updatedLicenses[index] = updatedLicenses[newIndex];
        updatedLicenses[newIndex] = temp;
        updateCopyright(updatedLicenses);
    };

    const reorderLicenses = (licenses: CopyrightInfo[]) => {
        updateCopyright(licenses);
    };

    // Input type switching with warning
    const handleReadmeChange = (readme: string) => {
        // Check if there's URL content that would be lost
        if (recipe.readme_url?.trim()) {
            setPendingInputType("content");
            setShowInputTypeWarning(true);
            return;
        }
        updateReadme(readme);
    };

    const handleReadmeUrlChange = (url: string) => {
        // Check if there's content that would be lost
        if (recipe.readme?.trim()) {
            setPendingInputType("url");
            setShowInputTypeWarning(true);
            return;
        }
        updateReadmeUrl(url);
    };

    const confirmInputTypeSwitch = () => {
        if (pendingInputType === "content") {
            updateReadme("");
        } else if (pendingInputType === "url") {
            updateReadmeUrl("");
        }
        setShowInputTypeWarning(false);
        setPendingInputType(null);
    };

    const cancelInputTypeSwitch = () => {
        setShowInputTypeWarning(false);
        setPendingInputType(null);
    };






    return (
        <>
            <div className={cn(
                cardStyles(isDark, 'elevated', 'sm'), 
                "mb-6 backdrop-blur-md",
                isDark ? "bg-black/20 border-[#2d4222]/50" : "bg-white/30 border-gray-200/50"
            )}>
                <ValidationSummary
                    errors={[nameError, versionError, documentationError, architectureError, categoryError]}
                    show={showValidation && hasErrors}
                />

                <div className="p-4 sm:p-6">
                    {/* Basic Information Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className={textStyles(isDark, { size: 'lg', weight: 'medium', color: 'primary' })}>Basic Information</h3>
                            <button
                                type="button"
                                className={cn(
                                    buttonStyles(isDark, 'ghost', 'sm'),
                                    "p-1 transition-colors",
                                    showBasicInfoHelp
                                        ? (isDark ? 'text-[#7bb33a]' : 'text-[#6aa329]')
                                        : (isDark ? 'text-[#91c84a] hover:text-[#7bb33a]' : 'text-[#4f7b38] hover:text-[#6aa329]')
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowBasicInfoHelp(!showBasicInfoHelp);
                                }}
                                title={showBasicInfoHelp ? "Hide documentation" : "Show documentation"}
                            >
                                <InformationCircleIcon className={iconStyles(isDark, 'sm')} />
                            </button>
                        </div>

                        {showBasicInfoHelp && (
                            <div className="mb-4">
                                <HelpSection 
                                    markdownContent={basicInformationHelpMarkdown} 
                                    sourceFilePath="copy/help/metadata/basic-information.md"
                                />
                            </div>
                        )}

                        <BasicInfoSection
                            name={recipe.name}
                            version={recipe.version}
                            onNameChange={updateName}
                            onVersionChange={updateVersion}
                            nameError={nameError}
                            versionError={versionError}
                            showValidation={showValidation}
                            onNameEditStart={onNameEditStart}
                            onNameEditFinish={onNameEditFinish}
                        />
                    </div>

                    {/* Architecture Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className={textStyles(isDark, { size: 'lg', weight: 'medium', color: 'primary' })}>
                                Target Architectures *
                            </h3>
                            <button
                                type="button"
                                className={cn(
                                    buttonStyles(isDark, 'ghost', 'sm'),
                                    "p-1 transition-colors",
                                    showArchitectureHelp
                                        ? (isDark ? 'text-[#7bb33a]' : 'text-[#6aa329]')
                                        : (isDark ? 'text-[#91c84a] hover:text-[#7bb33a]' : 'text-[#4f7b38] hover:text-[#6aa329]')
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowArchitectureHelp(!showArchitectureHelp);
                                }}
                                title={showArchitectureHelp ? "Hide documentation" : "Show documentation"}
                            >
                                <InformationCircleIcon className={iconStyles(isDark, 'sm')} />
                            </button>
                        </div>

                        {showArchitectureHelp && (
                            <div className="mb-4">
                                <HelpSection 
                                    markdownContent={targetArchitecturesHelpMarkdown} 
                                    sourceFilePath="copy/help/metadata/target-architectures.md"
                                />
                            </div>
                        )}

                        <ArchitectureSelector
                            selectedArchitectures={recipe.architectures}
                            onChange={updateArchitectures}
                            error={architectureError}
                            showValidation={showValidation}
                        />
                    </div>

                    {/* Category Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className={textStyles(isDark, { size: 'lg', weight: 'medium', color: 'primary' })}>
                                Categories *
                            </h3>
                            <button
                                type="button"
                                className={cn(
                                    buttonStyles(isDark, 'ghost', 'sm'),
                                    "p-1 transition-colors",
                                    showCategoryHelp
                                        ? (isDark ? 'text-[#7bb33a]' : 'text-[#6aa329]')
                                        : (isDark ? 'text-[#91c84a] hover:text-[#7bb33a]' : 'text-[#4f7b38] hover:text-[#6aa329]')
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCategoryHelp(!showCategoryHelp);
                                }}
                                title={showCategoryHelp ? "Hide documentation" : "Show documentation"}
                            >
                                <InformationCircleIcon className={iconStyles(isDark, 'sm')} />
                            </button>
                        </div>

                        {showCategoryHelp && (
                            <div className="mb-4">
                                <HelpSection 
                                    markdownContent={containerCategoriesHelpMarkdown} 
                                    sourceFilePath="copy/help/metadata/container-categories.md"
                                />
                            </div>
                        )}

                        <CategorySelector
                            selectedCategories={recipe.categories || []}
                            onChange={updateCategories}
                            error={categoryError}
                            showValidation={showValidation}
                        />
                    </div>

                    {/* Icon Editor */}
                    <div className="mb-8">
                        <IconEditor
                            value={recipe.icon}
                            onChange={updateIcon}
                            containerName={recipe.name}
                            categories={recipe.categories}
                            showValidation={showValidation}
                        />
                    </div>

                    {/* Documentation Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className={textStyles(isDark, { size: 'lg', weight: 'medium', color: 'primary' })}>Documentation *</h3>
                            <button
                                type="button"
                                className={cn(
                                    buttonStyles(isDark, 'ghost', 'sm'),
                                    "p-1 transition-colors",
                                    showDocumentationHelp
                                        ? (isDark ? 'text-[#7bb33a]' : 'text-[#6aa329]')
                                        : (isDark ? 'text-[#91c84a] hover:text-[#7bb33a]' : 'text-[#4f7b38] hover:text-[#6aa329]')
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDocumentationHelp(!showDocumentationHelp);
                                }}
                                title={showDocumentationHelp ? "Hide documentation" : "Show documentation"}
                            >
                                <InformationCircleIcon className={iconStyles(isDark, 'sm')} />
                            </button>
                        </div>

                        {showDocumentationHelp && (
                            <div className="mb-4">
                                <HelpSection 
                                    markdownContent={documentationHelpMarkdown} 
                                    sourceFilePath="copy/help/metadata/documentation.md"
                                />
                            </div>
                        )}

                        <DocumentationSection
                            readme={recipe.readme}
                            readmeUrl={recipe.readme_url}
                            structuredReadme={recipe.structured_readme}
                            containerName={recipe.name}
                            containerVersion={recipe.version}
                            onReadmeChange={handleReadmeChange}
                            onReadmeUrlChange={handleReadmeUrlChange}
                            onStructuredReadmeChange={updateStructuredReadme}
                            error={documentationError}
                            showValidation={showValidation}
                        />
                    </div>

                    {/* License Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className={textStyles(isDark, { size: 'lg', weight: 'medium', color: 'primary' })}>License Information</h3>
                            <button
                                type="button"
                                className={cn(
                                    buttonStyles(isDark, 'ghost', 'sm'),
                                    "p-1 transition-colors",
                                    showLicenseHelp
                                        ? (isDark ? 'text-[#7bb33a]' : 'text-[#6aa329]')
                                        : (isDark ? 'text-[#91c84a] hover:text-[#7bb33a]' : 'text-[#4f7b38] hover:text-[#6aa329]')
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowLicenseHelp(!showLicenseHelp);
                                }}
                                title={showLicenseHelp ? "Hide documentation" : "Show documentation"}
                            >
                                <InformationCircleIcon className={iconStyles(isDark, 'sm')} />
                            </button>
                        </div>

                        {showLicenseHelp && (
                            <div className="mb-4">
                                <HelpSection 
                                    markdownContent={licenseInformationHelpMarkdown} 
                                    sourceFilePath="copy/help/metadata/license-information.md"
                                />
                            </div>
                        )}

                        <LicenseSection
                            licenses={recipe.copyright || []}
                            onChange={updateCopyright}
                            onAddLicense={addLicense}
                            showAddButton={false}
                            onMoveLicense={moveLicense}
                            onReorderLicenses={reorderLicenses}
                        />
                    </div>
                </div>
            </div>

            {/* Input Type Switch Warning Modal */}
            {showInputTypeWarning && (
                <div className={cn("fixed inset-0 flex items-center justify-center z-50 p-4", isDark ? "bg-black/90" : "bg-black/80")}>
                    <div className={cn(cardStyles(isDark, 'default', 'md'), "max-w-md w-full")}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-yellow-900/30" : "bg-yellow-100")}>
                                    <ExclamationTriangleIcon className={iconStyles(isDark, 'lg', 'muted')} />
                                </div>
                                <div>
                                    <h3 className={textStyles(isDark, {
                                        size: 'lg',
                                        weight: 'medium',
                                        color: 'primary'
                                    })}>
                                        Switch Documentation Input?
                                    </h3>
                                </div>
                            </div>
                            <p className={cn(textStyles(isDark, { color: 'secondary' }), "mb-6")}>
                                You have existing documentation content. Switching to{" "}
                                {pendingInputType === "content" ? "content entry" : "URL input"} will
                                clear your current{" "}
                                {recipe.readme ? "written content" : "URL"}. This action cannot be
                                undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    className={buttonStyles(isDark, 'secondary', 'md')}
                                    onClick={cancelInputTypeSwitch}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={cn("px-4 py-2 text-sm font-medium text-white rounded-md transition-colors", isDark ? "bg-yellow-500 hover:bg-yellow-600" : "bg-yellow-600 hover:bg-yellow-700")}
                                    onClick={confirmInputTypeSwitch}
                                >
                                    Switch Anyway
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}