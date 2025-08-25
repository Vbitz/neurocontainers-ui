import React, { useState, useRef, useEffect, useCallback } from "react";
import { Directive } from "@/components/common";
import { runDirectiveMetadata } from "@/components/directives/runCommand";
import { getAllDirectives } from "@/components/directives";
import { cn, iconStyles, textStyles } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";
import { MagnifyingGlassIcon, XMarkIcon, PlusIcon, PlayIcon } from "@heroicons/react/24/outline";

interface AddDirectiveSectionProps {
    onAddDirective: (directive: Directive, index?: number) => void;
    index?: number;
    variant?: 'default' | 'inline' | 'empty';
    emptyText?: { title: string; subtitle: string };
}

export default function AddDirectiveSection({
    onAddDirective,
    index,
    variant = 'default',
    emptyText = { title: "No directives added yet", subtitle: "Click here to start building your container" },
}: AddDirectiveSectionProps) {
    const { isDark } = useTheme();

    // All hooks must be at the top level - before any early returns
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const lastMousePositionRef = useRef({ x: -1, y: -1 });
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const mobileScrollContainerRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get directive types and filter them
    const directiveTypes = getAllDirectives();
    const filteredDirectives = directiveTypes.filter(directive => {
        const searchLower = searchTerm.toLowerCase();
        return (
            directive.label.toLowerCase().includes(searchLower) ||
            directive.description.toLowerCase().includes(searchLower) ||
            directive.keywords.some((keyword: string) =>
                keyword.toLowerCase().includes(searchLower)
            )
        );
    });

    const handleAddRunCommand = useCallback(() => {
        onAddDirective(runDirectiveMetadata.defaultValue, index);
    }, [onAddDirective, index]);

    const handleAddDirective = useCallback((directiveKey: string) => {
        const directive = directiveTypes.find(d => d.key === directiveKey);
        if (directive) {
            onAddDirective(directive.defaultValue, index);
            setIsOpen(false);
            setSearchTerm("");
            setFocusedIndex(-1);
        }
    }, [directiveTypes, onAddDirective, index]);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
    }, []);

    // Handle scroll events - lock mouse updates during scroll
    const handleScroll = useCallback(() => {
        isScrollingRef.current = true;

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        // Re-enable mouse tracking after scroll stops
        scrollTimeoutRef.current = setTimeout(() => {
            isScrollingRef.current = false;
        }, 150);
    }, []);

    // Container-level mouse tracking with elementFromPoint
    const handleContainerMouseMove = useCallback((event: React.MouseEvent) => {
        // Skip if currently scrolling
        if (isScrollingRef.current) {
            return;
        }

        const { clientX, clientY } = event;
        const lastPos = lastMousePositionRef.current;

        // Only proceed if mouse actually moved
        if (lastPos.x === clientX && lastPos.y === clientY) {
            return;
        }

        lastMousePositionRef.current = { x: clientX, y: clientY };

        // Find element under mouse cursor
        const elementUnderMouse = document.elementFromPoint(clientX, clientY);

        if (elementUnderMouse) {
            // Look for directive button (might be nested)
            let currentElement: Element | null = elementUnderMouse;
            let directiveIndex = -1;

            // Walk up the DOM tree to find data-directive-index
            while (currentElement && currentElement !== event.currentTarget) {
                const indexAttr = currentElement.getAttribute?.('data-directive-index');
                if (indexAttr !== null) {
                    directiveIndex = parseInt(indexAttr, 10);
                    break;
                }
                currentElement = currentElement.parentElement;
            }

            // Update focus if we found a valid directive
            if (directiveIndex >= 0 && directiveIndex < filteredDirectives.length) {
                setFocusedIndex(directiveIndex);
            }
        }
    }, [filteredDirectives.length]);

    // Keyboard navigation
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (!isOpen) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (event.key) {
            case "Escape":
                closeModal();
                break;
            case "ArrowDown":
                event.preventDefault();
                if (filteredDirectives.length > 0) {
                    setFocusedIndex((prev) =>
                        prev < filteredDirectives.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case "ArrowUp":
                event.preventDefault();
                if (filteredDirectives.length > 0) {
                    setFocusedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredDirectives.length - 1
                    );
                }
                break;
            case "Enter":
                event.preventDefault();
                if (focusedIndex >= 0 && filteredDirectives[focusedIndex]) {
                    handleAddDirective(filteredDirectives[focusedIndex].key);
                }
                break;
        }
    }, [isOpen, filteredDirectives, focusedIndex, closeModal, handleAddDirective]);

    // Auto-select first item when search changes
    useEffect(() => {
        setFocusedIndex(filteredDirectives.length > 0 ? 0 : -1);
    }, [searchTerm, filteredDirectives.length]);

    // Scroll to focused item with faster animation
    useEffect(() => {
        if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
            itemRefs.current[focusedIndex]?.scrollIntoView({
                behavior: "auto", // Changed from "smooth" to "auto" for instant scroll
                block: "nearest",
            });
        }
    }, [focusedIndex]);

    // Click outside handler
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                closeModal();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, closeModal]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Cleanup scroll timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    // Shared modal/dropdown component to reduce duplication
    const renderDirectiveModal = () => (
        <>
            {/* Mobile Full Screen Modal */}
            <div className={cn(
                "fixed inset-0 z-50 sm:hidden",
                "backdrop-blur-sm",
                isDark ? "bg-black/70" : "bg-black/50"
            )}>
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className={cn(
                        "w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden",
                        "backdrop-blur-xl border",
                        isDark 
                            ? "bg-[#161a0e]/95 border-[#2d4222]/50" 
                            : "bg-white/95 border-gray-200/50"
                    )}>
                        {/* Mobile Header */}
                        <div className={cn(
                            "flex items-center justify-between p-4 border-b",
                            isDark
                                ? "border-[#2d4222]/50 bg-[#1f2e18]/50"
                                : "border-gray-200/50 bg-[#f8fdf2]/50"
                        )}>
                            <h2 className={textStyles(isDark, {
                                size: 'lg',
                                weight: 'semibold',
                                color: 'primary'
                            })}>
                                Add Directive
                            </h2>
                            <button
                                onClick={closeModal}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isDark
                                        ? "hover:bg-[#2d4222]/50 text-[#9ca3af] hover:text-[#e8f5d0]"
                                        : "hover:bg-gray-100/50 text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mobile Search */}
                        <div className={cn(
                            "p-4 border-b",
                            isDark
                                ? "border-[#2d4222]/50 bg-[#1f2e18]/30"
                                : "border-gray-100/50 bg-[#f8fdf2]/30"
                        )}>
                            <div className="relative">
                                <MagnifyingGlassIcon className={cn(
                                    iconStyles(isDark, 'md'),
                                    "absolute left-3 top-1/2 transform -translate-y-1/2"
                                )} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search directives..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={cn(
                                        "w-full pl-10 pr-4 py-3 text-base rounded-xl border",
                                        "focus:outline-none focus:ring-2 focus:ring-offset-1",
                                        "backdrop-blur-sm",
                                        isDark
                                            ? "bg-[#1f2e18]/50 text-[#e8f5d0] placeholder-[#9ca3af] border-[#2d4222]/50 focus:border-[#7bb33a] focus:ring-[#7bb33a]"
                                            : "bg-white/50 text-gray-800 placeholder-gray-400 border-gray-200/50 focus:border-[#6aa329] focus:ring-[#6aa329]"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Mobile Directive List */}
                        <div
                            ref={mobileScrollContainerRef}
                            className="p-4 overflow-y-auto"
                            style={{ maxHeight: "calc(90vh - 200px)" }}
                            onMouseMove={handleContainerMouseMove}
                            onScroll={handleScroll}
                        >
                            {filteredDirectives.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredDirectives.map((directive, index) => {
                                        const IconComponent = directive.icon;
                                        const isFocused = index === focusedIndex;
                                        return (
                                            <button
                                                key={directive.key}
                                                ref={(el) => {
                                                    itemRefs.current[index] = el;
                                                }}
                                                type="button"
                                                onClick={() => handleAddDirective(directive.key)}
                                                data-directive-index={index}
                                                className={cn(
                                                    "w-full flex items-center gap-4 p-4 rounded-xl text-left",
                                                    "transition-all duration-200 border",
                                                    "backdrop-blur-sm",
                                                    isDark ? directive.color.dark : directive.color.light,
                                                    isFocused
                                                        ? (isDark
                                                            ? "ring-2 ring-[#7bb33a] ring-offset-1 shadow-lg scale-[1.02] bg-opacity-80"
                                                            : "ring-2 ring-[#6aa329] ring-offset-1 shadow-lg scale-[1.02] bg-opacity-80")
                                                        : ""
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                                                    "transition-all duration-200",
                                                    isDark ? directive.iconColor.dark : directive.iconColor.light,
                                                    isFocused ? "bg-white shadow-md" : "bg-white/70"
                                                )}>
                                                    <IconComponent className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={cn(
                                                        "font-semibold text-base mb-1",
                                                        isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                                    )}>
                                                        {directive.label}
                                                    </div>
                                                    <div className={cn(
                                                        "text-sm leading-relaxed",
                                                        isDark ? "text-[#9ca3af]" : "text-gray-500"
                                                    )}>
                                                        {directive.description}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={cn(
                                    "text-center py-12",
                                    isDark ? "text-[#9ca3af]" : "text-gray-500"
                                )}>
                                    <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-base font-medium">No directives found</p>
                                    <p className="text-sm mt-2 opacity-75">Try a different search term</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Dropdown */}
            <div className={cn(
                "hidden sm:block absolute top-full left-0 right-0 mt-1 z-50",
                "rounded-lg border shadow-xl overflow-hidden",
                "animate-in fade-in-0 slide-in-from-top-1 duration-200",
                "backdrop-blur-xl",
                isDark 
                    ? "bg-[#161a0e]/95 border-[#2d4222]/50" 
                    : "bg-white/95 border-gray-200/50"
            )}>
                {/* Desktop Search */}
                <div className={cn(
                    "p-3 border-b",
                    "backdrop-blur-sm",
                    isDark ? "border-[#2d4222]/50 bg-[#1f2e18]/30" : "border-gray-100/50 bg-[#f8fdf2]/30"
                )}>
                    <div className="relative">
                        <MagnifyingGlassIcon className={cn(
                            iconStyles(isDark, 'sm'),
                            "absolute left-3 top-1/2 transform -translate-y-1/2"
                        )} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search directives..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={cn(
                                "w-full pl-10 pr-4 py-2 text-sm rounded-md border",
                                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                                "backdrop-blur-sm",
                                isDark
                                    ? "bg-[#1f2e18]/50 text-[#e8f5d0] placeholder-[#9ca3af] border-[#2d4222]/50 focus:border-[#7bb33a] focus:ring-[#7bb33a]"
                                    : "bg-white/50 text-gray-800 placeholder-gray-400 border-gray-200/50 focus:border-[#6aa329] focus:ring-[#6aa329]"
                            )}
                        />
                    </div>
                </div>

                {/* Desktop Directive List */}
                <div 
                    ref={scrollContainerRef}
                    className="max-h-60 overflow-y-auto p-2" 
                    onMouseMove={handleContainerMouseMove}
                    onScroll={handleScroll}
                >
                    {filteredDirectives.length > 0 ? (
                        <div className="space-y-1">
                            {filteredDirectives.map((directive, index) => {
                                const IconComponent = directive.icon;
                                const isFocused = index === focusedIndex;
                                return (
                                    <button
                                        key={directive.key}
                                        ref={(el) => {
                                            itemRefs.current[index] = el;
                                        }}
                                        type="button"
                                        onClick={() => handleAddDirective(directive.key)}
                                        onMouseEnter={() => setFocusedIndex(index)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-md text-left",
                                            "transition-colors duration-200",
                                            isDark
                                                ? "hover:bg-[#1f2e18]/50 text-[#e8f5d0]"
                                                : "hover:bg-gray-50/50 text-gray-900",
                                            isFocused && (isDark
                                                ? "bg-[#1f2e18]/50 ring-1 ring-[#7bb33a]/50"
                                                : "bg-gray-50/50 ring-1 ring-[#6aa329]/50")
                                        )}
                                    >
                                        <div className={cn(
                                            "flex-shrink-0 w-6 h-6 rounded flex items-center justify-center",
                                            isDark ? directive.iconColor.dark : directive.iconColor.light
                                        )}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={cn(
                                                "font-medium text-sm",
                                                isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                            )}>
                                                {directive.label}
                                            </div>
                                            <div className={cn(
                                                "text-xs truncate",
                                                isDark ? "text-[#9ca3af]" : "text-gray-500"
                                            )}>
                                                {directive.description}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={cn(
                            "text-center py-4",
                            isDark ? "text-[#9ca3af]" : "text-gray-500"
                        )}>
                            <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No directives found</p>
                        </div>
                    )}
                </div>

                {/* Desktop Footer with shortcuts */}
                {filteredDirectives.length > 0 && (
                    <div className={cn(
                        "px-4 py-2 border-t text-xs",
                        "backdrop-blur-sm",
                        isDark
                            ? "border-[#2d4222]/50 bg-[#1f2e18]/30 text-[#9ca3af]"
                            : "border-gray-100/50 bg-[#f8fdf2]/30 text-gray-500"
                    )}>
                        <div className="flex items-center justify-between">
                            <span>Use ↑↓ to navigate</span>
                            <span>Enter to select • Esc to close</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    // Early return for empty variant
    if (variant === 'empty') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add Directive Button */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        onKeyDown={handleKeyDown}
                        className={cn(
                            "group w-full text-center py-6",
                            "border-2 border-dashed rounded-lg transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-offset-1",
                            isDark
                                ? "text-[#e8f5d0] border-[#374151] hover:border-[#7bb33a] hover:bg-[#1f2e18] focus:ring-[#7bb33a]"
                                : "text-gray-900 border-gray-200 hover:border-[#6aa329] hover:bg-[#f8fdf2] focus:ring-[#6aa329]"
                        )}
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                        aria-label="Add your first directive"
                    >
                        <PlusIcon className={cn(
                            "mx-auto mb-2",
                            "w-6 h-6 group-hover:scale-110 transition-all duration-200",
                            isDark 
                                ? "text-[#e8f5d0] group-hover:text-[#7bb33a]" 
                                : "text-gray-900 group-hover:text-[#6aa329]"
                        )} />
                        <p className={cn(
                            "mb-1 text-base font-semibold",
                            isDark 
                                ? "text-[#e8f5d0] group-hover:text-[#7bb33a]" 
                                : "text-gray-900 group-hover:text-[#6aa329]"
                        )}>
                            {emptyText.title}
                        </p>
                        <p className={cn(
                            "text-sm",
                            isDark 
                                ? "text-[#9ca3af] group-hover:text-[#7bb33a]" 
                                : "text-gray-600 group-hover:text-[#6aa329]"
                        )}>
                            {emptyText.subtitle}
                        </p>
                    </button>

                    {/* Modal/Dropdown for empty variant */}
                    {isOpen && renderDirectiveModal()}
                </div>

                {/* Quick Add Run Command Button */}
                <button
                    type="button"
                    onClick={handleAddRunCommand}
                    className={cn(
                        "group w-full text-center py-6",
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
                        "w-6 h-6 group-hover:scale-110 transition-all duration-200",
                        isDark ? "text-[#e8a87c] group-hover:text-[#dc2626]" : "text-red-500 group-hover:text-red-600"
                    )} />
                    <p className={cn(
                        "mb-1 text-base font-semibold",
                        isDark ? "text-[#e8a87c] group-hover:text-[#dc2626]" : "text-red-600 group-hover:text-red-700"
                    )}>
                        Quick Add: Run Commands
                    </p>
                    <p className={cn(
                        "text-sm",
                        isDark ? "text-[#9ca3af] group-hover:text-[#dc2626]" : "text-gray-600 group-hover:text-red-600"
                    )}>
                        Add shell commands without browsing
                    </p>
                </button>
            </div>
        );
    }

    // Default variant
    if (variant === 'default') {
        return (
            <div className="flex items-center justify-center gap-4 py-4">
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        onKeyDown={handleKeyDown}
                        className={cn(
                            "group flex items-center gap-2 px-4 py-3",
                            "border-2 border-solid rounded-lg transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-offset-1",
                            isDark
                                ? "text-[#e8f5d0] border-[#2d4222] hover:border-[#7bb33a] hover:bg-[#1f2e18] focus:ring-[#7bb33a]"
                                : "text-gray-900 border-gray-300 hover:border-[#6aa329] hover:bg-[#f8fdf2] focus:ring-[#6aa329]"
                        )}
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                        aria-label="Add directive"
                    >
                        <PlusIcon className={cn(
                            "w-5 h-5 group-hover:scale-110 transition-all duration-200",
                            isDark 
                                ? "text-[#e8f5d0] group-hover:text-[#7bb33a]" 
                                : "text-gray-900 group-hover:text-[#6aa329]"
                        )} />
                        <span className={cn(
                            "text-base font-medium",
                            isDark 
                                ? "text-[#e8f5d0] group-hover:text-[#7bb33a]" 
                                : "text-gray-900 group-hover:text-[#6aa329]"
                        )}>
                            Add directive
                        </span>
                    </button>

                    {/* Modal/Dropdown for default variant */}
                    {isOpen && renderDirectiveModal()}
                </div>

                <button
                    type="button"
                    onClick={handleAddRunCommand}
                    className={cn(
                        "group flex items-center gap-2 px-4 py-3",
                        "border-2 border-solid rounded-lg transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-offset-1",
                        isDark
                            ? "border-[#5b2c2c] text-[#e8a87c] hover:border-[#dc2626] hover:bg-[#2d1b1b] focus:ring-[#dc2626]"
                            : "border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 focus:ring-red-400"
                    )}
                    aria-label="Add run command"
                >
                    <PlayIcon className={cn(
                        "w-5 h-5 group-hover:scale-110 transition-all duration-200",
                        isDark ? "text-[#e8a87c] group-hover:text-[#dc2626]" : "text-red-500 group-hover:text-red-600"
                    )} />
                    <span className={cn(
                        "text-base font-medium",
                        isDark ? "text-[#e8a87c] group-hover:text-[#dc2626]" : "text-red-600 group-hover:text-red-700"
                    )}>
                        Add run command
                    </span>
                </button>
            </div>
        );
    }

    // Inline variant (keep as-is)
    return (
        <div className="relative" ref={dropdownRef}>
            <div className={cn(
                "group w-full py-2 px-4 rounded-md transition-all duration-200",
                "border border-dashed opacity-30 hover:opacity-100",
                isDark
                    ? "border-[#374151] hover:border-[#7bb33a] hover:bg-[#1f2e18]/30"
                    : "border-gray-300 hover:border-[#6aa329] hover:bg-[#f8fdf2]/50"
            )}>
                <div className="flex items-center justify-center gap-6">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        onKeyDown={handleKeyDown}
                        className={cn(
                            "flex items-center gap-2 transition-colors duration-200",
                            isDark
                                ? "text-[#9ca3af] hover:text-[#7bb33a]"
                                : "text-gray-500 hover:text-[#6aa329]"
                        )}
                        aria-label="Add directive"
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Add directive</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleAddRunCommand}
                        className={cn(
                            "flex items-center gap-2 transition-colors duration-200",
                            isDark
                                ? "text-[#9ca3af] hover:text-[#7bb33a]"
                                : "text-gray-500 hover:text-[#6aa329]"
                        )}
                        aria-label="Add run command"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
                        </svg>
                        <span className="text-sm font-medium">Add run command</span>
                    </button>
                </div>
            </div>

            {/* Mobile Full Screen Modal */}
            {isOpen && (
                <div className={cn(
                    "fixed inset-0 z-50 sm:hidden",
                    "backdrop-blur-sm",
                    isDark ? "bg-black/70" : "bg-black/50"
                )}>
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className={cn(
                            "w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden",
                            "backdrop-blur-xl border",
                            isDark
                                ? "bg-[#161a0e]/95 border-[#2d4222]/50"
                                : "bg-white/95 border-gray-200/50"
                        )}>
                            {/* Mobile Header */}
                            <div className={cn(
                                "flex items-center justify-between p-4 border-b",
                                isDark
                                    ? "border-[#2d4222]/50 bg-[#1f2e18]/50"
                                    : "border-gray-200/50 bg-[#f8fdf2]/50"
                            )}>
                                <h2 className={textStyles(isDark, {
                                    size: 'lg',
                                    weight: 'semibold',
                                    color: 'primary'
                                })}>
                                    Add Directive
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        isDark
                                            ? "hover:bg-[#2d4222]/50 text-[#9ca3af] hover:text-[#e8f5d0]"
                                            : "hover:bg-gray-100/50 text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Mobile Search */}
                            <div className={cn(
                                "p-4 border-b",
                                isDark
                                    ? "border-[#2d4222]/50 bg-[#1f2e18]/30"
                                    : "border-gray-100/50 bg-[#f8fdf2]/30"
                            )}>
                                <div className="relative">
                                    <MagnifyingGlassIcon className={cn(
                                        iconStyles(isDark, 'md'),
                                        "absolute left-3 top-1/2 transform -translate-y-1/2"
                                    )} />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search directives..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className={cn(
                                            "w-full pl-10 pr-4 py-3 text-base rounded-xl border",
                                            "focus:outline-none focus:ring-2 focus:ring-offset-1",
                                            "backdrop-blur-sm",
                                            isDark
                                                ? "bg-[#1f2e18]/50 text-[#e8f5d0] placeholder-[#9ca3af] border-[#2d4222]/50 focus:border-[#7bb33a] focus:ring-[#7bb33a]"
                                                : "bg-white/50 text-gray-800 placeholder-gray-400 border-gray-200/50 focus:border-[#6aa329] focus:ring-[#6aa329]"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Mobile Directive List */}
                            <div
                                ref={mobileScrollContainerRef}
                                className="p-4 overflow-y-auto"
                                style={{ maxHeight: "calc(90vh - 200px)" }}
                                onMouseMove={handleContainerMouseMove}
                                onScroll={handleScroll}
                            >
                                {filteredDirectives.length > 0 ? (
                                    <div className="space-y-3">
                                        {filteredDirectives.map((directive, index) => {
                                            const IconComponent = directive.icon;
                                            const isFocused = index === focusedIndex;
                                            return (
                                                <button
                                                    key={directive.key}
                                                    ref={(el) => {
                                                        itemRefs.current[index] = el;
                                                    }}
                                                    type="button"
                                                    onClick={() => handleAddDirective(directive.key)}
                                                    data-directive-index={index}
                                                    className={cn(
                                                        "w-full flex items-center gap-4 p-4 rounded-xl text-left",
                                                        "transition-all duration-200 border",
                                                        "backdrop-blur-sm",
                                                        isDark ? directive.color.dark : directive.color.light,
                                                        isFocused
                                                            ? (isDark
                                                                ? "ring-2 ring-[#7bb33a] ring-offset-1 shadow-lg scale-[1.02] bg-opacity-80"
                                                                : "ring-2 ring-[#6aa329] ring-offset-1 shadow-lg scale-[1.02] bg-opacity-80")
                                                            : ""
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                                                        "transition-all duration-200",
                                                        isDark ? directive.iconColor.dark : directive.iconColor.light,
                                                        isFocused ? "bg-white shadow-md" : "bg-white/70"
                                                    )}>
                                                        <IconComponent className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn(
                                                            "font-semibold text-base mb-1",
                                                            isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                                        )}>
                                                            {directive.label}
                                                        </div>
                                                        <div className={cn(
                                                            "text-sm leading-relaxed",
                                                            isDark ? "text-[#9ca3af]" : "text-gray-500"
                                                        )}>
                                                            {directive.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "text-center py-12",
                                        isDark ? "text-[#9ca3af]" : "text-gray-500"
                                    )}>
                                        <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-base font-medium">No directives found</p>
                                        <p className="text-sm mt-2 opacity-75">Try a different search term</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Dropdown */}
            {isOpen && (
                <div className={cn(
                    "hidden sm:block absolute top-full left-0 right-0 mt-1 z-50",
                    "rounded-lg border shadow-xl overflow-hidden",
                    "animate-in fade-in-0 slide-in-from-top-1 duration-200",
                    "backdrop-blur-xl",
                    isDark
                        ? "bg-[#161a0e]/95 border-[#2d4222]/50"
                        : "bg-white/95 border-gray-200/50"
                )}>
                    {/* Desktop Search */}
                    <div className={cn(
                        "p-3 border-b",
                        "backdrop-blur-sm",
                        isDark ? "border-[#2d4222]/50 bg-[#1f2e18]/30" : "border-gray-100/50 bg-[#f8fdf2]/30"
                    )}>
                        <div className="relative">
                            <MagnifyingGlassIcon className={cn(
                                iconStyles(isDark, 'sm'),
                                "absolute left-3 top-1/2 transform -translate-y-1/2"
                            )} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search directives..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={cn(
                                    "w-full pl-10 pr-4 py-2 text-sm rounded-md border",
                                    "focus:outline-none focus:ring-2 focus:ring-offset-1",
                                    "backdrop-blur-sm",
                                    isDark
                                        ? "bg-[#1f2e18]/50 text-[#e8f5d0] placeholder-[#9ca3af] border-[#2d4222]/50 focus:border-[#7bb33a] focus:ring-[#7bb33a]"
                                        : "bg-white/50 text-gray-800 placeholder-gray-400 border-gray-200/50 focus:border-[#6aa329] focus:ring-[#6aa329]"
                                )}
                            />
                        </div>
                    </div>

                    {/* Desktop Directive List */}
                    <div
                        ref={scrollContainerRef}
                        className="max-h-60 overflow-y-auto p-2"
                        onMouseMove={handleContainerMouseMove}
                        onScroll={handleScroll}
                    >
                        {filteredDirectives.length > 0 ? (
                            <div className="space-y-1">
                                {filteredDirectives.map((directive, index) => {
                                    const IconComponent = directive.icon;
                                    const isFocused = index === focusedIndex;
                                    return (
                                        <button
                                            key={directive.key}
                                            ref={(el) => {
                                                itemRefs.current[index] = el;
                                            }}
                                            type="button"
                                            onClick={() => handleAddDirective(directive.key)}
                                            onMouseEnter={() => setFocusedIndex(index)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2 rounded-md text-left",
                                                "transition-colors duration-200",
                                                isDark
                                                    ? "hover:bg-[#1f2e18]/50 text-[#e8f5d0]"
                                                    : "hover:bg-gray-50/50 text-gray-900",
                                                isFocused && (isDark
                                                    ? "bg-[#1f2e18]/50 ring-1 ring-[#7bb33a]/50"
                                                    : "bg-gray-50/50 ring-1 ring-[#6aa329]/50")
                                            )}
                                        >
                                            <div className={cn(
                                                "flex-shrink-0 w-6 h-6 rounded flex items-center justify-center",
                                                isDark ? directive.iconColor.dark : directive.iconColor.light
                                            )}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={cn(
                                                    "font-medium text-sm",
                                                    isDark ? "text-[#e8f5d0]" : "text-gray-900"
                                                )}>
                                                    {directive.label}
                                                </div>
                                                <div className={cn(
                                                    "text-xs truncate",
                                                    isDark ? "text-[#9ca3af]" : "text-gray-500"
                                                )}>
                                                    {directive.description}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={cn(
                                "text-center py-4",
                                isDark ? "text-[#9ca3af]" : "text-gray-500"
                            )}>
                                <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No directives found</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop Footer with shortcuts */}
                    {filteredDirectives.length > 0 && (
                        <div className={cn(
                            "px-4 py-2 border-t text-xs",
                            "backdrop-blur-sm",
                            isDark
                                ? "border-[#2d4222]/50 bg-[#1f2e18]/30 text-[#9ca3af]"
                                : "border-gray-100/50 bg-[#f8fdf2]/30 text-gray-500"
                        )}>
                            <div className="flex items-center justify-between">
                                <span>Use ↑↓ to navigate</span>
                                <span>Enter to select • Esc to close</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}