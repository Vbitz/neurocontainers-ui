import { CodeBracketIcon } from "@heroicons/react/24/outline";
import { registerGroupEditor } from "../group";
import type { ComponentType } from "react";
import type { GroupEditorArgument } from "../group";
import { HelpSection } from "@/components/ui/HelpSection";
import javaGroupHelpMarkdown from "@/copy/help/groups/java-group.md";
import { processYamlGroup, YamlGroup } from "@/lib/yamlGroupEditor";

// Define the YAML-based Java group
const javaGroupDefinition: YamlGroup = {
    metadata: {
        key: "java",
        label: "Java",
        description: "Install Java Development Kit (JDK)",
        icon: "CodeBracket",
        color: "orange",
        helpContent: javaGroupHelpMarkdown,
        helpPath: "copy/help/groups/java-group.md",
        keywords: ["java", "jdk", "openjdk", "jre", "javac", "jar"],
    },
    arguments: [
        {
            name: "version",
            type: "dropdown",
            required: true,
            defaultValue: "17",
            description: "Java version to install",
            options: ["default", "8", "11", "17", "21"],
        },
        {
            name: "type",
            type: "dropdown",
            required: true,
            defaultValue: "jdk",
            description: "Install JDK (development) or JRE (runtime only)",
            options: ["jdk", "jre"],
        },
        {
            name: "setJavaHome",
            type: "boolean",
            required: false,
            defaultValue: true,
            description: "Set JAVA_HOME environment variable",
        },
    ],
    directives: [
        {
            variables: {
                javaHome: "/usr/lib/jvm/default-java",
                javaPackages: ["default-{{ local.type }}"]
            },
            condition: "version == \"default\""
        },
        {
            variables: {
                javaHome: "/usr/lib/jvm/java-{{ local.version }}-openjdk-amd64",
                javaPackages: ["openjdk-{{ local.version }}-{{ local.type }}"]
            },
            condition: "version != \"default\""
        },
        {
            install: "{{ local.javaPackages }}",
        },
        {
            environment: {
                JAVA_HOME: "{{ local.javaHome }}",
                PATH: `{{ local.javaHome }}/bin:$PATH`,
            },
            condition: "local.setJavaHome",
        }
    ],
};

// Register the group using the new YAML-based system
registerGroupEditor("java", {
    metadata: {
        key: "java",
        label: "Java",
        description: "Install Java Development Kit (JDK)",
        icon: CodeBracketIcon,
        color: { light: "bg-orange-50 border-orange-200 hover:bg-orange-100", dark: "bg-orange-900 border-orange-700 hover:bg-orange-800" },
        iconColor: { light: "text-orange-600", dark: "text-orange-400" },
        defaultValue: {
            group: [],
            custom: "java",
        },
        keywords: ["java", "jdk", "openjdk", "jre", "javac", "jar"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component: undefined as unknown as ComponentType<any>, // Will be set by registerGroupEditor
    },
    helpContent() {
        return <HelpSection
            markdownContent={javaGroupHelpMarkdown}
            sourceFilePath="copy/help/groups/java-group.md"
        />;
    },
    arguments: javaGroupDefinition.arguments.map(arg => ({
        ...arg,
        type: arg.type as "dropdown" | "text" | "array" | "boolean"
    })) as GroupEditorArgument[],
    updateDirective(args: Record<string, unknown>) {
        // Use the new YAML processor to generate directives
        const directives = processYamlGroup(javaGroupDefinition, args);
        
        return {
            group: directives,
            custom: "java",
        };
    },
})