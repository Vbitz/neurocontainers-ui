import { CodeBracketIcon } from "@heroicons/react/24/outline";
import { registerGroupEditor } from "../group";
import type { ComponentType } from "react";
import type { Directive } from "@/components/common";
import { HelpSection } from "@/components/ui/HelpSection";
import javaGroupHelpMarkdown from "@/copy/help/groups/java-group.md";


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
    updateDirective({ version, type, setJavaHome }) {
        const packages: string[] = [];
        let javaHome = "";

        // Use standard package names that work across most distributions
        const javaVersion = version as string;
        const javaType = type as string;

        // Determine Java package and JAVA_HOME based on version
        if (javaVersion === "default") {
            packages.push(javaType === "jdk" ? "default-jdk" : "default-jre");
            javaHome = "/usr/lib/jvm/default-java";
        } else {
            packages.push(`openjdk-${javaVersion}-${javaType}`);
            javaHome = `/usr/lib/jvm/java-${javaVersion}-openjdk-amd64`;
        }

        const directives: Directive[] = [
            {
                install: packages,
            }
        ];

        // Set JAVA_HOME if requested
        if (setJavaHome && javaHome) {
            directives.push({
                environment: {
                    JAVA_HOME: javaHome,
                    PATH: `${javaHome}/bin:$PATH`,
                }
            });
        }

        return {
            group: directives,
            custom: "java",
        };
    },
})