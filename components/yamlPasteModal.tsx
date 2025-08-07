import { useState, useRef } from "react";
import { ExclamationTriangleIcon, DocumentTextIcon, ClipboardDocumentIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { load as loadYAML } from "js-yaml";
import { ContainerRecipe, migrateLegacyRecipe } from "@/components/common";
import { validateContainerRecipe, getValidationErrorSummary } from "@/lib/zodSchema";
import { textStyles, cn, cardStyles } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

interface YamlPasteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadContainer: (recipe: ContainerRecipe, id?: string) => void;
}

export default function YamlPasteModal({
    isOpen,
    onClose,
    onLoadContainer
}: YamlPasteModalProps) {
    const { isDark } = useTheme();
    const modalRef = useRef(null);
    const [yamlContent, setYamlContent] = useState("");
    const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);
    const [yamlParseError, setYamlParseError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [validatedRecipe, setValidatedRecipe] = useState<ContainerRecipe | null>(null);

    const resetValidation = () => {
        setValidationErrors([]);
        setYamlParseError(null);
        setIsValid(false);
        setValidatedRecipe(null);
    };

    const validateYaml = async () => {
        if (!yamlContent.trim()) {
            resetValidation();
            return;
        }

        setIsValidating(true);
        resetValidation();

        try {
            // First, try to parse the YAML
            const parsedYaml = loadYAML(yamlContent);
            
            if (!parsedYaml || typeof parsedYaml !== 'object') {
                setYamlParseError("Invalid YAML: Must be a valid YAML object");
                return;
            }

            // Then validate with Zod schema
            const validationResult = validateContainerRecipe(parsedYaml);
            
            if (validationResult.success) {
                const migratedRecipe = migrateLegacyRecipe(validationResult.data as ContainerRecipe);
                setValidatedRecipe(migratedRecipe);
                setIsValid(true);
            } else {
                const errorSummary = getValidationErrorSummary(validationResult.errors);
                setValidationErrors(errorSummary);
            }
        } catch (error) {
            if (error instanceof Error) {
                setYamlParseError(`YAML parsing error: ${error.message}`);
            } else {
                setYamlParseError("Failed to parse YAML content");
            }
        } finally {
            setIsValidating(false);
        }
    };

    const handleContentChange = (content: string) => {
        setYamlContent(content);
        // Reset validation state when content changes
        if (content !== yamlContent) {
            resetValidation();
        }
    };

    const handleLoadContainer = () => {
        if (validatedRecipe) {
            const id = `pasted-${Date.now()}`;
            onLoadContainer(validatedRecipe, id);
            onClose();
            // Reset state for next use
            setYamlContent("");
            resetValidation();
        }
    };

    const handleClose = () => {
        onClose();
        // Reset state when closing
        setYamlContent("");
        resetValidation();
    };

    if (!isOpen) return null;

    return (
        <div className={cn(
            "fixed inset-0 flex items-center justify-center z-50 p-4",
            isDark ? "bg-black/90" : "bg-black/80"
        )}>
            <div
                ref={modalRef}
                className={cn(cardStyles(isDark, 'default', 'lg'), "max-w-4xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto")}
            >
                <div className="mb-6">
                    <h3 className={cn(
                        textStyles(isDark, { size: '2xl', weight: 'bold', color: 'primary' }),
                        "mb-2"
                    )}>
                        Paste YAML Recipe
                    </h3>
                    <p className={cn(textStyles(isDark, { size: 'sm', color: 'secondary' }))}>
                        Paste your container recipe in YAML format. This is perfect for AI-generated recipes.
                    </p>
                </div>

                {/* YAML Input */}
                <div className="mb-6">
                    <label className={cn(
                        textStyles(isDark, { size: 'sm', weight: 'medium', color: 'primary' }),
                        "block mb-2"
                    )}>
                        YAML Content
                    </label>
                    <div className="relative">
                        <textarea
                            value={yamlContent}
                            onChange={(e) => handleContentChange(e.target.value)}
                            placeholder="Paste your YAML recipe here..."
                            className={cn(
                                "w-full h-64 p-4 rounded-lg border font-mono text-sm resize-y min-h-[16rem] max-h-[32rem]",
                                "focus:outline-none focus:ring-2 transition-colors",
                                isDark
                                    ? "bg-[#0a0c08] border-[#2d4222] text-gray-300 placeholder-gray-500 focus:ring-[#91c84a]/30 focus:border-[#91c84a]"
                                    : "bg-white border-[#e6f1d6] text-gray-900 placeholder-gray-400 focus:ring-[#4f7b38]/30 focus:border-[#4f7b38]"
                            )}
                        />
                        {yamlContent && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(yamlContent);
                                }}
                                className={cn(
                                    "absolute top-2 right-2 p-2 rounded text-xs transition-colors",
                                    isDark
                                        ? "bg-[#2d4222] text-[#91c84a] hover:bg-[#3f5b2e]"
                                        : "bg-[#e6f1d6] text-[#4f7b38] hover:bg-[#d3e7b6]"
                                )}
                                title="Copy to clipboard"
                            >
                                <ClipboardDocumentIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Validation Button */}
                <div className="mb-6">
                    <button
                        onClick={validateYaml}
                        disabled={!yamlContent.trim() || isValidating}
                        className={cn(
                            "flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
                            yamlContent.trim() && !isValidating
                                ? (isDark
                                    ? "bg-[#5a8f23] text-white hover:bg-[#6aa329] border border-[#7bb33a]/30"
                                    : "bg-[#4f7b38] text-white hover:bg-[#6aa329] border border-[#4f7b38]/30")
                                : (isDark
                                    ? "bg-[#2d4222] text-[#91c84a]/50 border border-[#4f7b38]/20 cursor-not-allowed"
                                    : "bg-[#f0f7e7] text-[#4f7b38]/50 border border-[#e6f1d6] cursor-not-allowed")
                        )}
                    >
                        {isValidating ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                Validating...
                            </>
                        ) : (
                            <>
                                <DocumentTextIcon className="h-5 w-5" />
                                Validate YAML
                            </>
                        )}
                    </button>
                </div>

                {/* Validation Results */}
                {yamlParseError && (
                    <div className={cn(
                        "mb-4 p-4 rounded-lg border flex items-start gap-3",
                        isDark ? "bg-red-900/20 border-red-700/30" : "bg-red-50 border-red-200"
                    )}>
                        <ExclamationTriangleIcon className={cn(
                            "h-5 w-5 flex-shrink-0 mt-0.5",
                            isDark ? "text-red-400" : "text-red-600"
                        )} />
                        <div className="flex-1">
                            <p className={cn(
                                textStyles(isDark, { size: 'sm', weight: 'medium' }),
                                isDark ? "text-red-400" : "text-red-700"
                            )}>
                                YAML Parse Error
                            </p>
                            <p className={cn(
                                textStyles(isDark, { size: 'xs' }),
                                isDark ? "text-red-400/80" : "text-red-600",
                                "mt-1 font-mono"
                            )}>
                                {yamlParseError}
                            </p>
                        </div>
                    </div>
                )}

                {validationErrors.length > 0 && (
                    <div className={cn(
                        "mb-4 p-4 rounded-lg border",
                        isDark ? "bg-red-900/20 border-red-700/30" : "bg-red-50 border-red-200"
                    )}>
                        <div className="flex items-start gap-3 mb-3">
                            <ExclamationTriangleIcon className={cn(
                                "h-5 w-5 flex-shrink-0 mt-0.5",
                                isDark ? "text-red-400" : "text-red-600"
                            )} />
                            <div className="flex-1">
                                <p className={cn(
                                    textStyles(isDark, { size: 'sm', weight: 'medium' }),
                                    isDark ? "text-red-400" : "text-red-700"
                                )}>
                                    Validation Errors ({validationErrors.length})
                                </p>
                                <p className={cn(
                                    textStyles(isDark, { size: 'xs' }),
                                    isDark ? "text-red-400/80" : "text-red-600",
                                    "mt-1"
                                )}>
                                    Please fix the following issues in your YAML:
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {validationErrors.map((error, index) => (
                                <div key={index} className={cn(
                                    "p-3 rounded border",
                                    isDark ? "bg-red-800/20 border-red-600/30" : "bg-red-100/50 border-red-300"
                                )}>
                                    <p className={cn(
                                        textStyles(isDark, { size: 'xs', weight: 'medium' }),
                                        isDark ? "text-red-300" : "text-red-800"
                                    )}>
                                        {error.field === 'root' ? 'General' : error.field}
                                    </p>
                                    <p className={cn(
                                        textStyles(isDark, { size: 'xs' }),
                                        isDark ? "text-red-400" : "text-red-700",
                                        "mt-1"
                                    )}>
                                        {error.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isValid && validatedRecipe && (
                    <div className={cn(
                        "mb-4 p-4 rounded-lg border",
                        isDark ? "bg-green-900/20 border-green-700/30" : "bg-green-50 border-green-200"
                    )}>
                        <div className="flex items-start gap-3">
                            <CheckCircleIcon className={cn(
                                "h-5 w-5 flex-shrink-0 mt-0.5",
                                isDark ? "text-green-400" : "text-green-600"
                            )} />
                            <div className="flex-1">
                                <p className={cn(
                                    textStyles(isDark, { size: 'sm', weight: 'medium' }),
                                    isDark ? "text-green-400" : "text-green-700"
                                )}>
                                    YAML is Valid!
                                </p>
                                <div className={cn(
                                    "mt-2 grid grid-cols-2 gap-4 text-xs",
                                    isDark ? "text-green-400/80" : "text-green-600"
                                )}>
                                    <div>
                                        <span className="font-medium">Name:</span> {validatedRecipe.name}
                                    </div>
                                    <div>
                                        <span className="font-medium">Version:</span> {validatedRecipe.version}
                                    </div>
                                    <div>
                                        <span className="font-medium">Architectures:</span> {validatedRecipe.architectures.join(', ')}
                                    </div>
                                    <div>
                                        <span className="font-medium">Directives:</span> {validatedRecipe.build.directives.length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                    {isValid && validatedRecipe ? (
                        <button
                            onClick={handleLoadContainer}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
                                isDark
                                    ? "bg-gradient-to-r from-[#5a8f23] to-[#7bb33a] text-white hover:from-[#7bb33a] hover:to-[#91c84a] border border-[#91c84a]/30"
                                    : "bg-gradient-to-r from-[#4f7b38] to-[#6aa329] text-white hover:from-[#6aa329] hover:to-[#91c84a] border border-[#6aa329]/30"
                            )}
                        >
                            <CheckCircleIcon className="h-5 w-5" />
                            Load Container
                        </button>
                    ) : (
                        <div className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold opacity-50 cursor-not-allowed",
                            isDark
                                ? "bg-[#2d4222] text-[#91c84a] border border-[#4f7b38]/20"
                                : "bg-[#f0f7e7] text-[#4f7b38] border border-[#e6f1d6]"
                        )}>
                            <CheckCircleIcon className="h-5 w-5" />
                            Load Container
                        </div>
                    )}
                    
                    <button
                        className={cn(
                            "px-6 py-4 rounded-lg font-medium transition-colors",
                            isDark
                                ? "text-gray-400 hover:text-gray-300 hover:bg-[#1f2e18] border border-[#4f7b38]/20"
                                : "text-gray-600 hover:text-gray-700 hover:bg-[#f0f7e7] border border-[#e6f1d6]"
                        )}
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}