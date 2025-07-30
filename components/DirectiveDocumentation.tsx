"use client";

import { useState, useMemo } from "react";
import {
    XMarkIcon,
    BookOpenIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { getAllDirectives } from "@/components/directives";
import { cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

interface DirectiveDocumentationProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DirectiveDocumentation({
    isOpen,
    onClose,
}: DirectiveDocumentationProps) {
    const { isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const directives = getAllDirectives();

    // Categorize directives
    const categorizeDirectives = useMemo(() => {
        // Core directives - fundamental container building blocks
        const coreDirectiveKeys = [
            'install', 'environment', 'run', 'workdir', 'user', 'copy', 'file',
            'variables', 'deploy', 'test', 'include'
        ];

        // Group directives - composite/organizational directives
        const groupDirectiveKeys = [
            'group', 'shellScript', 'java', 'pipRequirements', 'minicondaYaml'
        ];

        // Template directives - pre-configured tools (everything else)
        const templateDirectiveKeys = directives
            .map(d => d.key)
            .filter(key => !coreDirectiveKeys.includes(key) && !groupDirectiveKeys.includes(key));

        const categorized = {
            core: directives.filter(d => coreDirectiveKeys.includes(d.key)),
            group: directives.filter(d => groupDirectiveKeys.includes(d.key)),
            template: directives.filter(d => templateDirectiveKeys.includes(d.key))
        };

        // Sort each category alphabetically
        Object.keys(categorized).forEach(category => {
            categorized[category as keyof typeof categorized].sort((a, b) => a.label.localeCompare(b.label));
        });

        return categorized;
    }, [directives]);

    // Filter and organize directives based on search query
    const filteredDirectives = useMemo(() => {
        if (!searchQuery.trim()) {
            // No search query - return all categories in order: Core, Group, Template
            return [
                ...categorizeDirectives.core,
                ...categorizeDirectives.group,
                ...categorizeDirectives.template
            ];
        }

        // Filter all directives based on search query
        const filtered = directives.filter(directive => {
            const query = searchQuery.toLowerCase();
            return (
                directive.label.toLowerCase().includes(query) ||
                directive.description.toLowerCase().includes(query) ||
                directive.keywords.some((keyword) =>
                    keyword.toLowerCase().includes(query)
                )
            );
        });
        return filtered.sort((a, b) => a.label.localeCompare(b.label));
    }, [directives, searchQuery, categorizeDirectives]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            {/* Enhanced background with better blur integration */}
            <div
                className="absolute inset-0 backdrop-blur-md"
                style={{
                    background: isDark
                        ? "radial-gradient(circle at 30% 20%, rgba(123,179,58,0.08), transparent 50%), radial-gradient(circle at 70% 80%, rgba(145,200,74,0.08), transparent 50%), linear-gradient(135deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.50) 100%)"
                        : "radial-gradient(circle at 30% 20%, rgba(106,163,41,0.12), transparent 50%), radial-gradient(circle at 70% 80%, rgba(79,123,56,0.12), transparent 50%), linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(248,249,251,0.70) 100%)",
                }}
            />
            <div
                className="absolute inset-0 opacity-10 animate-[movePattern_60s_linear_infinite]"
                style={{
                    backgroundImage:
                        "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"60\" height=\"60\" viewBox=\"0 0 60 60\"><circle cx=\"30\" cy=\"30\" r=\"1\" fill=\"%23ffffff\"/></svg>')",
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative w-full max-w-7xl h-full max-h-[95vh] sm:max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border backdrop-blur-sm",
                    isDark
                        ? "bg-black/40 border-white/20 shadow-black/50"
                        : "bg-white/90 border-gray-200/50 shadow-black/20"
                )}
            >
                {/* Header */}
                <div
                    className={cn(
                        "flex items-center justify-between px-5 py-3 border-b",
                        isDark ? "border-white/10" : "border-gray-200/50"
                    )}
                >
                    <div className="flex items-center space-x-3">
                        <BookOpenIcon
                            className={cn(
                                "h-6 w-6",
                                isDark ? "text-[#91c84a]" : "text-[#4f7b38]"
                            )}
                        />
                        <h2
                            className={cn(
                                "text-lg sm:text-xl font-semibold",
                                isDark ? "text-[#e8f5d0]" : "text-gray-900"
                            )}
                        >
                            <span className="hidden sm:inline">Directive </span>Documentation
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            isDark
                                ? "hover:bg-white/10 text-gray-300"
                                : "hover:bg-gray-100 text-gray-500"
                        )}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div
                        className={cn(
                            "w-80 border-r overflow-y-auto hidden lg:block backdrop-blur-md",
                            isDark
                                ? "border-white/10 bg-black/20"
                                : "border-gray-200/50 bg-white/30"
                        )}
                    >
                        <div className="p-4">
                            {/* Search */}
                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search directives..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={cn(
                                            "w-full pl-10 pr-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1",
                                            isDark
                                                ? "bg-[#0a0c08] border-[#2d4222] text-[#e8f5d0] placeholder-[#9ca3af] focus:ring-[#91c84a]"
                                                : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-[#15803d]"
                                        )}
                                    />
                                    <MagnifyingGlassIcon
                                        className={cn(
                                            "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
                                            isDark ? "text-[#9ca3af]" : "text-gray-400"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Navigation Links */}
                            {searchQuery.trim() ? (
                                // Search Results
                                <>
                                    <h3 className={cn(
                                        "text-sm font-semibold mb-3",
                                        isDark ? "text-[#91c84a]" : "text-gray-900"
                                    )}>
                                        Search Results ({filteredDirectives.length})
                                    </h3>
                                    <div className="space-y-1">
                                        {filteredDirectives.map((directive) => {
                                            const IconComponent = directive.icon;

                                            return (
                                                <button
                                                    key={directive.key}
                                                    onClick={() => {
                                                        const element = document.getElementById(`directive-${directive.key}`);
                                                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center space-x-3 p-3 rounded-lg text-left text-sm transition-colors",
                                                        isDark
                                                            ? "text-[#c4e382] hover:bg-[#1e2a16] hover:text-[#e8f5d0]"
                                                            : "text-gray-700 hover:bg-white hover:text-gray-900"
                                                    )}
                                                >
                                                    <IconComponent
                                                        className={cn(
                                                            "h-4 w-4 flex-shrink-0",
                                                            isDark ? directive.iconColor.dark : directive.iconColor.light
                                                        )}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">
                                                            {directive.label}
                                                        </div>
                                                        <div className={cn(
                                                            "text-xs truncate mt-0.5",
                                                            isDark ? "text-[#91c84a]/70" : "text-gray-500"
                                                        )}>
                                                            {directive.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                // Categorized Navigation
                                <div className="space-y-6">
                                    {/* Core Directives Category */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={cn(
                                                "w-2 h-2 rounded-full",
                                                isDark ? "bg-[#91c84a]" : "bg-[#15803d]"
                                            )}></span>
                                            <h3 className={cn(
                                                "text-sm font-semibold",
                                                isDark ? "text-[#91c84a]" : "text-gray-900"
                                            )}>
                                                Core Directives ({categorizeDirectives.core.length})
                                            </h3>
                                        </div>
                                        <div className="pl-4 space-y-1">
                                            {categorizeDirectives.core.map((directive) => {
                                                const IconComponent = directive.icon;

                                                return (
                                                    <button
                                                        key={directive.key}
                                                        onClick={() => {
                                                            const element = document.getElementById(`directive-${directive.key}`);
                                                            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center space-x-3 p-2 rounded-md text-left text-sm transition-colors",
                                                            isDark
                                                                ? "text-[#c4e382] hover:bg-[#1e2a16] hover:text-[#e8f5d0]"
                                                                : "text-gray-700 hover:bg-white hover:text-gray-900"
                                                        )}
                                                    >
                                                        <IconComponent
                                                            className={cn(
                                                                "h-4 w-4 flex-shrink-0",
                                                                isDark ? directive.iconColor.dark : directive.iconColor.light
                                                            )}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium truncate">
                                                                {directive.label}
                                                            </div>
                                                            <div className={cn(
                                                                "text-xs truncate mt-0.5",
                                                                isDark ? "text-[#91c84a]/70" : "text-gray-500"
                                                            )}>
                                                                {directive.description}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Group Directives Category */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={cn(
                                                "w-2 h-2 rounded-full",
                                                isDark ? "bg-blue-400" : "bg-blue-600"
                                            )}></span>
                                            <h3 className={cn(
                                                "text-sm font-semibold",
                                                isDark ? "text-[#91c84a]" : "text-gray-900"
                                            )}>
                                                Group Directives ({categorizeDirectives.group.length})
                                            </h3>
                                        </div>
                                        <div className="pl-4 space-y-1">
                                            {categorizeDirectives.group.map((directive) => {
                                                const IconComponent = directive.icon;

                                                return (
                                                    <button
                                                        key={directive.key}
                                                        onClick={() => {
                                                            const element = document.getElementById(`directive-${directive.key}`);
                                                            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center space-x-3 p-2 rounded-md text-left text-sm transition-colors",
                                                            isDark
                                                                ? "text-[#c4e382] hover:bg-[#1e2a16] hover:text-[#e8f5d0]"
                                                                : "text-gray-700 hover:bg-white hover:text-gray-900"
                                                        )}
                                                    >
                                                        <IconComponent
                                                            className={cn(
                                                                "h-4 w-4 flex-shrink-0",
                                                                isDark ? directive.iconColor.dark : directive.iconColor.light
                                                            )}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium truncate">
                                                                {directive.label}
                                                            </div>
                                                            <div className={cn(
                                                                "text-xs truncate mt-0.5",
                                                                isDark ? "text-[#91c84a]/70" : "text-gray-500"
                                                            )}>
                                                                {directive.description}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Template Directives Category */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={cn(
                                                "w-2 h-2 rounded-full",
                                                isDark ? "bg-purple-400" : "bg-purple-600"
                                            )}></span>
                                            <h3 className={cn(
                                                "text-sm font-semibold",
                                                isDark ? "text-[#91c84a]" : "text-gray-900"
                                            )}>
                                                Template Directives ({categorizeDirectives.template.length})
                                            </h3>
                                        </div>
                                        <div className="pl-4 space-y-1">
                                            {categorizeDirectives.template.map((directive) => {
                                                const IconComponent = directive.icon;

                                                return (
                                                    <button
                                                        key={directive.key}
                                                        onClick={() => {
                                                            const element = document.getElementById(`directive-${directive.key}`);
                                                            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center space-x-3 p-2 rounded-md text-left text-sm transition-colors",
                                                            isDark
                                                                ? "text-[#c4e382] hover:bg-[#1e2a16] hover:text-[#e8f5d0]"
                                                                : "text-gray-700 hover:bg-white hover:text-gray-900"
                                                        )}
                                                    >
                                                        <IconComponent
                                                            className={cn(
                                                                "h-4 w-4 flex-shrink-0",
                                                                isDark ? directive.iconColor.dark : directive.iconColor.light
                                                            )}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium truncate">
                                                                {directive.label}
                                                            </div>
                                                            <div className={cn(
                                                                "text-xs truncate mt-0.5",
                                                                isDark ? "text-[#91c84a]/70" : "text-gray-500"
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
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Mobile Search */}
                        <div
                            className={cn(
                                "lg:hidden p-4 border-b sticky top-0 z-10 backdrop-blur-md",
                                isDark
                                    ? "bg-black/30 border-white/10"
                                    : "bg-white/80 border-gray-200/50"
                            )}
                        >
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search directives..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cn(
                                        "w-full pl-10 pr-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1",
                                        isDark
                                            ? "bg-[#0a0c08] border-[#2d4222] text-[#e8f5d0] placeholder-[#9ca3af] focus:ring-[#91c84a]"
                                            : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-[#15803d]"
                                    )}
                                />
                                <MagnifyingGlassIcon
                                    className={cn(
                                        "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
                                        isDark ? "text-[#9ca3af]" : "text-gray-400"
                                    )}
                                />
                            </div>
                        </div>

                        <div className="p-4">
                            {searchQuery.trim() ? (
                                // Show search results without categories
                                <div className="space-y-8">
                                    {filteredDirectives.map((directive) => (
                                        <div key={directive.key} id={`directive-${directive.key}`} className="scroll-mt-6">
                                            {/* Directive Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                                                <div className="flex items-center space-x-3 sm:space-x-4">
                                                    <div className={cn(
                                                        "p-2 sm:p-3 rounded-lg flex-shrink-0",
                                                        isDark
                                                            ? directive.headerColor?.dark || "bg-gray-800"
                                                            : directive.headerColor?.light || "bg-gray-100"
                                                    )}>
                                                        <directive.icon
                                                            className={cn(
                                                                "h-6 w-6",
                                                                isDark
                                                                    ? directive.iconColor.dark
                                                                    : directive.iconColor.light
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3
                                                            className={cn(
                                                                "text-xl font-bold mb-1",
                                                                isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                                            )}
                                                        >
                                                            {directive.label}
                                                        </h3>
                                                        <p
                                                            className={cn(
                                                                "text-sm leading-relaxed",
                                                                isDark
                                                                    ? "text-[#c4e382]"
                                                                    : "text-gray-600"
                                                            )}
                                                        >
                                                            {directive.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Keywords */}
                                                {directive.keywords.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4
                                                            className={cn(
                                                                "text-sm font-semibold mb-2",
                                                                isDark
                                                                    ? "text-[#91c84a]"
                                                                    : "text-gray-900"
                                                            )}
                                                        >
                                                            Keywords
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {directive.keywords.map((keyword) => (
                                                                <span
                                                                    key={keyword}
                                                                    className={cn(
                                                                        "px-3 py-1.5 text-xs rounded-full font-medium",
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

                                                {/* Default Config */}
                                                <div className="mb-4">
                                                    <h4
                                                        className={cn(
                                                            "text-sm font-semibold mb-2",
                                                            isDark
                                                                ? "text-[#91c84a]"
                                                                : "text-gray-900"
                                                        )}
                                                    >
                                                        Default Configuration
                                                    </h4>
                                                    <div
                                                        className={cn(
                                                            "p-4 rounded-lg text-sm font-mono overflow-x-auto backdrop-blur-md",
                                                            isDark
                                                                ? "bg-black/30 border border-[#2d4222]/50 text-[#c4e382]"
                                                                : "bg-white/50 border border-gray-200/50 text-gray-700"
                                                        )}
                                                    >
                                                        <pre className="whitespace-pre-wrap">
                                                            {JSON.stringify(directive.defaultValue, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>

                                                {/* Interactive Example */}
                                                <div>
                                                    <h4
                                                        className={cn(
                                                            "text-sm font-semibold mb-3",
                                                            isDark
                                                                ? "text-[#91c84a]"
                                                                : "text-gray-900"
                                                        )}
                                                    >
                                                        Interactive Example
                                                    </h4>
                                                    <div
                                                        className={cn(
                                                            "border-2 rounded-lg overflow-hidden backdrop-blur-md",
                                                            isDark
                                                                ? "border-[#2d4222]/50 bg-black/10"
                                                                : "border-gray-200/50 bg-white/20"
                                                        )}
                                                    >
                                                        <directive.component
                                                            {...Object.fromEntries(
                                                                Object.entries(directive.defaultValue).map(
                                                                    ([key, value]) => [key, value]
                                                                )
                                                            )}
                                                            baseImage="ubuntu:24.04"
                                                            onChange={() => { }}
                                                            onConditionChange={() => { }}
                                                            headerColor={directive.headerColor}
                                                            borderColor={directive.borderColor}
                                                            iconColor={directive.iconColor}
                                                            icon={directive.icon}
                                                            controllers={{}}
                                                            documentationMode={true}
                                                            condition='arch=="x86_64"'
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {filteredDirectives.length === 0 && (
                                        <div className="text-center py-12">
                                            <MagnifyingGlassIcon className={cn(
                                                "h-16 w-16 mx-auto mb-4 opacity-50",
                                                isDark ? "text-[#91c84a]" : "text-gray-400"
                                            )} />
                                            <h3 className={cn(
                                                "text-lg font-medium mb-2",
                                                isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                            )}>
                                                No Directives Found
                                            </h3>
                                            <p className={cn(
                                                "text-sm",
                                                isDark ? "text-[#c4e382]" : "text-gray-600"
                                            )}>
                                                Try adjusting your search query to find relevant directives.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Show categorized directives
                                <div className="space-y-12">
                                    {/* Core Directives Section */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-8">
                                            <span className={cn(
                                                "w-3 h-3 rounded-full",
                                                isDark ? "bg-[#91c84a]" : "bg-[#15803d]"
                                            )}></span>
                                            <h2 className={cn(
                                                "text-2xl font-bold",
                                                isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                            )}>
                                                Core Directives
                                            </h2>
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-sm font-medium",
                                                isDark
                                                    ? "bg-[#2d4222] text-[#c4e382]"
                                                    : "bg-gray-100 text-gray-600"
                                            )}>
                                                {categorizeDirectives.core.length}
                                            </div>
                                        </div>
                                        <p className={cn(
                                            "text-base mb-8 leading-relaxed",
                                            isDark ? "text-[#c4e382]" : "text-gray-600"
                                        )}>
                                            Fundamental container building blocks for basic functionality like installing packages, setting environment variables, and running commands.
                                        </p>
                                        <div className="space-y-8">
                                            {categorizeDirectives.core.map((directive) => (
                                                <div key={directive.key} id={`directive-${directive.key}`} className="scroll-mt-6">
                                                    {/* Directive content - same structure as search results */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                                                        <div className="flex items-center space-x-3 sm:space-x-4">
                                                            <div className={cn(
                                                                "p-2 sm:p-3 rounded-lg flex-shrink-0",
                                                                isDark
                                                                    ? directive.headerColor?.dark || "bg-gray-800"
                                                                    : directive.headerColor?.light || "bg-gray-100"
                                                            )}>
                                                                <directive.icon
                                                                    className={cn(
                                                                        "h-5 w-5 sm:h-6 sm:w-6",
                                                                        isDark
                                                                            ? directive.iconColor.dark
                                                                            : directive.iconColor.light
                                                                    )}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className={cn(
                                                                    "text-xl sm:text-2xl font-bold mb-1 sm:mb-2",
                                                                    isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                                                )}>
                                                                    {directive.label}
                                                                </h3>
                                                                <p className={cn(
                                                                    "text-sm sm:text-base leading-relaxed",
                                                                    isDark ? "text-[#c4e382]" : "text-gray-600"
                                                                )}>
                                                                    {directive.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Keywords */}
                                                    {directive.keywords.length > 0 && (
                                                        <div className="mb-6">
                                                            <h4 className={cn(
                                                                "text-sm font-semibold mb-3",
                                                                isDark ? "text-[#91c84a]" : "text-gray-900"
                                                            )}>
                                                                Keywords
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {directive.keywords.map((keyword) => (
                                                                    <span
                                                                        key={keyword}
                                                                        className={cn(
                                                                            "px-3 py-1.5 text-xs rounded-full font-medium",
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
                                                            "text-sm font-semibold mb-3",
                                                            isDark ? "text-[#91c84a]" : "text-gray-900"
                                                        )}>
                                                            Default Configuration
                                                        </h4>
                                                        <div className={cn(
                                                            "p-4 rounded-lg text-sm font-mono overflow-x-auto",
                                                            isDark
                                                                ? "bg-[#161a0e] border border-[#2d4222] text-[#c4e382]"
                                                                : "bg-gray-50 border border-gray-200 text-gray-700"
                                                        )}>
                                                            <pre className="whitespace-pre-wrap">{JSON.stringify(directive.defaultValue, null, 2)}</pre>
                                                        </div>
                                                    </div>

                                                    {/* Interactive Example */}
                                                    <div className="mb-8">
                                                        <h4 className={cn(
                                                            "text-sm font-semibold mb-4",
                                                            isDark ? "text-[#91c84a]" : "text-gray-900"
                                                        )}>
                                                            Interactive Example with Documentation
                                                        </h4>
                                                        <div className={cn(
                                                            "border-2 rounded-lg overflow-hidden",
                                                            isDark ? "border-[#2d4222]" : "border-gray-200"
                                                        )}>
                                                            <directive.component
                                                                {...Object.fromEntries(
                                                                    Object.entries(directive.defaultValue).map(([key, value]) => [
                                                                        key,
                                                                        key === 'install' ? 'git curl wget nano' :
                                                                            key === 'environment' ? {
                                                                                DEPLOY_ENV_APP_PATH: '/opt/app/bin',
                                                                                DEPLOY_ENV_CONFIG_URL: 'https://example.com/config',
                                                                                PATH: '/usr/local/bin:/usr/bin:/bin',
                                                                                NODE_ENV: 'production'
                                                                            } :
                                                                                key === 'run' ? [
                                                                                    'echo "Setting up application environment"',
                                                                                    'mkdir -p /app /data /config',
                                                                                    'chmod 755 /app',
                                                                                    'echo "Installation complete"'
                                                                                ] :
                                                                                    key === 'workdir' ? '/app' :
                                                                                        key === 'user' ? 'appuser' :
                                                                                            key === 'copy' ? ['./src:/app/src', './config:/app/config'] :
                                                                                                value
                                                                    ])
                                                                )}
                                                                baseImage="ubuntu:24.04"
                                                                onChange={() => { }}
                                                                onConditionChange={() => { }}
                                                                headerColor={directive.headerColor}
                                                                borderColor={directive.borderColor}
                                                                iconColor={directive.iconColor}
                                                                icon={directive.icon}
                                                                controllers={{}}
                                                                documentationMode={true}
                                                                condition='arch=="x86_64"'
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Separator */}
                                                    <div className={cn(
                                                        "h-px my-8",
                                                        isDark ? "bg-[#2d4222]" : "bg-gray-200"
                                                    )} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Group Directives Section */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-8">
                                            <span className={cn(
                                                "w-3 h-3 rounded-full",
                                                isDark ? "bg-blue-400" : "bg-blue-600"
                                            )}></span>
                                            <h2 className={cn(
                                                "text-2xl font-bold",
                                                isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                            )}>
                                                Group Directives
                                            </h2>
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-sm font-medium",
                                                isDark
                                                    ? "bg-[#2d4222] text-[#c4e382]"
                                                    : "bg-gray-100 text-gray-600"
                                            )}>
                                                {categorizeDirectives.group.length}
                                            </div>
                                        </div>
                                        <p className={cn(
                                            "text-base mb-8 leading-relaxed",
                                            isDark ? "text-[#c4e382]" : "text-gray-600"
                                        )}>
                                            Composite directives that combine multiple operations or provide specialized workflows for common development patterns.
                                        </p>
                                        <div className="space-y-8">
                                            {categorizeDirectives.group.map((directive) => (
                                                <div key={directive.key} id={`directive-${directive.key}`} className="scroll-mt-6">
                                                    {/* Same directive content structure */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                                                        <div className="flex items-center space-x-3 sm:space-x-4">
                                                            <div className={cn(
                                                                "p-2 sm:p-3 rounded-lg flex-shrink-0",
                                                                isDark
                                                                    ? directive.headerColor?.dark || "bg-gray-800"
                                                                    : directive.headerColor?.light || "bg-gray-100"
                                                            )}>
                                                                <directive.icon
                                                                    className={cn(
                                                                        "h-5 w-5 sm:h-6 sm:w-6",
                                                                        isDark
                                                                            ? directive.iconColor.dark
                                                                            : directive.iconColor.light
                                                                    )}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className={cn(
                                                                    "text-xl sm:text-2xl font-bold mb-1 sm:mb-2",
                                                                    isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                                                )}>
                                                                    {directive.label}
                                                                </h3>
                                                                <p className={cn(
                                                                    "text-sm sm:text-base leading-relaxed",
                                                                    isDark ? "text-[#c4e382]" : "text-gray-600"
                                                                )}>
                                                                    {directive.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {directive.keywords.length > 0 && (
                                                        <div className="mb-6">
                                                            <h4 className={cn(
                                                                "text-sm font-semibold mb-3",
                                                                isDark ? "text-[#91c84a]" : "text-gray-900"
                                                            )}>
                                                                Keywords
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {directive.keywords.map((keyword) => (
                                                                    <span
                                                                        key={keyword}
                                                                        className={cn(
                                                                            "px-3 py-1.5 text-xs rounded-full font-medium",
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

                                                    <div className="mb-6">
                                                        <h4 className={cn(
                                                            "text-sm font-semibold mb-3",
                                                            isDark ? "text-[#91c84a]" : "text-gray-900"
                                                        )}>
                                                            Default Configuration
                                                        </h4>
                                                        <div className={cn(
                                                            "p-4 rounded-lg text-sm font-mono overflow-x-auto",
                                                            isDark
                                                                ? "bg-[#161a0e] border border-[#2d4222] text-[#c4e382]"
                                                                : "bg-gray-50 border border-gray-200 text-gray-700"
                                                        )}>
                                                            <pre className="whitespace-pre-wrap">{JSON.stringify(directive.defaultValue, null, 2)}</pre>
                                                        </div>
                                                    </div>

                                                    <div className="mb-8">
                                                        <h4 className={cn(
                                                            "text-sm font-semibold mb-4",
                                                            isDark ? "text-[#91c84a]" : "text-gray-900"
                                                        )}>
                                                            Interactive Example with Documentation
                                                        </h4>
                                                        <div className={cn(
                                                            "border-2 rounded-lg overflow-hidden",
                                                            isDark ? "border-[#2d4222]" : "border-gray-200"
                                                        )}>
                                                            <directive.component
                                                                {...Object.fromEntries(
                                                                    Object.entries(directive.defaultValue).map(([key, value]) => [
                                                                        key,
                                                                        key === 'install' ? 'git curl wget nano' :
                                                                            key === 'environment' ? {
                                                                                DEPLOY_ENV_APP_PATH: '/opt/app/bin',
                                                                                DEPLOY_ENV_CONFIG_URL: 'https://example.com/config',
                                                                                PATH: '/usr/local/bin:/usr/bin:/bin',
                                                                                NODE_ENV: 'production'
                                                                            } :
                                                                                key === 'run' ? [
                                                                                    'echo "Setting up application environment"',
                                                                                    'mkdir -p /app /data /config',
                                                                                    'chmod 755 /app',
                                                                                    'echo "Installation complete"'
                                                                                ] :
                                                                                    key === 'workdir' ? '/app' :
                                                                                        key === 'user' ? 'appuser' :
                                                                                            key === 'copy' ? ['./src:/app/src', './config:/app/config'] :
                                                                                                value
                                                                    ])
                                                                )}
                                                                baseImage="ubuntu:24.04"
                                                                onChange={() => { }}
                                                                onConditionChange={() => { }}
                                                                headerColor={directive.headerColor}
                                                                borderColor={directive.borderColor}
                                                                iconColor={directive.iconColor}
                                                                icon={directive.icon}
                                                                controllers={{}}
                                                                documentationMode={true}
                                                                condition='arch=="x86_64"'
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "h-px my-8",
                                                        isDark ? "bg-[#2d4222]" : "bg-gray-200"
                                                    )} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Template Directives Section */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-8">
                                            <span className={cn(
                                                "w-3 h-3 rounded-full",
                                                isDark ? "bg-purple-400" : "bg-purple-600"
                                            )}></span>
                                            <h2 className={cn(
                                                "text-2xl font-bold",
                                                isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                            )}>
                                                Template Directives
                                            </h2>
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-sm font-medium",
                                                isDark
                                                    ? "bg-[#2d4222] text-[#c4e382]"
                                                    : "bg-gray-100 text-gray-600"
                                            )}>
                                                {categorizeDirectives.template.length}
                                            </div>
                                        </div>
                                        <p className={cn(
                                            "text-base mb-8 leading-relaxed",
                                            isDark ? "text-[#c4e382]" : "text-gray-600"
                                        )}>
                                            Pre-configured templates for popular neuroimaging and scientific computing tools with optimized settings and dependencies.
                                        </p>
                                        <div className="space-y-8">
                                            {categorizeDirectives.template.map((directive) => (
                                                <div key={directive.key} id={`directive-${directive.key}`} className="scroll-mt-6">
                                                    {/* Same directive content structure */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                                                        <div className="flex items-center space-x-3 sm:space-x-4">
                                                            <div className={cn(
                                                                "p-2 sm:p-3 rounded-lg flex-shrink-0",
                                                                isDark
                                                                    ? directive.headerColor?.dark || "bg-gray-800"
                                                                    : directive.headerColor?.light || "bg-gray-100"
                                                            )}>
                                                                <directive.icon
                                                                    className={cn(
                                                                        "h-5 w-5 sm:h-6 sm:w-6",
                                                                        isDark
                                                                            ? directive.iconColor.dark
                                                                            : directive.iconColor.light
                                                                    )}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className={cn(
                                                                    "text-xl sm:text-2xl font-bold mb-1 sm:mb-2",
                                                                    isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                                                )}>
                                                                    {directive.label}
                                                                </h3>
                                                                <p className={cn(
                                                                    "text-sm sm:text-base leading-relaxed",
                                                                    isDark ? "text-[#c4e382]" : "text-gray-600"
                                                                )}>
                                                                    {directive.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {directive.keywords.length > 0 && (
                                                        <div className="mb-6">
                                                            <h4 className={cn(
                                                                "text-sm font-semibold mb-3",
                                                                isDark ? "text-[#91c84a]" : "text-gray-900"
                                                            )}>
                                                                Keywords
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {directive.keywords.map((keyword) => (
                                                                    <span
                                                                        key={keyword}
                                                                        className={cn(
                                                                            "px-3 py-1.5 text-xs rounded-full font-medium",
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

                                                    <div className="mb-6">
                                                        <h4 className={cn(
                                                            "text-sm font-semibold mb-3",
                                                            isDark ? "text-[#91c84a]" : "text-gray-900"
                                                        )}>
                                                            Default Configuration
                                                        </h4>
                                                        <div className={cn(
                                                            "p-4 rounded-lg text-sm font-mono overflow-x-auto",
                                                            isDark
                                                                ? "bg-[#161a0e] border border-[#2d4222] text-[#c4e382]"
                                                                : "bg-gray-50 border border-gray-200 text-gray-700"
                                                        )}>
                                                            <pre className="whitespace-pre-wrap">{JSON.stringify(directive.defaultValue, null, 2)}</pre>
                                                        </div>
                                                    </div>

                                                    <div className="mb-8">
                                                        <h4 className={cn(
                                                            "text-sm font-semibold mb-4",
                                                            isDark ? "text-[#91c84a]" : "text-gray-900"
                                                        )}>
                                                            Interactive Example with Documentation
                                                        </h4>
                                                        <div className={cn(
                                                            "border-2 rounded-lg overflow-hidden",
                                                            isDark ? "border-[#2d4222]" : "border-gray-200"
                                                        )}>
                                                            <directive.component
                                                                {...Object.fromEntries(
                                                                    Object.entries(directive.defaultValue).map(([key, value]) => [
                                                                        key,
                                                                        key === 'install' ? 'git curl wget nano' :
                                                                            key === 'environment' ? {
                                                                                DEPLOY_ENV_APP_PATH: '/opt/app/bin',
                                                                                DEPLOY_ENV_CONFIG_URL: 'https://example.com/config',
                                                                                PATH: '/usr/local/bin:/usr/bin:/bin',
                                                                                NODE_ENV: 'production'
                                                                            } :
                                                                                key === 'run' ? [
                                                                                    'echo "Setting up application environment"',
                                                                                    'mkdir -p /app /data /config',
                                                                                    'chmod 755 /app',
                                                                                    'echo "Installation complete"'
                                                                                ] :
                                                                                    key === 'workdir' ? '/app' :
                                                                                        key === 'user' ? 'appuser' :
                                                                                            key === 'copy' ? ['./src:/app/src', './config:/app/config'] :
                                                                                                value
                                                                    ])
                                                                )}
                                                                baseImage="ubuntu:24.04"
                                                                onChange={() => { }}
                                                                onConditionChange={() => { }}
                                                                headerColor={directive.headerColor}
                                                                borderColor={directive.borderColor}
                                                                iconColor={directive.iconColor}
                                                                icon={directive.icon}
                                                                controllers={{}}
                                                                documentationMode={true}
                                                                condition='arch=="x86_64"'
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Separator - only if not last item */}
                                                    {directive !== categorizeDirectives.template[categorizeDirectives.template.length - 1] && (
                                                        <div className={cn(
                                                            "h-px my-8",
                                                            isDark ? "bg-[#2d4222]" : "bg-gray-200"
                                                        )} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}