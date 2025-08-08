export interface ValidationResult {
    success: boolean;
    dockerfile?: string;
    readme?: string;
    buildDirectory?: string;
    deployBins?: string[];
    deployPath?: string[];
    error?: string;
    warnings?: string[];
}