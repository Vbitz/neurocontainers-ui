/**
 * Icon mapping system for YAML group editors
 * Maps string icon names to actual React icon components
 */

import {
    CodeBracketIcon,
    DocumentTextIcon,
    DocumentDuplicateIcon,
    FolderIcon,
    BeakerIcon,
    Cog6ToothIcon,
    RocketLaunchIcon,
    WrenchScrewdriverIcon,
    ArrowDownTrayIcon,
    CommandLineIcon,
    CloudArrowDownIcon,
    PlayIcon,
    ListBulletIcon,
    CpuChipIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType } from "react";

// Type for icon components
export type IconComponent = ComponentType<{ className?: string }>;

// Mapping of string names to icon components
export const ICON_MAPPING: Record<string, IconComponent> = {
    CodeBracket: CodeBracketIcon,
    DocumentText: DocumentTextIcon,
    DocumentDuplicate: DocumentDuplicateIcon,
    Folder: FolderIcon,
    Beaker: BeakerIcon,
    Cog: Cog6ToothIcon,
    Rocket: RocketLaunchIcon,
    Wrench: WrenchScrewdriverIcon,
    Download: ArrowDownTrayIcon,
    CLI: CommandLineIcon,
    CloudDownload: CloudArrowDownIcon,
    Play: PlayIcon,
    List: ListBulletIcon,
    CPU: CpuChipIcon,
};

/**
 * Get an icon component by name
 */
export function getIconByName(iconName: string): IconComponent {
    const icon = ICON_MAPPING[iconName];
    if (!icon) {
        throw new Error(`Unknown icon: ${iconName}. Available icons: ${Object.keys(ICON_MAPPING).join(', ')}`);
    }
    return icon;
}

/**
 * Get all available icon names
 */
export function getAvailableIcons(): string[] {
    return Object.keys(ICON_MAPPING);
}
