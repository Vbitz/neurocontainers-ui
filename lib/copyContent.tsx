/**
 * Utilities for working with copy content from markdown files
 */

import React from 'react';
import type { Components } from 'react-markdown';

/**
 * Custom components for react-markdown that apply theme-aware styling
 */
export function createMarkdownComponents(isDark: boolean): Components {
  return {
    // Headers
    h1: ({ children, ...props }) => (
      <h1 
        className={`text-2xl font-bold mb-4 mt-8 first:mt-0 ${
          isDark ? 'text-[#e8f5d0]' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 
        className={`text-xl font-semibold mb-3 mt-6 first:mt-0 ${
          isDark ? 'text-[#e8f5d0]' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 
        className={`text-lg font-semibold mb-2 mt-4 first:mt-0 ${
          isDark ? 'text-[#e8f5d0]' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </h3>
    ),
    
    // Paragraphs
    p: ({ children, ...props }) => (
      <p 
        className={`mb-3 leading-relaxed ${
          isDark ? 'text-[#c4e382]' : 'text-gray-700'
        }`}
        {...props}
      >
        {children}
      </p>
    ),
    
    // Lists
    ul: ({ children, ...props }) => (
      <ul 
        className="list-disc list-inside mb-4 space-y-1"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol 
        className="list-decimal list-inside mb-4 space-y-1"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li 
        className={`mb-1 ${
          isDark ? 'text-[#c4e382]' : 'text-gray-700'
        }`}
        {...props}
      >
        {children}
      </li>
    ),
    
    // Text styling
    strong: ({ children, ...props }) => (
      <strong 
        className={`font-semibold ${
          isDark ? 'text-[#e8f5d0]' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em 
        className={isDark ? 'text-[#d1d5db]' : 'text-gray-600'}
        {...props}
      >
        {children}
      </em>
    ),
    
    // Code
    code: ({ children, className, ...props }) => {
      const isInline = !className;
      
      if (isInline) {
        return (
          <code 
            className={`px-1 py-0.5 rounded text-sm font-mono ${
              isDark 
                ? 'bg-[#2d4222] text-[#91c84a]' 
                : 'bg-gray-100 text-gray-800'
            }`}
            {...props}
          >
            {children}
          </code>
        );
      }
      
      return (
        <code 
          className={`block p-3 rounded-lg text-sm font-mono whitespace-pre-wrap ${
            isDark 
              ? 'bg-[#1f2e18] text-[#c4e382] border border-[#2d4222]' 
              : 'bg-gray-50 text-gray-800 border border-gray-200'
          }`}
          {...props}
        >
          {children}
        </code>
      );
    },
    
    // Blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote 
        className={`border-l-4 pl-4 my-4 italic ${
          isDark 
            ? 'border-[#7bb33a] text-[#d1d5db]' 
            : 'border-[#6aa329] text-gray-600'
        }`}
        {...props}
      >
        {children}
      </blockquote>
    ),
    
    // Horizontal rules
    hr: ({ ...props }) => (
      <hr 
        className={`my-6 border-t ${
          isDark ? 'border-[#2d4222]' : 'border-gray-200'
        }`}
        {...props}
      />
    ),
  };
}

/**
 * Compact components for react-markdown specifically for help sections
 * Uses smaller sizes and tighter spacing
 */
export function createCompactMarkdownComponents(isDark: boolean): Components {
  return {
    // Headers - smaller sizes for help sections
    h1: ({ children, ...props }) => (
      <h1 
        className={`text-lg font-semibold mb-2 mt-3 first:mt-0 ${
          isDark ? 'text-[#e8f5d0]' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 
        className={`text-base font-medium mb-2 mt-3 first:mt-0 ${
          isDark ? 'text-[#e8f5d0]' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 
        className={`text-sm font-medium mb-1 mt-2 first:mt-0 ${
          isDark ? 'text-[#e8f5d0]' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </h3>
    ),
    
    // Paragraphs - smaller text and spacing
    p: ({ children, ...props }) => (
      <p 
        className={`mb-2 leading-snug text-sm ${
          isDark ? 'text-[#c4e382]' : 'text-gray-700'
        }`}
        {...props}
      >
        {children}
      </p>
    ),
    
    // Lists - compact spacing
    ul: ({ children, ...props }) => (
      <ul 
        className="list-disc list-inside mb-2 space-y-0.5 text-sm"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol 
        className="list-decimal list-inside mb-2 space-y-0.5 text-sm"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li 
        className={`text-sm ${
          isDark ? 'text-[#c4e382]' : 'text-gray-700'
        }`}
        {...props}
      >
        {children}
      </li>
    ),
    
    // Text styling - smaller sizes
    strong: ({ children, ...props }) => (
      <strong 
        className={`font-medium text-sm ${
          isDark ? 'text-[#e8f5d0]' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em 
        className={`text-sm ${isDark ? 'text-[#d1d5db]' : 'text-gray-600'}`}
        {...props}
      >
        {children}
      </em>
    ),
    
    // Code - compact
    code: ({ children, className, ...props }) => {
      const isInline = !className;
      
      if (isInline) {
        return (
          <code 
            className={`px-1 py-0.5 rounded text-xs font-mono ${
              isDark 
                ? 'bg-[#2d4222] text-[#91c84a]' 
                : 'bg-gray-100 text-gray-800'
            }`}
            {...props}
          >
            {children}
          </code>
        );
      }
      
      return (
        <code 
          className={`block p-2 rounded text-xs font-mono whitespace-pre-wrap ${
            isDark 
              ? 'bg-[#1f2e18] text-[#c4e382] border border-[#2d4222]' 
              : 'bg-gray-50 text-gray-800 border border-gray-200'
          }`}
          {...props}
        >
          {children}
        </code>
      );
    },
    
    // Blockquotes - compact
    blockquote: ({ children, ...props }) => (
      <blockquote 
        className={`border-l-2 pl-2 my-2 italic text-sm ${
          isDark 
            ? 'border-[#7bb33a] text-[#d1d5db]' 
            : 'border-[#6aa329] text-gray-600'
        }`}
        {...props}
      >
        {children}
      </blockquote>
    ),
    
    // Horizontal rules - compact
    hr: ({ ...props }) => (
      <hr 
        className={`my-3 border-t ${
          isDark ? 'border-[#2d4222]' : 'border-gray-200'
        }`}
        {...props}
      />
    ),
  };
}