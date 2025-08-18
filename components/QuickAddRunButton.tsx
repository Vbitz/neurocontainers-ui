import React from "react";
import { Directive } from "@/components/common";
import { PlayIcon } from "@heroicons/react/24/outline";
import { runDirectiveMetadata } from "@/components/directives/runCommand";
import { getButtons, iconStyles, textStyles, cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

interface QuickAddRunButtonProps {
    onAddDirective: (directive: Directive, index?: number) => void;
    index?: number;
    variant?: 'default' | 'inline' | 'empty';
}

export default function QuickAddRunButton({
    onAddDirective,
    index,
    variant = 'default'
}: QuickAddRunButtonProps) {
    const { isDark } = useTheme();

    const handleAddRunCommand = () => {
        onAddDirective(runDirectiveMetadata.defaultValue, index);
    };

    if (variant === 'empty') {
        // For empty state, show a secondary button that complements the main AddDirectiveButton
        return (
            <button
                type="button"
                onClick={handleAddRunCommand}
                className={cn(
                    "group w-full text-center py-4 px-6",
                    "border-2 border-dashed rounded-lg transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-offset-1",
                    isDark
                        ? "border-[#5b2c2c] text-[#e8a87c] hover:border-[#dc2626] hover:bg-[#2d1b1b] focus:ring-[#dc2626]"
                        : "border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 focus:ring-red-400"
                )}
                aria-label="Add run command directive"
                title="Quickly add a run command directive - commonly used for custom commands"
            >
                <PlayIcon className={cn(
                    "mx-auto mb-2",
                    isDark ? "text-[#e8a87c] group-hover:text-[#dc2626]" : "text-red-500 group-hover:text-red-600",
                    "w-8 h-8 group-hover:scale-110 transition-all duration-200"
                )} />
                <p className={cn(
                    "mb-1 font-medium",
                    isDark ? "group-hover:text-[#dc2626]" : "group-hover:text-red-600"
                )}>
                    Quick Add: Run Commands
                </p>
                <p className={cn(
                    "text-sm",
                    isDark ? "group-hover:text-[#dc2626]" : "group-hover:text-red-600"
                )}>
                    Add shell commands without browsing
                </p>
            </button>
        );
    }

    function renderInlineButton() {
        return (
            <button
                type="button"
                onClick={handleAddRunCommand}
                className={cn(
                    "group flex items-center justify-center gap-2 w-full py-1.5",
                    "border border-dashed rounded-md transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-offset-1",
                    "opacity-50 hover:opacity-100",
                    isDark
                        ? "text-[#9ca3af] hover:text-[#dc2626] hover:bg-[#2d1b1b] border-[#374151] hover:border-[#dc2626] focus:ring-[#dc2626]"
                        : "text-gray-400 hover:text-red-600 hover:bg-red-50 border-gray-300 hover:border-red-400 focus:ring-red-400"
                )}
                aria-label="Add run command directive"
                title="Quickly add a run command directive"
            >
                <PlayIcon className={cn(iconStyles(isDark, 'sm'), "group-hover:scale-110 transition-transform duration-200")} />
                <span className={cn(
                    textStyles(isDark, { size: 'xs', weight: 'medium' }),
                    "hidden sm:inline",
                    isDark
                        ? "text-[#9ca3af] group-hover:text-[#dc2626]"
                        : "text-gray-500 group-hover:text-red-600"
                )}>
                    Run command
                </span>
            </button>
        );
    }

    if (variant === 'default') {
        return (
            <button
                type="button"
                onClick={handleAddRunCommand}
                className={cn(
                    getButtons(isDark).secondary,
                    "inline-flex items-center gap-2 min-w-0 flex-shrink-0",
                    "px-3 py-2 sm:px-4 sm:py-2.5"
                )}
                aria-label="Add run command directive"
                title="Quickly add a run command directive"
            >
                <PlayIcon className={cn(iconStyles(isDark, 'sm'), "flex-shrink-0")} />
                <span className="hidden sm:inline">Add Run Command</span>
                <span className="sm:hidden">Run</span>
            </button>
        );
    }

    return renderInlineButton();
}