import { useState, useRef, useCallback } from "react";
import {
    DocumentTextIcon,
    ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { getCards, iconStyles, textStyles, buttonStyles, cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";
import { ValidationResult } from "@/types/validation";

export default function DockerfileDisplay({
    validationResult,
}: {
    validationResult: ValidationResult | null;
}) {
    const { isDark } = useTheme();
    const [showDockerfile, setShowDockerfile] = useState(true);
    const dockerfileRef = useRef<HTMLPreElement>(null);

    const copyDockerfile = useCallback(async () => {
        if (validationResult?.dockerfile) {
            try {
                await navigator.clipboard.writeText(validationResult.dockerfile);
                console.log("Dockerfile copied to clipboard");
            } catch (error) {
                console.error("Failed to copy to clipboard:", error);
            }
        }
    }, [validationResult?.dockerfile]);

    const downloadDockerfile = useCallback(() => {
        if (validationResult?.dockerfile) {
            const blob = new Blob([validationResult.dockerfile], {
                type: "text/plain",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Dockerfile";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }, [validationResult?.dockerfile]);

    // Don't render if validation failed or no dockerfile
    if (!validationResult?.success || !validationResult.dockerfile) {
        return null;
    }

    return (
        <div className={getCards(isDark).minimal}>
            <div className="p-4 sm:p-6">
                {/* Dockerfile Display */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                        <h3 className={cn(
                            textStyles(isDark, { size: 'lg', weight: 'medium', color: 'primary' }),
                            "flex items-center gap-2"
                        )}>
                            <DocumentTextIcon className={iconStyles(isDark, 'md')} />
                            Generated Dockerfile
                        </h3>
                        <div className="flex flex-wrap gap-2 sm:gap-2">
                            <button
                                onClick={copyDockerfile}
                                className={cn(
                                    buttonStyles(isDark, 'secondary', 'sm'), 
                                    "flex items-center gap-1 min-w-0 flex-shrink-0"
                                )}
                            >
                                <ClipboardDocumentIcon className={iconStyles(isDark, 'sm')} />
                                <span className="hidden xs:inline">Copy</span>
                            </button>
                            <button
                                onClick={downloadDockerfile}
                                className={cn(
                                    buttonStyles(isDark, 'secondary', 'sm'), 
                                    "flex items-center gap-1 min-w-0 flex-shrink-0"
                                )}
                            >
                                <DocumentTextIcon className={iconStyles(isDark, 'sm')} />
                                <span className="hidden xs:inline">Download</span>
                            </button>
                            <button
                                onClick={() => setShowDockerfile(!showDockerfile)}
                                className={cn(
                                    buttonStyles(isDark, 'ghost', 'sm'),
                                    "min-w-0 flex-shrink-0"
                                )}
                            >
                                {showDockerfile ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {showDockerfile && (
                        <div className={cn(
                            "rounded-lg overflow-hidden",
                            isDark ? "bg-[#0f172a]" : "bg-gray-900"
                        )}>
                            <div className={cn(
                                "px-4 py-2 flex items-center justify-between",
                                isDark ? "bg-[#1e293b]" : "bg-gray-800"
                            )}>
                                <span className={cn(
                                    textStyles(isDark, { size: 'sm', weight: 'medium' }),
                                    isDark ? "text-[#e2e8f0]" : "text-gray-300"
                                )}>
                                    Dockerfile
                                </span>
                                <span className={cn(
                                    textStyles(isDark, { size: 'xs' }),
                                    isDark ? "text-[#94a3b8]" : "text-gray-400"
                                )}>
                                    {validationResult.dockerfile.split('\n').length} lines
                                </span>
                            </div>
                            <pre
                                ref={dockerfileRef}
                                className={cn(
                                    "p-3 sm:p-4 overflow-x-auto max-h-80 sm:max-h-96 overflow-y-auto",
                                    "break-words whitespace-pre-wrap text-xs sm:text-sm leading-relaxed",
                                    textStyles(isDark, { size: 'sm' }),
                                    isDark ? "text-[#e2e8f0]" : "text-gray-100"
                                )}
                                style={{ fontFamily: 'Monaco, "Courier New", monospace' }}
                            >
                                {validationResult.dockerfile}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Additional Information */}
                {validationResult.readme && (
                    <div className="mb-6">
                        <h3 className={cn(textStyles(isDark, { size: 'lg', weight: 'medium', color: 'primary' }), "mb-3")}>
                            Build Information
                        </h3>
                        <div className={cn(
                            "rounded-lg p-4",
                            isDark ? "bg-[#2d4222]" : "bg-gray-50"
                        )}>
                            <pre className={cn(
                                textStyles(isDark, { size: 'sm' }),
                                "whitespace-pre-wrap break-words overflow-x-auto",
                                isDark ? "text-[#d1d5db]" : "text-gray-700"
                            )}>
                                {validationResult.readme}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}