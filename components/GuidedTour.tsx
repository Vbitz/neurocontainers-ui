import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, BeakerIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ContainerTemplate, TemplateField, GUIDED_TOUR_TEMPLATES } from '@/components/directives/templates/guidedTour';
import { extractRepoName } from '@/components/directives/templates/pythonPackage';
import { ContainerRecipe } from '@/components/common';
import { useTheme } from '@/lib/ThemeContext';
import { cn } from '@/lib/styles';
import { LicenseSection } from '@/components/ui';
import PackageTagEditor from '@/components/ui/PackageTagEditor';
import { loadPackageDatabase } from '@/lib/packages';

interface GuidedTourProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (recipe: ContainerRecipe) => void;
    onPublish?: (recipe: ContainerRecipe) => void;
}

interface FormData {
    [fieldId: string]: string | string[] | object | null;
}

interface ValidationErrors {
    [fieldId: string]: string;
}

interface Package {
    name: string;
    description: string;
    version?: string;
    section?: string;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose, onComplete, onPublish }) => {
    const { isDark } = useTheme();
    
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState<ContainerTemplate | null>(null);
    const [formData, setFormData] = useState<FormData>({});
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [packageDatabase, setPackageDatabase] = useState<Package[]>([]);
    const [databaseLoaded, setDatabaseLoaded] = useState(false);
    const [isLoadingDatabase, setIsLoadingDatabase] = useState(false);

    const steps = [
        'Choose Template',
        'Configure Container', 
        'Review & Create'
    ];

    // Load package database
    useEffect(() => {
        const loadDatabase = async () => {
            setIsLoadingDatabase(true);
            try {
                const db = await loadPackageDatabase();
                setPackageDatabase(db);
                setDatabaseLoaded(true);
            } catch (error) {
                console.error("Failed to load package database:", error);
            } finally {
                setIsLoadingDatabase(false);
            }
        };

        loadDatabase();
    }, []);

    // Auto-fill container name when GitHub URL changes
    useEffect(() => {
        if (formData.githubUrl && selectedTemplate) {
            const repoName = extractRepoName(String(formData.githubUrl));
            if (!formData.containerName || formData.containerName === extractRepoName(String(formData.oldGithubUrl || ''))) {
                setFormData(prev => ({ 
                    ...prev, 
                    containerName: repoName,
                    oldGithubUrl: formData.githubUrl 
                }));
            }
        }
    }, [formData.githubUrl, formData.containerName, formData.oldGithubUrl, selectedTemplate]);

    const resetTour = useCallback(() => {
        setCurrentStep(0);
        setSelectedTemplate(null);
        setFormData({});
        setValidationErrors({});
        setIsGenerating(false);
        setShowAdvancedOptions(false);
    }, []);

    const handleClose = useCallback(() => {
        resetTour();
        onClose();
    }, [resetTour, onClose]);

    const validateField = useCallback((field: TemplateField, value: string | string[] | object | null): string | null => {
        if (field.required) {
            if (field.type === 'packages' && (!value || (Array.isArray(value) && value.length === 0))) {
                return `${field.label} is required`;
            } else if (field.type === 'license' && !value) {
                return `${field.label} is required`;
            } else if ((field.type === 'text' || field.type === 'url' || field.type === 'textarea') && !String(value).trim()) {
                return `${field.label} is required`;
            }
        }
        if (field.validation && String(value).trim()) {
            return field.validation(String(value).trim());
        }
        return null;
    }, []);

    const validateCurrentStep = useCallback((): boolean => {
        if (!selectedTemplate) return false;

        const errors: ValidationErrors = {};
        let isValid = true;

        selectedTemplate.fields.forEach(field => {
            const value = formData[field.id] || '';
            const error = validateField(field, value);
            if (error) {
                errors[field.id] = error;
                isValid = false;
            }
        });

        setValidationErrors(errors);
        return isValid;
    }, [selectedTemplate, formData, validateField]);

    const handleNext = useCallback(() => {
        if (currentStep === 0 && selectedTemplate) {
            setCurrentStep(1);
        } else if (currentStep === 1 && validateCurrentStep()) {
            setCurrentStep(2);
        }
    }, [currentStep, selectedTemplate, validateCurrentStep]);

    const handleBack = useCallback(() => {
        setCurrentStep(Math.max(0, currentStep - 1));
        setValidationErrors({});
    }, [currentStep]);

    const handleTemplateSelect = useCallback((template: ContainerTemplate) => {
        setSelectedTemplate(template);
        
        // Initialize form data with default values
        const initialData: FormData = {};
        template.fields.forEach(field => {
            if (field.type === 'select' && field.options && field.options.length > 0) {
                initialData[field.id] = field.options[0].value;
            } else if (field.type === 'packages') {
                initialData[field.id] = [];
            } else if (field.type === 'license') {
                initialData[field.id] = null;
            } else {
                initialData[field.id] = '';
            }
        });
        setFormData(initialData);
        setValidationErrors({});
    }, []);

    const handleFieldChange = useCallback((fieldId: string, value: string | string[] | object | null) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
        
        // Clear validation error for this field
        if (validationErrors[fieldId]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    }, [validationErrors]);

    const handleGenerate = useCallback(async (shouldPublish = false) => {
        if (!selectedTemplate || !validateCurrentStep()) return;

        setIsGenerating(true);
        try {
            const recipe = selectedTemplate.generateRecipe(formData);
            
            if (shouldPublish && onPublish) {
                onPublish(recipe);
            } else {
                onComplete(recipe);
            }
            handleClose();
        } catch (error) {
            console.error('Failed to generate recipe:', error);
            alert('Failed to generate container recipe. Please check your inputs.');
        } finally {
            setIsGenerating(false);
        }
    }, [selectedTemplate, formData, validateCurrentStep, onComplete, onPublish, handleClose]);

    const renderField = useCallback((field: TemplateField) => {
        const value = formData[field.id];
        const error = validationErrors[field.id];

        const fieldClass = cn(
            "w-full px-3 py-2 border rounded-md text-sm transition-colors",
            error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
            isDark
                ? "bg-gray-700 text-white"
                : "bg-white text-gray-900"
        );

        return (
            <div key={field.id} className={cn("space-y-2", field.type === 'packages' || field.type === 'license' ? "col-span-2" : "")}>
                <label className={cn("block text-sm font-medium", isDark ? "text-gray-200" : "text-gray-700")}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.description && (
                    <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-600")}>
                        {field.description}
                    </p>
                )}

                {field.type === 'license' ? (
                    <LicenseSection
                        licenses={value ? [value] : []}
                        onChange={(licenses) => handleFieldChange(field.id, licenses[0] || null)}
                        showAddButton={false}
                        renderAddButton={() => null}
                    />
                ) : field.type === 'packages' ? (
                    <PackageTagEditor
                        packages={value || []}
                        onChange={(packages) => handleFieldChange(field.id, packages)}
                        packageDatabase={packageDatabase}
                        databaseLoaded={databaseLoaded}
                        isLoadingDatabase={isLoadingDatabase}
                        baseImage="ubuntu:24.04"
                    />
                ) : field.type === 'select' ? (
                    <select
                        value={value || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className={fieldClass}
                    >
                        {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                ) : field.type === 'textarea' ? (
                    <textarea
                        value={value || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className={fieldClass}
                    />
                ) : (
                    <input
                        type={field.type === 'url' ? 'url' : 'text'}
                        value={value || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={fieldClass}
                    />
                )}

                {error && (
                    <p className="text-red-500 text-xs">{error}</p>
                )}
            </div>
        );
    }, [formData, validationErrors, isDark, handleFieldChange, packageDatabase, databaseLoaded, isLoadingDatabase]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div 
                className={cn(
                    "max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl",
                    isDark ? "bg-gray-800" : "bg-white"
                )}
            >
                {/* Header */}
                <div className={cn("px-6 py-4 border-b", isDark ? "border-gray-700" : "border-gray-200")}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <BeakerIcon className="h-6 w-6 text-blue-500" />
                            <h2 className={cn("text-xl font-semibold", isDark ? "text-white" : "text-gray-900")}>
                                Guided Container Creation
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className={cn(
                                "p-2 rounded-md hover:bg-gray-100 transition-colors",
                                isDark ? "hover:bg-gray-700 text-gray-400" : "text-gray-500"
                            )}
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-4">
                        <div className="flex items-center space-x-2">
                            {steps.map((step, index) => (
                                <React.Fragment key={step}>
                                    <div className={cn(
                                        "flex items-center space-x-2 px-3 py-1 rounded-full text-sm",
                                        index <= currentStep
                                            ? "bg-blue-100 text-blue-800"
                                            : isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                                    )}>
                                        <span className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                                            index <= currentStep ? "bg-blue-500 text-white" : "bg-gray-400 text-white"
                                        )}>
                                            {index + 1}
                                        </span>
                                        <span>{step}</span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={cn(
                                            "h-px w-8",
                                            index < currentStep ? "bg-blue-500" : "bg-gray-300"
                                        )} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className={cn("text-lg font-medium mb-2", isDark ? "text-white" : "text-gray-900")}>
                                    Choose a Template
                                </h3>
                                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                                    Select a template that best matches what you want to create.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {GUIDED_TOUR_TEMPLATES.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template)}
                                        className={cn(
                                            "p-4 rounded-lg border-2 text-left transition-all hover:shadow-md",
                                            selectedTemplate?.id === template.id
                                                ? "border-blue-500 bg-blue-50"
                                                : isDark
                                                    ? "border-gray-600 bg-gray-700 hover:border-gray-500"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                        )}
                                    >
                                        <div className="text-2xl mb-2">{template.icon}</div>
                                        <h4 className={cn("font-medium mb-1", isDark ? "text-white" : "text-gray-900")}>
                                            {template.name}
                                        </h4>
                                        <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                                            {template.description}
                                        </p>
                                        <div className={cn(
                                            "mt-2 inline-block px-2 py-1 text-xs rounded",
                                            isDark ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-700"
                                        )}>
                                            {template.category}
                                        </div>
                                    </button>
                                ))}
                                
                                {/* Advanced option for starting from scratch */}
                                {showAdvancedOptions && (
                                    <button
                                        onClick={() => {
                                            // Create a minimal template for advanced users
                                            onComplete({
                                                name: '',
                                                version: '1.0.0',
                                                copyright: [],
                                                architectures: ["x86_64"],
                                                structured_readme: {
                                                    description: '',
                                                    example: '',
                                                    documentation: '',
                                                    citation: ''
                                                },
                                                build: {
                                                    kind: "neurodocker",
                                                    "base-image": "ubuntu:22.04",
                                                    "pkg-manager": "apt",
                                                    directives: []
                                                },
                                                categories: []
                                            });
                                            handleClose();
                                        }}
                                        className={cn(
                                            "p-4 rounded-lg border-2 text-left transition-all hover:shadow-md border-dashed",
                                            isDark
                                                ? "border-gray-600 bg-gray-800 hover:border-gray-500"
                                                : "border-gray-300 bg-gray-50 hover:border-gray-400"
                                        )}
                                    >
                                        <div className="text-2xl mb-2">⚙️</div>
                                        <h4 className={cn("font-medium mb-1", isDark ? "text-white" : "text-gray-900")}>
                                            Start from Scratch
                                        </h4>
                                        <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                                            Create a new container with full control over all settings
                                        </p>
                                        <div className={cn(
                                            "mt-2 inline-block px-2 py-1 text-xs rounded",
                                            isDark ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-700"
                                        )}>
                                            Advanced
                                        </div>
                                    </button>
                                )}
                            </div>
                            
                            {!showAdvancedOptions && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setShowAdvancedOptions(true)}
                                        className={cn(
                                            "inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                                            isDark
                                                ? "text-gray-300 hover:text-white hover:bg-gray-700"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        )}
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        <span>Show Advanced Options</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 1 && selectedTemplate && (
                        <div className="space-y-6">
                            <div>
                                <h3 className={cn("text-lg font-medium mb-2", isDark ? "text-white" : "text-gray-900")}>
                                    Configure Your Container
                                </h3>
                                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                                    Fill in the details for your {selectedTemplate.name.toLowerCase()}.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {selectedTemplate.fields.map(renderField)}
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && selectedTemplate && (
                        <div className="space-y-6">
                            <div>
                                <h3 className={cn("text-lg font-medium mb-2", isDark ? "text-white" : "text-gray-900")}>
                                    Review & Create
                                </h3>
                                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                                    Review your configuration and create the container.
                                </p>
                            </div>

                            <div className={cn("p-4 rounded-lg", isDark ? "bg-gray-700" : "bg-gray-50")}>
                                <h4 className={cn("font-medium mb-3", isDark ? "text-white" : "text-gray-900")}>
                                    Container Summary
                                </h4>
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <dt className={cn("font-medium", isDark ? "text-gray-300" : "text-gray-700")}>Template:</dt>
                                        <dd className={cn(isDark ? "text-gray-400" : "text-gray-600")}>{selectedTemplate.name}</dd>
                                    </div>
                                    {selectedTemplate.fields.map(field => {
                                        const value = formData[field.id];
                                        if (!value || (Array.isArray(value) && value.length === 0)) return null;
                                        
                                        let displayValue: string;
                                        if (field.type === 'packages') {
                                            displayValue = Array.isArray(value) ? value.join(', ') : '';
                                        } else if (field.type === 'license') {
                                            displayValue = value.license || value.name || 'Unknown license';
                                        } else {
                                            displayValue = String(value);
                                        }
                                        
                                        if (!displayValue) return null;
                                        
                                        return (
                                            <div key={field.id}>
                                                <dt className={cn("font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                                                    {field.label}:
                                                </dt>
                                                <dd className={cn("break-all", isDark ? "text-gray-400" : "text-gray-600")}>
                                                    {field.type === 'textarea' ? (
                                                        <pre className="whitespace-pre-wrap text-xs">{displayValue}</pre>
                                                    ) : (
                                                        displayValue
                                                    )}
                                                </dd>
                                            </div>
                                        );
                                    })}
                                </dl>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={cn("px-6 py-4 border-t", isDark ? "border-gray-700" : "border-gray-200")}>
                    <div className="flex justify-between">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={cn(
                                "flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
                                currentStep === 0
                                    ? "text-gray-400 cursor-not-allowed"
                                    : isDark
                                        ? "text-gray-300 hover:bg-gray-700"
                                        : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                            <span>Back</span>
                        </button>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleClose}
                                className={cn(
                                    "px-4 py-2 rounded-md transition-colors",
                                    isDark
                                        ? "text-gray-300 hover:bg-gray-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                Cancel
                            </button>

                            {currentStep < 2 ? (
                                <button
                                    onClick={handleNext}
                                    disabled={currentStep === 0 ? !selectedTemplate : false}
                                    className={cn(
                                        "flex items-center space-x-2 px-4 py-2 rounded-md text-white transition-colors",
                                        (currentStep === 0 ? !selectedTemplate : false)
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-500 hover:bg-blue-600"
                                    )}
                                >
                                    <span>Next</span>
                                    <ChevronRightIcon className="h-4 w-4" />
                                </button>
                            ) : (
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleGenerate(false)}
                                        disabled={isGenerating}
                                        className={cn(
                                            "flex items-center space-x-2 px-6 py-2 rounded-md text-white transition-colors",
                                            isGenerating
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-blue-500 hover:bg-blue-600"
                                        )}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                <span>Creating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <BeakerIcon className="h-4 w-4" />
                                                <span>Create Container</span>
                                            </>
                                        )}
                                    </button>
                                    
                                    {onPublish && (
                                        <button
                                            onClick={() => handleGenerate(true)}
                                            disabled={isGenerating}
                                            className={cn(
                                                "flex items-center space-x-2 px-6 py-2 rounded-md text-white transition-colors",
                                                isGenerating
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : "bg-green-500 hover:bg-green-600"
                                            )}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                    <span>Publishing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <BeakerIcon className="h-4 w-4" />
                                                    <span>Create & Publish</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuidedTour;