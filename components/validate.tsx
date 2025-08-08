import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
    PlayIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { usePyodide } from "@/lib/python";
import { loadBuilder, Builder, type BuildOptions } from "@/lib/builder";
import { ContainerRecipe } from "@/components/common";
import { getCards, iconStyles, textStyles, inputStyles, buttonStyles, cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

interface ValidationResult {
    success: boolean;
    dockerfile?: string;
    readme?: string;
    buildDirectory?: string;
    deployBins?: string[];
    deployPath?: string[];
    error?: string;
    warnings?: string[];
}

export default function ContainerValidator({
    recipe,
    onValidationChange,
    disabled,
    disabledReason,
}: {
    recipe: ContainerRecipe;
    onValidationChange?: (isValid: boolean, hasResult: boolean) => void;
    disabled?: boolean;
    disabledReason?: string;
}) {
    const { isDark } = useTheme();
    const { pyodide, loading: pyodideLoading, error: pyodideError, loadPyodide } = usePyodide();
    const [builder, setBuilder] = useState<Builder | null>(null);
    const [builderLoading, setBuilderLoading] = useState(false);
    const [builderError, setBuilderError] = useState<string | null>(null);
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [showDockerfile, setShowDockerfile] = useState(false);
    const [buildOptions, setBuildOptions] = useState<BuildOptions>({
        architecture: "x86_64",
        ignoreArchitecture: false,
        maxParallelJobs: 4,
    });

    const dockerfileRef = useRef<HTMLPreElement>(null);
    const builderLoadAttempted = useRef(false);
    const isLoadingBuilder = useRef(false);

    // Memoize the ready state to prevent unnecessary re-renders
    const isReady = useMemo(() => {
        return pyodide && builder && !builderLoading && !pyodideLoading;
    }, [pyodide, builder, builderLoading, pyodideLoading]);

    const canValidate = useMemo(() => {
        return isReady && !validating && !disabled;
    }, [isReady, validating, disabled]);

    // Stable function to load builder - prevents infinite loops
    const loadBuilderInstance = useCallback(async () => {
        if (!pyodide || builder || builderLoading || isLoadingBuilder.current || builderLoadAttempted.current) {
            return;
        }

        try {
            isLoadingBuilder.current = true;
            builderLoadAttempted.current = true;
            setBuilderLoading(true);
            setBuilderError(null);

            console.log("Loading builder instance...");
            const builderInstance = await loadBuilder(pyodide);
            console.log("Builder loaded successfully");

            setBuilder(builderInstance);
        } catch (error) {
            console.error("Failed to load builder:", error);
            setBuilderError(
                error instanceof Error ? error.message : "Failed to load builder"
            );
        } finally {
            setBuilderLoading(false);
            isLoadingBuilder.current = false;
        }
    }, [pyodide, builder, builderLoading]);

    // Load builder when Pyodide is ready - only once
    useEffect(() => {
        if (pyodide && !builder && !builderLoading && !builderLoadAttempted.current) {
            console.log("Pyodide ready, attempting to load builder...");
            loadBuilderInstance();
        }
    }, [pyodide, loadBuilderInstance, builder, builderLoading]);

    // Notify when validation result is cleared (e.g., when recipe changes)
    useEffect(() => {
        if (!validationResult) {
            onValidationChange?.(false, false);
        }
    }, [validationResult, onValidationChange]);

    const validateRecipe = useCallback(async () => {
        if (!builder || validating) {
            console.log("Cannot validate: builder not ready or already validating");
            return;
        }

        try {
            setValidating(true);
            setValidationResult(null);
            console.log("Starting validation...");

            console.log("Container recipe:", recipe);

            // Generate the container
            const result = await builder.generateFromDescription(
                recipe,
                "/tmp/build",
                buildOptions
            );

            console.log("Validation result:", result);

            if (result) {
                const validationResult = {
                    success: true,
                    dockerfile: result.dockerfile,
                    readme: result.readme,
                    buildDirectory: result.buildDirectory,
                    deployBins: result.deployBins,
                    deployPath: result.deployPath,
                };
                setValidationResult(validationResult);
                setShowDockerfile(true);
                onValidationChange?.(true, true);
            } else {
                const validationResult = {
                    success: false,
                    error: "Failed to generate container. Please check your recipe configuration.",
                };
                setValidationResult(validationResult);
                onValidationChange?.(false, true);
            }
        } catch (error) {
            console.error("Validation error:", error);
            const validationResult = {
                success: false,
                error: error instanceof Error ? error.message : "Unknown validation error",
            };
            setValidationResult(validationResult);
            onValidationChange?.(false, true);
        } finally {
            setValidating(false);
        }
    }, [builder, recipe, buildOptions, validating, onValidationChange]);

    const copyDockerfile = useCallback(async () => {
        if (validationResult?.dockerfile) {
            try {
                await navigator.clipboard.writeText(validationResult.dockerfile);
                // You might want to show a toast notification here
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

    // Manual retry function for builder loading
    const retryLoadBuilder = useCallback(() => {
        builderLoadAttempted.current = false;
        setBuilderError(null);
        loadBuilderInstance();
    }, [loadBuilderInstance]);

    return (
        <div className={cn(
            getCards(isDark).minimal,
            "backdrop-blur-md",
            isDark ? "bg-black/20 border-[#2d4222]/50" : "bg-white/30 border-gray-200/50"
        )}>
            <div className="p-4 sm:p-6">
                {/* Status Section */}
                <div className="mb-6">
                    <h3 className={cn(textStyles(isDark, { size: 'lg', weight: 'medium', color: 'primary' }), "mb-3")}>Status</h3>
                    <div className="space-y-2">
                        {/* Pyodide Status */}
                        <div className={cn(
                            "flex items-center gap-3 p-3 rounded-md",
                            isDark ? "bg-[#2d4222]" : "bg-gray-50"
                        )}>
                            <div className="flex-shrink-0">
                                {pyodideLoading ? (
                                    <ArrowPathIcon className={cn(iconStyles(isDark, 'md'), "text-blue-500 animate-spin")} />
                                ) : pyodideError ? (
                                    <ExclamationTriangleIcon className={cn(iconStyles(isDark, 'md'), "text-red-500")} />
                                ) : pyodide ? (
                                    <CheckCircleIcon className={cn(iconStyles(isDark, 'md'), "text-green-500")} />
                                ) : (
                                    <div className="h-5 w-5 bg-gray-300 rounded-full" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className={textStyles(isDark, { size: 'sm', weight: 'medium' })}>
                                    Pyodide Runtime
                                    {pyodideLoading && " (Loading...)"}
                                    {pyodideError && " (Error)"}
                                    {pyodide && " (Ready)"}
                                </p>
                                {pyodideError && (
                                    <p className={cn(
                                        textStyles(isDark, { size: 'xs' }),
                                        "mt-1",
                                        isDark ? "text-red-400" : "text-red-600"
                                    )}>
                                        {pyodideError.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Builder Status */}
                        <div className={cn(
                            "flex items-center gap-3 p-3 rounded-md",
                            isDark ? "bg-[#2d4222]" : "bg-gray-50"
                        )}>
                            <div className="flex-shrink-0">
                                {builderLoading ? (
                                    <ArrowPathIcon className={cn(iconStyles(isDark, 'md'), "text-blue-500 animate-spin")} />
                                ) : builderError ? (
                                    <ExclamationTriangleIcon className={cn(iconStyles(isDark, 'md'), "text-red-500")} />
                                ) : builder ? (
                                    <CheckCircleIcon className={cn(iconStyles(isDark, 'md'), "text-green-500")} />
                                ) : (
                                    <div className="h-5 w-5 bg-gray-300 rounded-full" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className={textStyles(isDark, { size: 'sm', weight: 'medium' })}>
                                    Container Builder
                                    {builderLoading && " (Loading...)"}
                                    {builderError && " (Error)"}
                                    {builder && " (Ready)"}
                                </p>
                                {builderError && (
                                    <p className={cn(
                                        textStyles(isDark, { size: 'xs' }),
                                        "mt-1",
                                        isDark ? "text-red-400" : "text-red-600"
                                    )}>
                                        {builderError}
                                    </p>
                                )}
                            </div>
                            {pyodide && !builder && !builderLoading && (
                                <button
                                    onClick={retryLoadBuilder}
                                    className={cn(buttonStyles(isDark, 'secondary', 'sm'))}
                                >
                                    {builderError ? "Retry" : "Load Builder"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Build Options */}
                {isReady && (
                    <div className="mb-6">
                        <h3 className={cn(textStyles(isDark, { size: 'lg', weight: 'medium', color: 'primary' }), "mb-3")}>
                            Build Options
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={cn(
                                    textStyles(isDark, { size: 'sm', weight: 'medium' }),
                                    "block mb-1",
                                    isDark ? "text-[#d1d5db]" : "text-gray-700"
                                )}>
                                    Architecture
                                </label>
                                <select
                                    className={cn(inputStyles(isDark), "w-full")}
                                    value={buildOptions.architecture}
                                    onChange={(e) =>
                                        setBuildOptions({
                                            ...buildOptions,
                                            architecture: e.target.value,
                                        })
                                    }
                                >
                                    <option value="x86_64">x86_64</option>
                                    <option value="aarch64">aarch64</option>
                                </select>
                            </div>
                            <div>
                                <label className={cn(
                                    textStyles(isDark, { size: 'sm', weight: 'medium' }),
                                    "block mb-1",
                                    isDark ? "text-[#d1d5db]" : "text-gray-700"
                                )}>
                                    Max Parallel Jobs
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="16"
                                    className={cn(inputStyles(isDark), "w-full")}
                                    value={buildOptions.maxParallelJobs}
                                    onChange={(e) =>
                                        setBuildOptions({
                                            ...buildOptions,
                                            maxParallelJobs: parseInt(e.target.value) || 4,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className={cn(
                                        "mr-2 rounded border-gray-300 focus:ring-2 focus:ring-offset-0",
                                        isDark
                                            ? "bg-[#161a0e] border-[#2d4222] text-[#7bb33a] focus:ring-[#7bb33a]/20"
                                            : "text-green-600 focus:ring-green-500/20"
                                    )}
                                    checked={buildOptions.ignoreArchitecture}
                                    onChange={(e) =>
                                        setBuildOptions({
                                            ...buildOptions,
                                            ignoreArchitecture: e.target.checked,
                                        })
                                    }
                                />
                                <span className={cn(
                                    textStyles(isDark, { size: 'sm' }),
                                    isDark ? "text-[#d1d5db]" : "text-gray-700"
                                )}>
                                    Ignore Architecture Constraints
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Validation Section */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                        <h3 className={textStyles(isDark, { size: 'lg', weight: 'medium', color: 'primary' })}>Validation</h3>
                        {!pyodide ? (
                            <button
                                onClick={loadPyodide}
                                disabled={pyodideLoading}
                                className={cn(
                                    buttonStyles(isDark, 'primary', 'md'),
                                    "flex items-center gap-2",
                                    pyodideLoading && "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {pyodideLoading ? (
                                    <ArrowPathIcon className={cn(iconStyles(isDark, 'sm'), "animate-spin")} />
                                ) : (
                                    <PlayIcon className={iconStyles(isDark, 'sm')} />
                                )}
                                {pyodideLoading ? "Loading Pyodide..." : "Load Pyodide"}
                            </button>
                        ) : (
                            <button
                                onClick={validateRecipe}
                                disabled={!canValidate}
                                className={cn(
                                    buttonStyles(isDark, 'primary', 'md'),
                                    "flex items-center gap-2",
                                    !canValidate && "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {validating ? (
                                    <ArrowPathIcon className={cn(iconStyles(isDark, 'sm'), "animate-spin")} />
                                ) : (
                                    <PlayIcon className={iconStyles(isDark, 'sm')} />
                                )}
                                {validating ? "Validating..." : "Validate & Generate"}
                            </button>
                        )}
                    </div>

                    {disabled && disabledReason && (
                        <div className={cn(
                            "p-4 border rounded-md",
                            isDark ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"
                        )}>
                            <p className={cn(
                                textStyles(isDark, { size: 'sm' }),
                                isDark ? "text-red-400" : "text-red-800"
                            )}>
                                {disabledReason}
                            </p>
                        </div>
                    )}

                    {!disabled && !isReady && (
                        <div className={cn(
                            "p-4 border rounded-md",
                            isDark ? "bg-yellow-900/20 border-yellow-700" : "bg-yellow-50 border-yellow-200"
                        )}>
                            <p className={cn(
                                textStyles(isDark, { size: 'sm' }),
                                isDark ? "text-yellow-400" : "text-yellow-800"
                            )}>
                                Please load Pyodide and the builder to validate your recipe.
                            </p>
                        </div>
                    )}

                    {validationResult && (
                        <div
                            className={cn(
                                "p-4 rounded-md border",
                                validationResult.success
                                    ? (isDark ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-200")
                                    : (isDark ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200")
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {validationResult.success ? (
                                        <CheckCircleIcon className={cn(iconStyles(isDark, 'md'), "text-green-500")} />
                                    ) : (
                                        <ExclamationTriangleIcon className={cn(iconStyles(isDark, 'md'), "text-red-500")} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={cn(
                                            textStyles(isDark, { size: 'sm', weight: 'medium' }),
                                            validationResult.success
                                                ? (isDark ? "text-green-400" : "text-green-800")
                                                : (isDark ? "text-red-400" : "text-red-800")
                                        )}
                                    >
                                        {validationResult.success
                                            ? "Validation Successful!"
                                            : "Validation Failed"}
                                    </p>
                                    {validationResult.error && (
                                        /* Display the error message as a code block with newlines */
                                        <pre className={cn(
                                            "mt-2 text-sm whitespace-pre-wrap break-words overflow-x-auto",
                                            isDark ? "text-red-400" : "text-red-700"
                                        )}>
                                            {validationResult.error}
                                        </pre>
                                    )}
                                    {validationResult.success && (
                                        <div className={cn(
                                            "mt-2 space-y-1",
                                            textStyles(isDark, { size: 'sm' }),
                                            isDark ? "text-green-400" : "text-green-700"
                                        )}>
                                            <p>✓ Dockerfile generated successfully</p>
                                            {validationResult.deployBins &&
                                                validationResult.deployBins.length > 0 && (
                                                    <p className="break-words">
                                                        ✓ Deploy binaries:{" "}
                                                        <span className="font-mono text-xs">
                                                            {validationResult.deployBins.join(", ")}
                                                        </span>
                                                    </p>
                                                )}
                                            {validationResult.deployPath &&
                                                validationResult.deployPath.length > 0 && (
                                                    <p className="break-words">
                                                        ✓ Deploy paths:{" "}
                                                        <span className="font-mono text-xs">
                                                            {validationResult.deployPath.join(", ")}
                                                        </span>
                                                    </p>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dockerfile Display */}
                {validationResult?.success && validationResult.dockerfile && (
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
                )}

                {/* Additional Information */}
                {validationResult?.success && validationResult.readme && (
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