"use client";

import { load as loadYAML } from "js-yaml";
import { useState, useEffect, useCallback } from "react";
import { SparklesIcon, ArrowUpTrayIcon, DocumentPlusIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import {
    ContainerRecipe,
    migrateLegacyRecipe,
    mergeAdditionalFilesIntoRecipe,
} from "@/components/common";
import BuildRecipeComponent from "@/components/recipe";
import ContainerMetadata from "@/components/metadata";
import ValidateRecipeComponent from "@/components/validate";
import GitHubModal from "@/components/githubExport";
import YamlPasteModal from "@/components/yamlPasteModal";
import GuidedTour from "@/components/GuidedTour";
import { useGitHubFiles } from "@/lib/useGithub";
import { cn } from "@/lib/styles";
import { useTheme } from "@/lib/ThemeContext";

// Extracted components
import { LocalContainersList } from "@/components/LocalContainersList";
import { RemoteContainersList } from "@/components/RemoteContainersList";
import { SideNavigation } from "@/components/SideNavigation";
import { TopNavigation } from "@/components/TopNavigation";
import { SectionHeader } from "@/components/SectionHeader";
import { Footer } from "@/components/Footer";

// Extracted utilities and types
import { sections } from "@/lib/sections";
import { getNewContainerYAML } from "@/lib/containerStorage";

// Extracted hooks
import { useContainerStorage } from "@/hooks/useContainerStorage";
import { useContainerPublishing } from "@/hooks/useContainerPublishing";

export default function Home() {
    const { isDark } = useTheme();

    // Core state
    const [yamlData, setYamlData] = useState<ContainerRecipe | null>(null);
    const [, setLoading] = useState(true);
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
    const [isYamlPasteModalOpen, setIsYamlPasteModalOpen] = useState(false);
    const [isGuidedTourOpen, setIsGuidedTourOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [filesystemMode, setFilesystemMode] = useState<"local" | "remote">(
        "remote"
    );
    const [isLocalFilesystemConnected] = useState<boolean>(false);
    const [hasMetadataErrors, setHasMetadataErrors] = useState<boolean>(false);
    const [isValidationSuccessful, setIsValidationSuccessful] = useState<boolean>(false);

    // Hooks
    const {
        saveStatus,
        currentContainerId,
        saveToStorage,
        deleteContainer,
        exportYAML,
        setCurrentContainerId,
    } = useContainerStorage();

    const {
        isPublishedContainer,
        isModifiedFromGithub,
        checkIfModifiedFromGithub,
        getGithubUrl,
        checkIfPublished,
        setOriginalYaml,
        setIsModifiedFromGithub,
        setCurrentRoute,
        resetPublishingState,
    } = useContainerPublishing();

    const { files } = useGitHubFiles("neurodesk", "neurocontainers", "main");

    // Helper: find GitHub file by container name
    const findGithubFileByName = useCallback(
        (containerName: string) => {
            return files.find((file) => {
                const parts = file.path.split("/");
                const recipeName = parts[parts.length - 2] || "";
                return recipeName.toLowerCase() === containerName.toLowerCase();
            });
        },
        [files]
    );

    // Update URL
    const updateUrl = useCallback(
        (recipe: ContainerRecipe | null) => {
            if (recipe) {
                const urlName =
                    recipe.name
                        ?.trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-") ||
                    `untitled-${new Date().toISOString().split("T")[0]}`;
                const newHash = `#/${urlName}`;
                if (window.location.hash !== newHash) {
                    window.history.pushState(null, "", newHash);
                    setCurrentRoute(urlName);
                }
            } else {
                if (window.location.hash !== "") {
                    window.history.pushState(null, "", window.location.pathname);
                    setCurrentRoute("");
                }
            }
        },
        [setCurrentRoute]
    );

    // Auto-save
    const shouldAutoSave = useCallback((recipe: ContainerRecipe): boolean => {
        return (
            recipe.name.trim() !== "" ||
            recipe.version.trim() !== "" ||
            (recipe.build.directives && recipe.build.directives.length > 0)
        );
    }, []);

    // Handle validation change
    const handleValidationChange = useCallback((isValid: boolean, hasResult: boolean) => {
        setIsValidationSuccessful(isValid && hasResult);
    }, []);

    const autoSaveContainer = useCallback(
        (data: ContainerRecipe) => {
            if (shouldAutoSave(data)) {
                saveToStorage(data, currentContainerId ?? undefined);
            }
        },
        [shouldAutoSave, saveToStorage, currentContainerId]
    );

    // Load container
    const loadContainer = useCallback(
        async (recipe: ContainerRecipe, id?: string) => {
            setYamlData(recipe);
            setCurrentContainerId(id || null);
            if (recipe.name) {
                checkIfPublished(recipe.name, files);
            }
            updateUrl(recipe);
        },
        [setCurrentContainerId, checkIfPublished, files, updateUrl]
    );

    // Navigate to container library
    const navigateToLibrary = useCallback(() => {
        setYamlData(null);
        setCurrentContainerId(null);
        resetPublishingState();
        window.history.pushState(null, "", window.location.pathname);
        setCurrentRoute("");
    }, [setCurrentContainerId, resetPublishingState, setCurrentRoute]);

    // Load container by name
    const loadContainerByName = useCallback(
        async (containerName: string) => {
            try {
                const githubFile = findGithubFileByName(containerName);
                if (githubFile && githubFile.downloadUrl) {
                    const response = await fetch(githubFile.downloadUrl);
                    if (response.ok) {
                        const yamlText = await response.text();
                        let recipe = loadYAML(yamlText) as ContainerRecipe;
                        recipe = migrateLegacyRecipe(recipe);
                        recipe = await mergeAdditionalFilesIntoRecipe(
                            recipe,
                            async (filename: string) => {
                                const fileResponse = await fetch(
                                    `${githubFile
                                        .downloadUrl!.replace(/build\.yaml$/, "")}${filename}`
                                );
                                if (!fileResponse.ok) {
                                    throw new Error(
                                        `Failed to fetch additional file ${filename}`
                                    );
                                }
                                return await fileResponse.text();
                            }
                        );
                        setOriginalYaml(yamlText);
                        await loadContainer(recipe);
                        return;
                    }
                }
                const newContainer = getNewContainerYAML();
                newContainer.name = containerName.replace(/-/g, "").toLowerCase();
                await loadContainer(newContainer);
            } catch (error) {
                console.error("Error loading container:", error);
            }
        },
        [findGithubFileByName, loadContainer, setOriginalYaml]
    );

    // Handle data change (FIXED)
    const handleDataChange = useCallback(
        (newData: ContainerRecipe) => {
            setYamlData(newData);
            updateUrl(newData);
            if (newData.name) {
                checkIfPublished(newData.name, files);
            }
            if (isPublishedContainer) {
                checkIfModifiedFromGithub(newData).then(setIsModifiedFromGithub);
            }
            autoSaveContainer(newData);
            // Reset validation state when recipe changes
            setIsValidationSuccessful(false);
        },
        [
            updateUrl,
            checkIfPublished,
            files,
            isPublishedContainer,
            checkIfModifiedFromGithub,
            setIsModifiedFromGithub,
            autoSaveContainer,
        ]
    );

    // File upload
    const processYamlFile = useCallback(
        (file: File) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target?.result as string;
                    const recipe = loadYAML(content) as ContainerRecipe;
                    const migratedRecipe = migrateLegacyRecipe(recipe);
                    const newId = `uploaded-${Date.now()}`;
                    loadContainer(migratedRecipe, newId);
                    saveToStorage(migratedRecipe, newId);
                } catch (error) {
                    console.error("Failed to load YAML file:", error);
                    alert("Failed to load YAML file. Please check the file format.");
                }
            };
            reader.readAsText(file);
        },
        [loadContainer, saveToStorage]
    );

    // Init
    useEffect(() => {
        const initializeApp = async () => {
            try {
                const hash = window.location.hash;
                if (hash.startsWith("#/")) {
                    const containerName = hash.substring(2);
                    await loadContainerByName(containerName);
                }
            } catch (error) {
                console.error("Failed to initialize:", error);
                const newContainer = getNewContainerYAML();
                await loadContainer(newContainer);
            } finally {
                setLoading(false);
            }
        };
        initializeApp();
    }, [loadContainer, loadContainerByName]);

    return (
        <div className="min-h-screen flex overflow-x-hidden relative">
            {/* Animated Background */}
            <div
                className="absolute inset-0 -z-10"
                style={{
                    background: isDark
                        ? "radial-gradient(circle at 20% 20%, rgba(123,179,58,0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(145,200,74,0.15), transparent 40%), linear-gradient(135deg, #1a1f1a 0%, #0f130f 100%)"
                        : "radial-gradient(circle at 20% 20%, rgba(106,163,41,0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(79,123,56,0.15), transparent 40%), linear-gradient(135deg, #f4f9f1 0%, #e8f3e0 100%)",
                    backgroundSize: "cover",
                }}
            />
            <div
                className="absolute inset-0 -z-10 opacity-10 animate-[movePattern_60s_linear_infinite]"
                style={{
                    backgroundImage:
                        "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"60\" height=\"60\" viewBox=\"0 0 60 60\"><circle cx=\"30\" cy=\"30\" r=\"1\" fill=\"%23ffffff\"/></svg>')",
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Sidebar */}
            <SideNavigation
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                yamlData={yamlData}
                onContainerLibrary={navigateToLibrary}
                onExportYAML={() => yamlData && exportYAML(yamlData)}
                onOpenGitHub={() => setIsGitHubModalOpen(true)}
                saveStatus={saveStatus}
                isPublished={isPublishedContainer}
                githubUrl={yamlData ? getGithubUrl(yamlData) : ""}
                isModified={isModifiedFromGithub}
                filesystemMode={filesystemMode}
                isLocalFilesystemConnected={isLocalFilesystemConnected}
                onSaveToLocalFilesystem={() => { }}
                hasMetadataErrors={hasMetadataErrors}
            />

            <div className="flex-1 min-h-screen overflow-x-hidden lg:ml-64 relative z-10">
                <TopNavigation
                    onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    yamlData={yamlData}
                    onNewContainer={() => setIsGuidedTourOpen(true)}
                    onOpenGitHub={() => setIsGitHubModalOpen(true)}
                    saveStatus={saveStatus}
                    filesystemMode={filesystemMode}
                    hasMetadataErrors={hasMetadataErrors}
                />

                {!yamlData ? (
                    <div className="max-w-6xl mx-auto p-6 pt-20">
                        <h1
                            className={cn(
                                "text-4xl font-bold mb-4",
                                isDark ? "text-[#e8f5d0]" : "text-[#0c0e0a]"
                            )}
                        >
                            NeuroContainers Builder
                        </h1>
                        <p
                            className={cn(
                                "text-lg mb-12 max-w-2xl",
                                isDark ? "text-[#91c84a]" : "text-[#4f7b38]"
                            )}
                        >
                            Create, customize, and validate containerized neuroimaging tools
                            with ease.
                        </p>

                        {/* Horizontal CTA Cards */}
                        <div className="grid md:grid-cols-3 gap-6 mb-12">
                            {/* Create New Container (Guided Tour) */}
                            <button
                                onClick={() => setIsGuidedTourOpen(true)}
                                className={cn(
                                    "group flex items-center p-6 rounded-xl shadow-lg transition-all duration-300 text-left transform hover:scale-[1.02] hover:shadow-xl backdrop-blur-md",
                                    isDark
                                        ? "bg-gradient-to-r from-[#7bb33a]/90 to-[#6aa329]/90 text-white hover:from-[#8ccf45]/95 hover:to-[#7bb33a]/95 border border-[#7bb33a]/30"
                                        : "bg-gradient-to-r from-[#6aa329]/90 to-[#4f7b38]/90 text-white hover:from-[#7bb33a]/95 hover:to-[#6aa329]/95 border border-[#6aa329]/30"
                                )}
                            >
                                <SparklesIcon className="h-10 w-10 flex-shrink-0 mr-4 transition-transform duration-300 group-hover:scale-110" />
                                <div>
                                    <h3 className="text-xl font-semibold">Create New Container</h3>
                                    <p className="text-sm opacity-90">
                                        Start from scratch with our new container wizard.
                                    </p>
                                </div>
                            </button>

                            {/* Paste YAML Recipe */}
                            <button
                                onClick={() => setIsYamlPasteModalOpen(true)}
                                className={cn(
                                    "group flex items-center p-6 rounded-xl shadow-lg transition-all duration-300 text-left transform hover:scale-[1.02] hover:shadow-xl backdrop-blur-md",
                                    isDark
                                        ? "bg-[#2d4222]/70 text-[#91c84a] hover:bg-[#3a5c29]/80 border border-[#2d4222]/40"
                                        : "bg-[#e6f1d6]/70 text-[#4f7b38] hover:bg-[#d3e7b6]/80 border border-[#e6f1d6]/60"
                                )}
                            >
                                <DocumentPlusIcon className="h-10 w-10 flex-shrink-0 mr-4 transition-transform duration-300 group-hover:scale-110" />
                                <div>
                                    <h3 className="text-xl font-semibold">Paste YAML Recipe</h3>
                                    <p className="text-sm opacity-80">
                                        Perfect for AI-generated or pre-written recipes.
                                    </p>
                                </div>
                            </button>

                            {/* Upload YAML */}
                            <label
                                className={cn(
                                    "group flex items-center p-6 rounded-xl shadow-lg transition-all duration-300 text-left cursor-pointer transform hover:scale-[1.02] hover:shadow-xl backdrop-blur-md",
                                    isDark
                                        ? "bg-[#2d4222]/70 text-[#91c84a] hover:bg-[#3a5c29]/80 border border-[#2d4222]/40"
                                        : "bg-[#e6f1d6]/70 text-[#4f7b38] hover:bg-[#d3e7b6]/80 border border-[#e6f1d6]/60"
                                )}
                            >
                                <ArrowUpTrayIcon className="h-10 w-10 flex-shrink-0 mr-4 transition-transform duration-300 group-hover:scale-110" />
                                <div>
                                    <h3 className="text-xl font-semibold">Upload YAML</h3>
                                    <p className="text-sm opacity-80">
                                        Import an existing container recipe from your files.
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept=".yaml,.yml"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) processYamlFile(file);
                                    }}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Lists - left aligned */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-left">
                            <LocalContainersList
                                onLoadContainer={loadContainer}
                                onDeleteContainer={deleteContainer}
                                githubFiles={files}
                            />
                            <RemoteContainersList
                                onLoadRecipe={loadContainer}
                                onLoadLocalRecipe={(content) => {
                                    try {
                                        const recipe = loadYAML(content) as ContainerRecipe;
                                        loadContainer(migrateLegacyRecipe(recipe));
                                    } catch (error) {
                                        console.error("Failed to load local recipe:", error);
                                    }
                                }}
                                filesystemMode={filesystemMode}
                                onFilesystemModeChange={setFilesystemMode}
                            />
                        </div>
                        <Footer />
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto p-4 sm:p-6 pt-20 lg:pt-6 space-y-8">
                        <SectionHeader {...sections[0]} />
                        <ContainerMetadata
                            recipe={yamlData}
                            onChange={handleDataChange}
                            onValidationChange={setHasMetadataErrors}
                        />
                        <SectionHeader {...sections[1]} />
                        <BuildRecipeComponent
                            recipe={yamlData.build}
                            onChange={(buildRecipe) =>
                                handleDataChange({ ...yamlData, build: buildRecipe })
                            }
                        />
                        <SectionHeader {...sections[2]} />
                        <ValidateRecipeComponent 
                            recipe={yamlData}
                            onValidationChange={handleValidationChange}
                        />
                        
                        {/* Publish Section - Only shown when validation is successful */}
                        {isValidationSuccessful && (
                            <div className="space-y-6">
                                <div className={cn(
                                    "rounded-lg border p-6 text-center",
                                    isDark ? "bg-[#1a1f17] border-[#2d4222]" : "bg-[#fafff4] border-[#e6f1d6]"
                                )}>
                                    <div className="mb-4">
                                        <div className={cn(
                                            "inline-flex items-center justify-center w-12 h-12 rounded-full mb-3",
                                            isDark ? "bg-[#2d4222]" : "bg-[#e6f1d6]"
                                        )}>
                                            <CloudArrowUpIcon className={cn(
                                                "h-6 w-6",
                                                isDark ? "text-[#91c84a]" : "text-[#4f7b38]"
                                            )} />
                                        </div>
                                        <h3 className={cn(
                                            "text-lg font-semibold mb-2",
                                            isDark ? "text-[#e8f5d0]" : "text-[#0c0e0a]"
                                        )}>
                                            Ready to Publish!
                                        </h3>
                                        <p className={cn(
                                            "text-sm mb-6",
                                            isDark ? "text-[#91c84a]" : "text-[#4f7b38]"
                                        )}>
                                            Your container has been validated successfully. You can now publish it to the NeuroContainers repository.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsGitHubModalOpen(true)}
                                        className={cn(
                                            "inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
                                            isDark
                                                ? "bg-gradient-to-r from-[#7bb33a] to-[#6aa329] hover:from-[#6aa329] hover:to-[#5a8f23] text-white"
                                                : "bg-gradient-to-r from-[#6aa329] to-[#4f7b38] hover:from-[#5a8f23] hover:to-[#3a5c1b] text-white"
                                        )}>
                                        <CloudArrowUpIcon className="h-6 w-6" />
                                        <span>Publish to GitHub</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        <Footer />
                    </div>
                )}
            </div>

            {/* Modals */}
            {isGitHubModalOpen && yamlData && (
                <GitHubModal
                    isOpen={isGitHubModalOpen}
                    onClose={() => setIsGitHubModalOpen(false)}
                    yamlData={yamlData}
                    yamlText=""
                />
            )}
            <YamlPasteModal
                isOpen={isYamlPasteModalOpen}
                onClose={() => setIsYamlPasteModalOpen(false)}
                onLoadContainer={loadContainer}
            />
            <GuidedTour
                isOpen={isGuidedTourOpen}
                onClose={() => setIsGuidedTourOpen(false)}
                onComplete={(recipe) => {
                    loadContainer(recipe);
                    setIsGuidedTourOpen(false);
                }}
                onPublish={(recipe) => {
                    loadContainer(recipe);
                    setIsGuidedTourOpen(false);
                    setTimeout(() => setIsGitHubModalOpen(true), 100);
                }}
            />
        </div>
    );
}