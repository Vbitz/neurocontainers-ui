"use client";

import ReactMarkdown from "react-markdown";
import { createMarkdownComponents } from "@/lib/copyContent";
import { cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

interface InlineTemplateDescriptionProps {
  markdownContent: string;
  className?: string;
}

export function InlineTemplateDescription({ 
  markdownContent,
  className 
}: InlineTemplateDescriptionProps) {
  const { isDark } = useTheme();

  if (!markdownContent) {
    return null;
  }

  const markdownComponents = createMarkdownComponents(isDark);

  return (
    <div className={cn(
      "p-4 rounded-lg border backdrop-blur-sm",
      isDark 
        ? "bg-[#1f2e18]/30 border-[#2d4222]/50 text-[#c4e382]" 
        : "bg-white/30 border-gray-200/50 text-gray-700",
      className
    )}>
      <ReactMarkdown components={markdownComponents}>
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}