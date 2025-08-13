import { useState, useRef, useEffect } from "react";
import {
    ExclamationTriangleIcon,
    DocumentTextIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { load as loadYAML } from "js-yaml";
import {
    ContainerRecipe,
    migrateLegacyRecipe,
} from "@/components/common";
import {
    validateContainerRecipe,
    getValidationErrorSummary,
} from "@/lib/zodSchema";
import { textStyles, cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

// Syntax highlighting
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-yaml";
import "prismjs/themes/prism-tomorrow.css"; // Dark theme for dark mode
import "prismjs/themes/prism.css"; // Light theme

interface YamlPasteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadContainer: (recipe: ContainerRecipe, id?: string) => void;
}

export default function YamlPasteModal({
    isOpen,
    onClose,
    onLoadContainer,
}: YamlPasteModalProps) {
    const { isDark } = useTheme();
    const modalRef = useRef(null);
    const [yamlContent, setYamlContent] = useState("");
    const [validationErrors, setValidationErrors] = useState<
        { field: string; message: string }[]
    >([]);
    const [yamlParseError, setYamlParseError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [validatedRecipe, setValidatedRecipe] =
        useState<ContainerRecipe | null>(null);

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
            const parsedYaml = loadYAML(yamlContent);

            if (!parsedYaml || typeof parsedYaml !== "object") {
                setYamlParseError("Invalid YAML: Must be a valid YAML object");
                return;
            }

            const validationResult = validateContainerRecipe(parsedYaml);

            if (validationResult.success) {
                const migratedRecipe = migrateLegacyRecipe(
                    validationResult.data as ContainerRecipe
                );
                setValidatedRecipe(migratedRecipe);
                setIsValid(true);
            } else {
                const errorSummary = getValidationErrorSummary(
                    validationResult.errors
                );
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

    const handleLoadContainer = () => {
        if (validatedRecipe) {
            const id = `pasted-${Date.now()}`;
            onLoadContainer(validatedRecipe, id);
            handleClose();
        }
    };

    const handleClose = () => {
        onClose();
        setYamlContent("");
        resetValidation();
    };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Enhanced background with better blur integration */}
            <div
                className="absolute inset-0 backdrop-blur-md"
                style={{
                    background: isDark
                        ? "radial-gradient(circle at 30% 20%, rgba(123,179,58,0.08), transparent 50%), radial-gradient(circle at 70% 80%, rgba(145,200,74,0.08), transparent 50%), linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.85) 100%)"
                        : "radial-gradient(circle at 30% 20%, rgba(106,163,41,0.12), transparent 50%), radial-gradient(circle at 70% 80%, rgba(79,123,56,0.12), transparent 50%), linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(248,249,251,0.90) 100%)",
                }}
            />
            <div
                className="absolute inset-0 opacity-[0.03] animate-[movePattern_60s_linear_infinite]"
                style={{
                    backgroundImage:
                        "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"80\" height=\"80\" viewBox=\"0 0 80 80\"><circle cx=\"40\" cy=\"40\" r=\"1.5\" fill=\"%23ffffff\"/></svg>')",
                    backgroundSize: "80px 80px",
                }}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-labelledby="modal-title"
                className={cn(
                    "relative max-w-4xl w-full max-h-[88vh] overflow-y-auto rounded-xl shadow-2xl border backdrop-blur-sm p-6 sm:p-8",
                    isDark 
                        ? "bg-black/40 border-white/20 shadow-black/50" 
                        : "bg-white/90 border-gray-200/50 shadow-black/20"
                )}
            >
                {/* Header */}
                <div className="mb-6">
                    <h3
                        id="modal-title"
                        className={cn(
                            textStyles(isDark, {
                                size: "2xl",
                                weight: "bold",
                                color: "primary",
                            }),
                            "mb-2"
                        )}
                    >
                        Upload YAML Configuration
                    </h3>
                    <p
                        className={cn(
                            textStyles(isDark, { size: "sm", color: "secondary" })
                        )}
                    >
                        Paste your container recipe in YAML format. Ideal for importing
                        AI-generated or pre-written recipes.
                    </p>
                </div>

                {/* YAML Editor */}
                <div className="mb-6 relative">
                    <Editor
                        value={yamlContent}
                        onValueChange={(code) => {
                            setYamlContent(code);
                            resetValidation();
                        }}
                        highlight={(code) => Prism.highlight(code, Prism.languages.yaml, "yaml")}
                        padding={12}
                        className={cn(
                            "rounded-lg border font-mono text-sm min-h-[16rem] max-h-[32rem] overflow-auto",
                            isDark
                                ? "bg-[#0a0c08]/80 border-[#2d4222] text-gray-300 focus-within:border-[#91c84a]"
                                : "bg-white/90 border-[#e6f1d6] text-gray-900 focus-within:border-[#4f7b38]"
                        )}
                        style={{
                            fontFamily: '"Fira Code", monospace',
                            outline: "none",
                        }}
                    />
                    {yamlContent && (
                        <button
                            onClick={() => navigator.clipboard.writeText(yamlContent)}
                            className={cn(
                                "absolute top-2 right-2 p-2 rounded transition-colors",
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

                {/* Validate Button */}
                <div className="mb-6">
                    <button
                        onClick={validateYaml}
                        disabled={!yamlContent.trim() || isValidating}
                        className={cn(
                            "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow hover:shadow-md",
                            yamlContent.trim() && !isValidating
                                ? isDark
                                    ? "bg-gradient-to-r from-[#5a8f23] to-[#7bb33a] text-white hover:from-[#7bb33a] hover:to-[#91c84a]"
                                    : "bg-gradient-to-r from-[#4f7b38] to-[#6aa329] text-white hover:from-[#6aa329] hover:to-[#91c84a]"
                                : isDark
                                    ? "bg-[#2d4222] text-[#91c84a]/50 cursor-not-allowed"
                                    : "bg-[#f0f7e7] text-[#4f7b38]/50 cursor-not-allowed"
                        )}
                    >
                        {isValidating ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <DocumentTextIcon className="h-5 w-5" />
                                Check Recipe
                            </>
                        )}
                    </button>
                </div>

                {/* Validation Results */}
                {yamlParseError && (
                    <div
                        className={cn(
                            "mb-4 p-4 rounded-lg border flex items-start gap-3",
                            isDark
                                ? "bg-red-900/20 border-red-700/30"
                                : "bg-red-50 border-red-200"
                        )}
                    >
                        <ExclamationTriangleIcon
                            className={cn(
                                "h-5 w-5 flex-shrink-0 mt-0.5",
                                isDark ? "text-red-400" : "text-red-600"
                            )}
                        />
                        <div className="flex-1">
                            <p
                                className={cn(
                                    textStyles(isDark, { size: "sm", weight: "medium" }),
                                    isDark ? "text-red-400" : "text-red-700"
                                )}
                            >
                                YAML Parse Error
                            </p>
                            <p
                                className={cn(
                                    textStyles(isDark, { size: "xs" }),
                                    isDark ? "text-red-400/80" : "text-red-600",
                                    "mt-1 font-mono"
                                )}
                            >
                                {yamlParseError}
                            </p>
                        </div>
                    </div>
                )}

                {validationErrors.length > 0 && (
                    <div
                        className={cn(
                            "mb-4 p-4 rounded-lg border",
                            isDark
                                ? "bg-red-900/20 border-red-700/30"
                                : "bg-red-50 border-red-200"
                        )}
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <ExclamationTriangleIcon
                                className={cn(
                                    "h-5 w-5 flex-shrink-0 mt-0.5",
                                    isDark ? "text-red-400" : "text-red-600"
                                )}
                            />
                            <div className="flex-1">
                                <p
                                    className={cn(
                                        textStyles(isDark, { size: "sm", weight: "medium" }),
                                        isDark ? "text-red-400" : "text-red-700"
                                    )}
                                >
                                    Validation Errors ({validationErrors.length})
                                </p>
                                <p
                                    className={cn(
                                        textStyles(isDark, { size: "xs" }),
                                        isDark ? "text-red-400/80" : "text-red-600",
                                        "mt-1"
                                    )}
                                >
                                    Please fix the following issues in your recipe:
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {validationErrors.map((error, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "p-3 rounded border",
                                        isDark
                                            ? "bg-red-800/20 border-red-600/30"
                                            : "bg-red-100/50 border-red-300"
                                    )}
                                >
                                    <p
                                        className={cn(
                                            textStyles(isDark, { size: "xs", weight: "medium" }),
                                            isDark ? "text-red-300" : "text-red-800"
                                        )}
                                    >
                                        {error.field === "root" ? "General" : error.field}
                                    </p>
                                    <p
                                        className={cn(
                                            textStyles(isDark, { size: "xs" }),
                                            isDark ? "text-red-400" : "text-red-700",
                                            "mt-1"
                                        )}
                                    >
                                        {error.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isValid && validatedRecipe && (
                    <div
                        className={cn(
                            "mb-4 p-4 rounded-lg border",
                            isDark
                                ? "bg-green-900/20 border-green-700/30"
                                : "bg-green-50 border-green-200"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <CheckCircleIcon
                                className={cn(
                                    "h-5 w-5 flex-shrink-0 mt-0.5",
                                    isDark ? "text-green-400" : "text-green-600"
                                )}
                            />
                            <div className="flex-1">
                                <p
                                    className={cn(
                                        textStyles(isDark, { size: "sm", weight: "medium" }),
                                        isDark ? "text-green-400" : "text-green-700"
                                    )}
                                >
                                    Recipe is Valid!
                                </p>
                                <div
                                    className={cn(
                                        "mt-2 grid grid-cols-2 gap-4 text-xs",
                                        isDark ? "text-green-400/80" : "text-green-600"
                                    )}
                                >
                                    <div>
                                        <span className="font-medium">Name:</span>{" "}
                                        {validatedRecipe.name}
                                    </div>
                                    <div>
                                        <span className="font-medium">Version:</span>{" "}
                                        {validatedRecipe.version}
                                    </div>
                                    <div>
                                        <span className="font-medium">Architectures:</span>{" "}
                                        {validatedRecipe.architectures.join(", ")}
                                    </div>
                                    <div>
                                        <span className="font-medium">Directives:</span>{" "}
                                        {validatedRecipe.build.directives.length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                    {isValid && validatedRecipe ? (
                        <button
                            onClick={handleLoadContainer}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow hover:shadow-md",
                                isDark
                                    ? "bg-gradient-to-r from-[#5a8f23] to-[#7bb33a] text-white hover:from-[#7bb33a] hover:to-[#91c84a]"
                                    : "bg-gradient-to-r from-[#4f7b38] to-[#6aa329] text-white hover:from-[#6aa329] hover:to-[#91c84a]"
                            )}
                        >
                            <CheckCircleIcon className="h-5 w-5" />
                            Import Recipe
                        </button>
                    ) : (
                        <div
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold opacity-50 cursor-not-allowed",
                                isDark
                                    ? "bg-[#2d4222] text-[#91c84a]"
                                    : "bg-[#f0f7e7] text-[#4f7b38]"
                            )}
                        >
                            <CheckCircleIcon className="h-5 w-5" />
                            Import Recipe
                        </div>
                    )}

                    <button
                        className={cn(
                            "px-5 py-2.5 rounded-lg font-medium transition-colors",
                            isDark
                                ? "text-gray-400 hover:text-gray-300 hover:bg-white/10 border border-white/10"
                                : "text-gray-600 hover:text-gray-700 hover:bg-gray-100 border border-gray-200"
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