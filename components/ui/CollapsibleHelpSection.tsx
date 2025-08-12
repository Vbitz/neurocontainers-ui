"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { createCompactMarkdownComponents } from "@/lib/copyContent";
import { getHelpSection } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";
import { CodeBracketIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface CollapsibleHelpSectionProps {
  markdownContent: string;
  className?: string;
  sourceFilePath?: string;
}

/**
 * Enhanced help section component that splits content at horizontal rules (---)
 * and makes everything after the first horizontal rule collapsible behind a "View More" button
 */
export function CollapsibleHelpSection({ 
  markdownContent,
  className,
  sourceFilePath
}: CollapsibleHelpSectionProps) {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!markdownContent) {
    return null;
  }

  // Split content at the first horizontal rule
  const parts = markdownContent.split(/^---\s*$/m, 2);
  const mainContent = parts[0]?.trim();
  const collapsibleContent = parts[1]?.trim();
  
  const hasCollapsibleContent = collapsibleContent && collapsibleContent.length > 0;

  const helpStyles = getHelpSection(isDark);
  const markdownComponents = createCompactMarkdownComponents(isDark);

  const handleGitHubClick = () => {
    if (sourceFilePath) {
      const githubUrl = `https://github.com/neurodesk/neurocontainers-ui/blob/main/${sourceFilePath}`;
      window.open(githubUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`${helpStyles.container} relative ${className || ''}`}>
      {sourceFilePath && (
        <button
          onClick={handleGitHubClick}
          className={`absolute top-2 right-2 p-1.5 rounded-md transition-all duration-200 hover:scale-110 ${
            isDark 
              ? 'text-[#91c84a] hover:bg-[#2d4222] hover:text-[#e8f5d0]' 
              : 'text-[#4f7b38] hover:bg-gray-100 hover:text-gray-900'
          }`}
          title="View source on GitHub"
          aria-label="View source on GitHub"
        >
          <CodeBracketIcon className="h-4 w-4" />
        </button>
      )}
      
      {/* Main content (always visible) */}
      <ReactMarkdown components={markdownComponents}>
        {mainContent}
      </ReactMarkdown>

      {/* View More button and collapsible content */}
      {hasCollapsibleContent && (
        <>
          <button
            onClick={handleToggle}
            className={`mt-3 flex items-center gap-2 text-sm font-medium transition-colors hover:underline ${
              isDark 
                ? 'text-[#91c84a] hover:text-[#e8f5d0]' 
                : 'text-[#4f7b38] hover:text-[#6aa329]'
            }`}
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                <span>View Less</span>
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                <span>View More</span>
              </>
            )}
          </button>

          {/* Collapsible content */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-opacity-20 border-gray-400">
              <ReactMarkdown components={markdownComponents}>
                {collapsibleContent}
              </ReactMarkdown>
            </div>
          )}
        </>
      )}
    </div>
  );
}