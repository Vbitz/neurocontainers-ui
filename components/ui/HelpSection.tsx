"use client";

import ReactMarkdown from "react-markdown";
import { createCompactMarkdownComponents } from "@/lib/copyContent";
import { getHelpSection } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";
import { CodeBracketIcon } from "@heroicons/react/24/outline";

interface HelpSectionProps {
  markdownContent: string;
  className?: string;
  sourceFilePath?: string;
}

/**
 * Reusable help section component that renders markdown content
 * with consistent theme-aware styling and optional GitHub source link
 */
export function HelpSection({ 
  markdownContent,
  className,
  sourceFilePath
}: HelpSectionProps) {
  const { isDark } = useTheme();

  if (!markdownContent) {
    return null;
  }

  const helpStyles = getHelpSection(isDark);
  const markdownComponents = createCompactMarkdownComponents(isDark);

  const handleGitHubClick = () => {
    if (sourceFilePath) {
      const githubUrl = `https://github.com/neurodesk/neurocontainers-ui/blob/main/${sourceFilePath}`;
      window.open(githubUrl, '_blank', 'noopener,noreferrer');
    }
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
      <ReactMarkdown components={markdownComponents}>
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}