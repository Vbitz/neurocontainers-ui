import { CATEGORIES } from "@/components/common";
import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getThemePresets, iconStyles, textStyles, cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

export function CategorySelector({
    selectedCategories,
    onChange,
    error,
    showValidation,
}: {
    selectedCategories: (keyof typeof CATEGORIES)[];
    onChange: (categories: (keyof typeof CATEGORIES)[]) => void;
    error: string | null;
    showValidation: boolean;
}) {
    const { isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Clear search when dropdown closes
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const toggleCategory = (category: keyof typeof CATEGORIES) => {
        if (selectedCategories.includes(category)) {
            onChange(selectedCategories.filter(c => c !== category));
        } else {
            onChange([...selectedCategories, category]);
        }
    };

    const removeCategory = (category: keyof typeof CATEGORIES) => {
        onChange(selectedCategories.filter(c => c !== category));
    };

    // Filter categories based on search term
    const filteredCategories = (Object.entries(CATEGORIES) as [keyof typeof CATEGORIES, { description: string; color: string }][])
        .filter(([category, { description }]) => {
            if (!searchTerm.trim()) return true;
            const searchLower = searchTerm.toLowerCase();
            return category.toLowerCase().includes(searchLower) || 
                   description.toLowerCase().includes(searchLower);
        });

    return (
        <div>
            <div className="relative" ref={dropdownRef}>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsOpen(!isOpen)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsOpen(!isOpen);
                        }
                    }}
                    className={cn(
                        getThemePresets(isDark).input,
                        "text-left shadow-sm cursor-pointer",
                        isDark ? "bg-[#161a0e]" : "bg-white",
                        showValidation && error ? 'border-red-500' : '',
                        "focus:outline-none focus:ring-2 focus:ring-offset-2",
                        isDark ? "focus:ring-[#7bb33a]" : "focus:ring-[#6aa329]"
                    )}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            {selectedCategories.length === 0 ? (
                                <span className={textStyles(isDark, { color: 'muted' })}>Select categories</span>
                            ) : (
                                <div className="flex flex-wrap gap-1">
                                    {selectedCategories.map(category => (
                                        <span
                                            key={category}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
                                                textStyles(isDark, { size: 'xs', weight: 'medium', color: 'secondary' }),
                                                isDark ? "bg-[#2d4222]" : "bg-[#f0f8e8]"
                                            )}
                                        >
                                            <div 
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: CATEGORIES[category]?.color || "#7bb33a" }}
                                            />
                                            {category}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeCategory(category);
                                                }}
                                                className={cn(
                                                    "inline-flex items-center justify-center rounded-full p-0.5",
                                                    isDark ? "hover:text-[#7bb33a] hover:bg-[#1f2e18]" : "hover:text-[#6aa329] hover:bg-[#e6f1d6]"
                                                )}
                                            >
                                                <XMarkIcon className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <ChevronDownIcon className={cn(
                            iconStyles(isDark, 'md'),
                            "transition-transform",
                            isDark ? "text-[#9ca3af]" : "text-gray-400",
                            isOpen && "rotate-180"
                        )} />
                    </div>
                </div>

                {isOpen && (
                    <div className={cn(
                        "absolute z-10 mt-1 w-full border rounded-md shadow-lg max-h-60 overflow-hidden",
                        isDark
                            ? "bg-[#161a0e] border-[#374151]"
                            : "bg-white border-gray-300"
                    )}>
                        {/* Search input */}
                        <div className={cn(
                            "p-3 border-b",
                            isDark ? "border-[#374151]" : "border-gray-200"
                        )}>
                            <div className="relative">
                                <MagnifyingGlassIcon className={cn(
                                    "absolute left-3 top-1/2 transform -translate-y-1/2",
                                    iconStyles(isDark, 'sm'),
                                    isDark ? "text-[#9ca3af]" : "text-gray-400"
                                )} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search categories..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className={cn(
                                        "w-full pl-9 pr-3 py-2 text-sm rounded-md border",
                                        isDark
                                            ? "bg-[#1f2937] border-[#374151] text-white placeholder-[#9ca3af] focus:ring-[#7bb33a] focus:border-[#7bb33a]"
                                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-[#6aa329] focus:border-[#6aa329]",
                                        "focus:outline-none focus:ring-2"
                                    )}
                                />
                            </div>
                        </div>
                        
                        {/* Category list */}
                        <div className="overflow-auto max-h-44">
                            {filteredCategories.length === 0 ? (
                                <div className={cn(
                                    "px-3 py-4 text-center",
                                    textStyles(isDark, { size: 'sm', color: 'muted' })
                                )}>
                                    No categories found
                                </div>
                            ) : (
                                filteredCategories.map(([category, { description, color }]) => (
                                    <label
                                        key={category}
                                        className={cn(
                                            "flex items-start gap-3 px-3 py-2 cursor-pointer",
                                            isDark ? "hover:bg-[#2d4222]" : "hover:bg-gray-50"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category)}
                                            onChange={() => toggleCategory(category)}
                                            className={cn(
                                                "mt-0.5 h-4 w-4 rounded",
                                                isDark
                                                    ? "text-[#7bb33a] border-[#374151] focus:ring-[#7bb33a] bg-[#161a0e]"
                                                    : "text-[#6aa329] border-gray-300 focus:ring-[#6aa329]"
                                            )}
                                        />
                                        <div 
                                            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                                            style={{ backgroundColor: color }}
                                        />
                                        <div className="flex-1">
                                            <div className={textStyles(isDark, { size: 'sm', weight: 'medium' })}>{category}</div>
                                            <div className={textStyles(isDark, { size: 'xs', color: 'muted' })}>{description}</div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            {showValidation && error && (
                <p className={cn(
                    "mt-1",
                    textStyles(isDark, { size: 'sm' }),
                    isDark ? "text-red-400" : "text-red-600"
                )}>
                    {error}
                </p>
            )}
        </div>
    );
}