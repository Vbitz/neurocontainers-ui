// Guided Tour Templates - separate from directive templates
import { PYTHON_PACKAGE_TEMPLATE } from './pythonPackage';
import type { ContainerTemplate } from './pythonPackage';

export const GUIDED_TOUR_TEMPLATES: ContainerTemplate[] = [
    PYTHON_PACKAGE_TEMPLATE,
];

export const getGuidedTourTemplateById = (id: string): ContainerTemplate | undefined => {
    return GUIDED_TOUR_TEMPLATES.find(template => template.id === id);
};

export type { ContainerTemplate, TemplateField } from './pythonPackage';