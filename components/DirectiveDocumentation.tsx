"use client";

import { useState } from "react";
import { XMarkIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import { getAllDirectives } from "@/components/directives";
import { cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

interface DirectiveDocumentationProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DirectiveDocumentation({ isOpen, onClose }: DirectiveDocumentationProps) {
    const { isDark } = useTheme();
    const [selectedDirective, setSelectedDirective] = useState<string | null>(null);
    const directives = getAllDirectives();

    // Sort directives alphabetically by label
    const sortedDirectives = [...directives].sort((a, b) => a.label.localeCompare(b.label));

    const selectedDirectiveData = selectedDirective 
        ? directives.find(d => d.key === selectedDirective) 
        : null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div 
                className={cn(
                    "w-full max-w-6xl h-full max-h-[90vh] rounded-lg shadow-xl flex flex-col overflow-hidden",
                    isDark 
                        ? "bg-[#0a0c08] border border-[#2d4222]" 
                        : "bg-white border border-gray-200"
                )}
            >
                {/* Header */}
                <div className={cn(
                    "flex items-center justify-between p-6 border-b",
                    isDark ? "border-[#2d4222]" : "border-gray-200"
                )}>
                    <div className="flex items-center space-x-3">
                        <BookOpenIcon className={cn("h-6 w-6", isDark ? "text-[#91c84a]" : "text-[#4f7b38]")} />
                        <h2 className={cn("text-xl font-semibold", isDark ? "text-[#e8f5d0]" : "text-gray-900")}>
                            Directive Documentation
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            isDark 
                                ? "hover:bg-[#1e2a16] text-[#c4e382]" 
                                : "hover:bg-gray-100 text-gray-500"
                        )}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Table of Contents */}
                    <div className={cn(
                        "w-80 border-r overflow-y-auto",
                        isDark ? "border-[#2d4222] bg-[#161a0e]" : "border-gray-200 bg-gray-50"
                    )}>
                        <div className="p-4">
                            <h3 className={cn(
                                "text-sm font-semibold mb-3",
                                isDark ? "text-[#91c84a]" : "text-gray-900"
                            )}>
                                Available Directives ({sortedDirectives.length})
                            </h3>
                            <div className="space-y-1">
                                {sortedDirectives.map((directive) => {
                                    const IconComponent = directive.icon;
                                    const isSelected = selectedDirective === directive.key;
                                    
                                    return (
                                        <button
                                            key={directive.key}
                                            onClick={() => setSelectedDirective(directive.key)}
                                            className={cn(
                                                "w-full flex items-center space-x-3 p-3 rounded-lg text-left text-sm transition-colors",
                                                isSelected
                                                    ? isDark
                                                        ? "bg-[#2d4222] text-[#e8f5d0] border border-[#91c84a]/20"
                                                        : "bg-[#e6f1d6] text-gray-900 border border-[#91c84a]/30"
                                                    : isDark
                                                        ? "text-[#c4e382] hover:bg-[#1e2a16] hover:text-[#e8f5d0]"
                                                        : "text-gray-700 hover:bg-white hover:text-gray-900"
                                            )}
                                        >
                                            <IconComponent 
                                                className={cn(
                                                    "h-4 w-4 flex-shrink-0",
                                                    isSelected
                                                        ? isDark ? "text-[#91c84a]" : "text-[#4f7b38]"
                                                        : isDark ? directive.iconColor.dark : directive.iconColor.light
                                                )} 
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">
                                                    {directive.label}
                                                </div>
                                                <div className={cn(
                                                    "text-xs truncate mt-0.5",
                                                    isSelected
                                                        ? isDark ? "text-[#c4e382]" : "text-gray-600"
                                                        : isDark ? "text-[#91c84a]/70" : "text-gray-500"
                                                )}>
                                                    {directive.description}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Documentation Content */}
                    <div className="flex-1 overflow-y-auto">
                        {selectedDirectiveData ? (
                            <div className="p-6">
                                {/* Directive Header */}
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className={cn(
                                        "p-3 rounded-lg",
                                        isDark 
                                            ? selectedDirectiveData.headerColor?.dark || "bg-gray-800"
                                            : selectedDirectiveData.headerColor?.light || "bg-gray-100"
                                    )}>
                                        <selectedDirectiveData.icon 
                                            className={cn(
                                                "h-6 w-6",
                                                isDark 
                                                    ? selectedDirectiveData.iconColor.dark 
                                                    : selectedDirectiveData.iconColor.light
                                            )} 
                                        />
                                    </div>
                                    <div>
                                        <h3 className={cn(
                                            "text-2xl font-bold",
                                            isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                        )}>
                                            {selectedDirectiveData.label}
                                        </h3>
                                        <p className={cn(
                                            "text-sm",
                                            isDark ? "text-[#c4e382]" : "text-gray-600"
                                        )}>
                                            {selectedDirectiveData.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Keywords */}
                                {selectedDirectiveData.keywords.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className={cn(
                                            "text-sm font-semibold mb-2",
                                            isDark ? "text-[#91c84a]" : "text-gray-900"
                                        )}>
                                            Keywords
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedDirectiveData.keywords.map((keyword) => (
                                                <span
                                                    key={keyword}
                                                    className={cn(
                                                        "px-2 py-1 text-xs rounded-md font-medium",
                                                        isDark
                                                            ? "bg-[#2d4222] text-[#c4e382] border border-[#4f7b38]"
                                                            : "bg-gray-100 text-gray-700 border border-gray-200"
                                                    )}
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Default Configuration */}
                                <div className="mb-6">
                                    <h4 className={cn(
                                        "text-sm font-semibold mb-2",
                                        isDark ? "text-[#91c84a]" : "text-gray-900"
                                    )}>
                                        Default Configuration
                                    </h4>
                                    <div className={cn(
                                        "p-4 rounded-lg text-sm font-mono",
                                        isDark 
                                            ? "bg-[#161a0e] border border-[#2d4222] text-[#c4e382]"
                                            : "bg-gray-50 border border-gray-200 text-gray-700"
                                    )}>
                                        <pre>{JSON.stringify(selectedDirectiveData.defaultValue, null, 2)}</pre>
                                    </div>
                                </div>

                                {/* Detailed Documentation */}
                                <div>
                                    <h4 className={cn(
                                        "text-sm font-semibold mb-4",
                                        isDark ? "text-[#91c84a]" : "text-gray-900"
                                    )}>
                                        Detailed Documentation
                                    </h4>
                                    <div className={cn(
                                        "prose prose-sm max-w-none",
                                        isDark 
                                            ? "prose-invert prose-headings:text-[#e8f5d0] prose-p:text-[#c4e382] prose-strong:text-[#e8f5d0] prose-code:text-[#91c84a] prose-code:bg-[#161a0e] prose-pre:bg-[#161a0e] prose-pre:border prose-pre:border-[#2d4222]"
                                            : "prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-[#4f7b38] prose-code:bg-gray-100 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200"
                                    )}>
                                        {/* This would need to be extracted from the actual component's helpContent */}
                                        <p className={cn(isDark ? "text-[#c4e382]" : "text-gray-600")}>
                                            This directive allows you to {selectedDirectiveData.description.toLowerCase()}. 
                                            Refer to the individual directive component for detailed usage instructions and examples.
                                        </p>
                                        
                                        <div className={cn(
                                            "mt-4 p-4 rounded-lg border",
                                            isDark 
                                                ? "bg-blue-900/20 border-blue-700/30 text-blue-200"
                                                : "bg-blue-50 border-blue-200 text-blue-800"
                                        )}>
                                            <p className="text-sm">
                                                <strong>Note:</strong> For complete usage instructions, examples, and keyboard shortcuts, 
                                                add this directive to your container recipe and click the help icon in the directive header.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <BookOpenIcon className={cn(
                                        "h-16 w-16 mx-auto mb-4 opacity-50",
                                        isDark ? "text-[#91c84a]" : "text-gray-400"
                                    )} />
                                    <h3 className={cn(
                                        "text-lg font-medium mb-2",
                                        isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                    )}>
                                        Select a Directive
                                    </h3>
                                    <p className={cn(
                                        "text-sm",
                                        isDark ? "text-[#c4e382]" : "text-gray-600"
                                    )}>
                                        Choose a directive from the table of contents to view its documentation.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}