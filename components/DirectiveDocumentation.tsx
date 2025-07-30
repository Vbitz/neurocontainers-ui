"use client";

import { useState, useMemo } from "react";
import { XMarkIcon, BookOpenIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getAllDirectives } from "@/components/directives";
import { cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

interface DirectiveDocumentationProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DirectiveDocumentation({ isOpen, onClose }: DirectiveDocumentationProps) {
    const { isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const directives = getAllDirectives();

    // Filter and sort directives based on search query
    const filteredDirectives = useMemo(() => {
        const filtered = directives.filter(directive => {
            const query = searchQuery.toLowerCase();
            return (
                directive.label.toLowerCase().includes(query) ||
                directive.description.toLowerCase().includes(query) ||
                directive.keywords.some(keyword => keyword.toLowerCase().includes(query))
            );
        });
        return filtered.sort((a, b) => a.label.localeCompare(b.label));
    }, [directives, searchQuery]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4">
            <div 
                className={cn(
                    "w-full max-w-7xl h-full max-h-[95vh] sm:max-h-[90vh] rounded-none sm:rounded-lg shadow-xl flex flex-col overflow-hidden",
                    isDark 
                        ? "bg-[#0a0c08] border-0 sm:border border-[#2d4222]" 
                        : "bg-white border-0 sm:border border-gray-200"
                )}
            >
                {/* Header */}
                <div className={cn(
                    "flex items-center justify-between p-4 sm:p-6 border-b",
                    isDark ? "border-[#2d4222]" : "border-gray-200"
                )}>
                    <div className="flex items-center space-x-3">
                        <BookOpenIcon className={cn("h-6 w-6", isDark ? "text-[#91c84a]" : "text-[#4f7b38]")} />
                        <h2 className={cn("text-lg sm:text-xl font-semibold", isDark ? "text-[#e8f5d0]" : "text-gray-900")}>
                            <span className="hidden sm:inline">Directive </span>Documentation
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
                    {/* Navigation Sidebar */}
                    <div className={cn(
                        "w-80 border-r overflow-y-auto hidden lg:block",
                        isDark ? "border-[#2d4222] bg-[#161a0e]" : "border-gray-200 bg-gray-50"
                    )}>
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
                                                : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-[#4f7b38]"
                                        )}
                                    />
                                    <MagnifyingGlassIcon className={cn(
                                        "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
                                        isDark ? "text-[#9ca3af]" : "text-gray-400"
                                    )} />
                                </div>
                            </div>

                            {/* Navigation Links */}
                            <h3 className={cn(
                                "text-sm font-semibold mb-3",
                                isDark ? "text-[#91c84a]" : "text-gray-900"
                            )}>
                                Available Directives ({filteredDirectives.length})
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
                        </div>
                    </div>

                    {/* Documentation Content - All Directives */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Mobile Search Bar */}
                        <div className={cn(
                            "lg:hidden p-4 border-b sticky top-0 z-10",
                            isDark ? "bg-[#0a0c08] border-[#2d4222]" : "bg-white border-gray-200"
                        )}>
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
                                            : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-[#4f7b38]"
                                    )}
                                />
                                <MagnifyingGlassIcon className={cn(
                                    "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
                                    isDark ? "text-[#9ca3af]" : "text-gray-400"
                                )} />
                            </div>
                        </div>

                        <div className="p-4 space-y-8">
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
                                                // Create props based on the directive's default values
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
                                                onChange={() => {}}
                                                onConditionChange={() => {}}
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
                    </div>
                </div>
            </div>
        </div>
    );
}