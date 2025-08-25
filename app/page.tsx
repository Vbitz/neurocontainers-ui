"use client";

import { load as loadYAML } from "js-yaml";
import { useState, useEffect, useCallback } from "react";
import { SparklesIcon, ArrowUpTrayIcon, DocumentPlusIcon, ExclamationCircleIcon, XMarkIcon, InformationCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import {
    ContainerRecipe,
    migrateLegacyRecipe,
    mergeAdditionalFilesIntoRecipe,
} from "@/components/common";
import BuildRecipeComponent from "@/components/recipe";
import ContainerMetadata from "@/components/metadata";
import ValidateRecipeComponent from "@/components/validate";
import YamlPasteModal from "@/components/yamlPasteModal";
import GuidedTour from "@/components/GuidedTour";
import { Logo } from "@/components/ui/Logo";
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
import YamlGroupBootstrap from "@/components/YamlGroupBootstrap";

// Extracted utilities and types
import { sections } from "@/lib/sections";

// Extracted hooks
import { useContainerStorage } from "@/hooks/useContainerStorage";
import { useContainerPublishing } from "@/hooks/useContainerPublishing";
import { SavedContainer } from "@/lib/containerStorage";

export default function Home() {
    const { isDark } = useTheme();

    // Mouse tracking state for background animation
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

    // Core state
    const [yamlData, setYamlData] = useState<ContainerRecipe | null>(null);
    const [, setLoading] = useState(true);
    const [isYamlPasteModalOpen, setIsYamlPasteModalOpen] = useState(false);
    const [isGuidedTourOpen, setIsGuidedTourOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [filesystemMode, setFilesystemMode] = useState<"local" | "remote">(
        "remote"
    );
    const [isLocalFilesystemConnected] = useState<boolean>(false);
    const [hasMetadataErrors, setHasMetadataErrors] = useState<boolean>(false);
    
    
    // Notification state
    const [notification, setNotification] = useState<{
        message: string;
        type: 'error' | 'info' | 'success';
    } | null>(null);

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

    // Handle validation change - kept for component compatibility
    const handleValidationChange = useCallback(() => {
        // Validation state is now handled within the validate component
    }, []);

    // Handle validation result - kept for component compatibility
    const handleValidationResult = useCallback(() => {
        // Validation result is now handled within the validate component
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
                // First try to find in local storage
                const savedContainers = localStorage.getItem("neurocontainers-builder-saved");
                if (savedContainers) {
                    const containers = JSON.parse(savedContainers);
                    const localContainer = containers.find((container: SavedContainer) => {
                        const urlName = container.name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
                        return urlName === containerName;
                    });
                    if (localContainer) {
                        await loadContainer(localContainer.data, localContainer.id);
                        return;
                    }
                }

                // Then try to find in GitHub files
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
                
                // If not found anywhere, show notification
                setNotification({
                    message: `Container "${containerName}" not found in your recent containers or published containers. Please create a new container or load an existing one.`,
                    type: 'info'
                });
                
                // Clear the URL hash since container wasn't found
                window.history.pushState(null, "", window.location.pathname);
                setCurrentRoute("");
                
            } catch (error) {
                console.error("Error loading container:", error);
                setNotification({
                    message: `Failed to load container "${containerName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
                    type: 'error'
                });
                
                // Clear the URL hash on error
                window.history.pushState(null, "", window.location.pathname);
                setCurrentRoute("");
            }
        },
        [findGithubFileByName, loadContainer, setOriginalYaml, setCurrentRoute]
    );

    // Handle data change
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


    // Auto-dismiss notifications
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000); // 5 seconds
            return () => clearTimeout(timer);
        }
    }, [notification]);

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

    // Mouse tracking for background animation
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            
            // Use requestAnimationFrame for smooth animation
            requestAnimationFrame(() => {
                setMousePosition({ x, y });
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
                setNotification({
                    message: `Failed to initialize application: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        };
        initializeApp();
    }, [loadContainer, loadContainerByName]);

    return (
        <div className="min-h-screen flex overflow-x-hidden relative">
            {/* Bootstrap any YAML groups saved in localStorage */}
            <YamlGroupBootstrap />
            {/* Animated Background */}
            <div
                className="absolute inset-0 -z-10 transition-all duration-[3000ms] ease-out"
                style={{
                    background: isDark
                        ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(123,179,58,0.08), transparent 60%), radial-gradient(circle at ${100-mousePosition.x}% ${100-mousePosition.y}%, rgba(145,200,74,0.06), transparent 50%), linear-gradient(135deg, #1a1f1a 0%, #0f130f 100%)`
                        : `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(106,163,41,0.08), transparent 60%), radial-gradient(circle at ${100-mousePosition.x}% ${100-mousePosition.y}%, rgba(79,123,56,0.06), transparent 50%), linear-gradient(135deg, #f4f9f1 0%, #e8f3e0 100%)`,
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
                onOpenGitHub={() => {}}
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
                    onOpenGitHub={() => {}}
                    saveStatus={saveStatus}
                    filesystemMode={filesystemMode}
                    hasMetadataErrors={hasMetadataErrors}
                    onNavigateToLibrary={navigateToLibrary}
                />

                {!yamlData ? (
                    <div className="max-w-6xl mx-auto p-4 sm:p-6 pt-20 lg:pt-6">
                        {/* Notification */}
                        {notification && (
                            <div className={cn(
                                "mb-6 p-4 rounded-xl border backdrop-blur-md flex items-start gap-3 transition-all duration-300",
                                notification.type === 'error'
                                    ? (isDark ? "bg-red-900/30 border-red-700/30" : "bg-red-50/50 border-red-200/50")
                                    : notification.type === 'success'
                                    ? (isDark ? "bg-green-900/30 border-green-700/30" : "bg-green-50/50 border-green-200/50")
                                    : (isDark ? "bg-blue-900/30 border-blue-700/30" : "bg-blue-50/50 border-blue-200/50")
                            )}>
                                {notification.type === 'error' ? (
                                    <ExclamationCircleIcon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", isDark ? "text-red-400" : "text-red-600")} />
                                ) : notification.type === 'success' ? (
                                    <CheckCircleIcon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", isDark ? "text-green-400" : "text-green-600")} />
                                ) : (
                                    <InformationCircleIcon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", isDark ? "text-blue-400" : "text-blue-600")} />
                                )}
                                <p className={cn(
                                    "flex-1 text-sm",
                                    notification.type === 'error'
                                        ? (isDark ? "text-red-300" : "text-red-700")
                                        : notification.type === 'success'
                                        ? (isDark ? "text-green-300" : "text-green-700")
                                        : (isDark ? "text-blue-300" : "text-blue-700")
                                )}>
                                    {notification.message}
                                </p>
                                <button
                                    onClick={() => setNotification(null)}
                                    className={cn(
                                        "flex-shrink-0 p-1 rounded-lg transition-colors",
                                        notification.type === 'error'
                                            ? (isDark ? "text-red-400 hover:text-red-300 hover:bg-red-900/50" : "text-red-600 hover:text-red-700 hover:bg-red-100/50")
                                            : notification.type === 'success'
                                            ? (isDark ? "text-green-400 hover:text-green-300 hover:bg-green-900/50" : "text-green-600 hover:text-green-700 hover:bg-green-100/50")
                                            : (isDark ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/50" : "text-blue-600 hover:text-blue-700 hover:bg-blue-100/50")
                                    )}
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        <div className="text-center mb-8 mt-8">
                            <div 
                                onClick={navigateToLibrary}
                                className="cursor-pointer inline-flex items-center gap-4 mb-4 group"
                            >
                                <div className="transition-transform duration-200 group-hover:scale-105">
                                    <Logo className="h-12 w-auto" />
                                </div>
                                <h1 className={cn("text-3xl font-bold transition-colors duration-200", 
                                    isDark ? "text-[#e8f5d0] group-hover:text-[#91c84a]" : "text-[#0c0e0a] group-hover:text-[#4f7b38]"
                                )}>
                                    NeuroContainers Builder
                                </h1>
                            </div>
                            <p className={cn("text-lg mb-8", isDark ? "text-[#91c84a]" : "text-[#4f7b38]")}>
                                Create, customize, and validate containerized neuroimaging tools
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                                <button
                                    onClick={() => setIsGuidedTourOpen(true)}
                                    className={cn(
                                        "group relative flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 text-lg backdrop-blur-sm border transform hover:scale-[1.02] hover:backdrop-blur-md overflow-hidden",
                                        isDark
                                            ? "bg-black/40 text-green-300 hover:bg-black/50 border-green-400/30 hover:border-green-300/50 shadow-lg hover:shadow-xl"
                                            : "bg-white/40 text-green-700 hover:bg-white/50 border-green-400/30 hover:border-green-300/50 shadow-lg hover:shadow-xl"
                                    )}
                                >
                                    {/* Glass effect overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    
                                    <SparklesIcon className="h-6 w-6 relative z-10" />
                                    <div className="flex flex-col items-start relative z-10">
                                        <span className="text-xl">Create New Container</span>
                                        <span className="text-sm opacity-75 font-normal">Use templates & forms</span>
                                    </div>
                                    
                                    {/* Subtle shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out" />
                                </button>

                                <button
                                    onClick={() => setIsYamlPasteModalOpen(true)}
                                    className={cn(
                                        "group relative flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 text-lg backdrop-blur-sm border transform hover:scale-[1.02] hover:backdrop-blur-md overflow-hidden",
                                        isDark
                                            ? "bg-black/30 text-green-300 hover:bg-black/40 border-green-500/20 hover:border-green-400/40 shadow-lg hover:shadow-xl"
                                            : "bg-white/30 text-green-700 hover:bg-white/40 border-green-500/30 hover:border-green-400/50 shadow-lg hover:shadow-xl"
                                    )}
                                >
                                    {/* Glass effect overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    
                                    <DocumentPlusIcon className="h-6 w-6 relative z-10" />
                                    <div className="flex flex-col items-start relative z-10">
                                        <span className="text-xl">Paste YAML Recipe</span>
                                        <span className="text-sm opacity-75 font-normal">Perfect for AI-generated recipes</span>
                                    </div>
                                    
                                    {/* Subtle shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out" />
                                </button>

                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".yaml,.yml"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                processYamlFile(file);
                                            }
                                            e.target.value = '';
                                        }}
                                        className="hidden"
                                    />
                                    <div className={cn(
                                        "group relative flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 text-lg backdrop-blur-sm border transform hover:scale-[1.02] hover:backdrop-blur-md cursor-pointer overflow-hidden",
                                        isDark
                                            ? "bg-black/30 text-green-300 hover:bg-black/40 border-green-500/20 hover:border-green-400/40 shadow-lg hover:shadow-xl"
                                            : "bg-white/30 text-green-700 hover:bg-white/40 border-green-500/30 hover:border-green-400/50 shadow-lg hover:shadow-xl"
                                    )}>
                                        {/* Glass effect overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        
                                        <ArrowUpTrayIcon className="h-6 w-6 relative z-10" />
                                        <div className="flex flex-col items-start relative z-10">
                                            <span className="text-xl">Upload Existing YAML</span>
                                            <span className="text-sm opacity-75 font-normal">Click to upload</span>
                                        </div>
                                        
                                        {/* Subtle shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out" />
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                                        console.error('Failed to load local recipe:', error);
                                    }
                                }}
                                filesystemMode={filesystemMode}
                                onFilesystemModeChange={setFilesystemMode}
                            />
                        </div>
                        <Footer />
                    </div>
                ) : (
                    /* Container Builder View - All Steps */
                    <div className="max-w-6xl mx-auto p-4 sm:p-6 pt-20 lg:pt-6 space-y-8">
                        {/* Step 1: Basic Info */}
                        <div className="space-y-6">
                            <SectionHeader
                                icon={sections[0].icon}
                                title={sections[0].title}
                                description={sections[0].description}
                            />
                            <ContainerMetadata
                                recipe={yamlData}
                                onChange={handleDataChange}
                                onValidationChange={setHasMetadataErrors}
                            />
                        </div>

                        {/* Step 2: Build Recipe */}
                        <div className="space-y-6">
                            <SectionHeader
                                icon={sections[1].icon}
                                title={sections[1].title}
                                description={sections[1].description}
                            />
                            <BuildRecipeComponent
                                recipe={yamlData.build}
                                onChange={(buildRecipe) => handleDataChange({ ...yamlData, build: buildRecipe })}
                            />
                        </div>

                        {/* Step 3: Validate */}
                        <div className="space-y-6">
                            <SectionHeader
                                icon={sections[2].icon}
                                title={sections[2].title}
                                description={sections[2].description}
                            />
                            <ValidateRecipeComponent
                                recipe={yamlData}
                                onValidationChange={handleValidationChange}
                                onValidationResult={handleValidationResult}
                            />
                        </div>



                        <Footer />
                    </div>
                )}
            </div>

            {/* Modals */}
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
                    // GitHub export is now handled in the validate component
                }}
            />
        </div>
    );
}
