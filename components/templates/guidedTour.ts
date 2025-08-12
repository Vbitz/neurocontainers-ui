// Guided Tour Templates - separate from directive templates
import React from 'react';
import { CodeBracketIcon, BeakerIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { PYTHON_PACKAGE_TEMPLATE } from './pythonPackage';
import { R_PACKAGE_TEMPLATE } from './rPackage';
import { START_FROM_SCRATCH_TEMPLATE } from './startFromScratch';
import type { ContainerTemplate } from './pythonPackage';

export const GUIDED_TOUR_TEMPLATES: ContainerTemplate[] = [
    PYTHON_PACKAGE_TEMPLATE,
    R_PACKAGE_TEMPLATE,
    START_FROM_SCRATCH_TEMPLATE,
];

export const getGuidedTourTemplateById = (id: string): ContainerTemplate | undefined => {
    return GUIDED_TOUR_TEMPLATES.find(template => template.id === id);
};

export const getTemplateIcon = (templateId: string, className: string = "h-8 w-8") => {
    switch (templateId) {
        case 'python-package':
            return React.createElement(CodeBracketIcon, { className });
        case 'r-package':
            return React.createElement(ChartBarIcon, { className });
        case 'start-from-scratch':
            return React.createElement(BeakerIcon, { className });
        default:
            return React.createElement(CodeBracketIcon, { className });
    }
};

export type { ContainerTemplate, TemplateField } from './pythonPackage';