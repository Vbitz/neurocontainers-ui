import { processYamlGroup, YamlGroup } from "@/lib/yamlGroupEditor";
import { interpolateTemplate } from "@/lib/yamlGroupEditor/templateInterpolator";
import { evaluateCondition } from "@/lib/yamlGroupEditor/conditionEvaluator";

describe('YAML Group Editor', () => {
    const javaGroupDefinition: YamlGroup = {
        metadata: {
            key: "java",
            label: "Java",
            description: "Install Java Development Kit (JDK)",
            icon: "CodeBracket",
            color: "orange",
            helpContent: "",
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
                    PATH: "{{ local.javaHome }}/bin:$PATH",
                },
                condition: "local.setJavaHome",
            }
        ],
    };

    describe('template interpolation', () => {
        it('should interpolate simple variables', () => {
            // Test case: {{ local.type }} should become "jdk"
            const template = "default-{{ local.type }}";
            const context = { type: "jdk" };
            const result = interpolateTemplate(template, context);
            
            expect(result).toBe("default-jdk");
        });

        it('should interpolate complex paths', () => {
            // Test case: {{ local.javaHome }}/bin:$PATH
            const template = "{{ local.javaHome }}/bin:$PATH";
            const context = { javaHome: "/usr/lib/jvm/java-17-openjdk-amd64" };
            const result = interpolateTemplate(template, context);
            
            expect(result).toBe("/usr/lib/jvm/java-17-openjdk-amd64/bin:$PATH");
        });

        it('should handle array templates', () => {
            // Test case: ["openjdk-{{ local.version }}-{{ local.type }}"]
            const template = ["openjdk-{{ local.version }}-{{ local.type }}"];
            const context = { version: "17", type: "jdk" };
            const result = interpolateTemplate(template, context);
            
            expect(result).toEqual(["openjdk-17-jdk"]);
        });

        it('should handle object templates', () => {
            const template = {
                JAVA_HOME: "{{ local.javaHome }}",
                PATH: "{{ local.javaHome }}/bin:$PATH"
            };
            const context = { javaHome: "/usr/lib/jvm/default-java" };
            const result = interpolateTemplate(template, context);
            
            expect(result).toEqual({
                JAVA_HOME: "/usr/lib/jvm/default-java",
                PATH: "/usr/lib/jvm/default-java/bin:$PATH"
            });
        });
    });

    describe('condition evaluation', () => {
        it('should evaluate equality conditions', () => {
            // Test case: version == "default"
            const condition = 'version == "default"';
            const args1 = { version: "default" };
            const args2 = { version: "17" };
            
            expect(evaluateCondition(condition, args1)).toBe(true);
            expect(evaluateCondition(condition, args2)).toBe(false);
        });

        it('should evaluate inequality conditions', () => {
            // Test case: version != "default"
            const condition = 'version != "default"';
            const args1 = { version: "17" };
            const args2 = { version: "default" };
            
            expect(evaluateCondition(condition, args1)).toBe(true);
            expect(evaluateCondition(condition, args2)).toBe(false);
        });

        it('should evaluate boolean conditions', () => {
            // Test case: local.setJavaHome
            const condition = 'local.setJavaHome';
            const context1 = { setJavaHome: true };
            const context2 = { setJavaHome: false };
            
            expect(evaluateCondition(condition, context1)).toBe(true);
            expect(evaluateCondition(condition, context2)).toBe(false);
        });

        it('should handle empty conditions as true', () => {
            expect(evaluateCondition('', {})).toBe(true);
            expect(evaluateCondition('   ', {})).toBe(true);
        });

        it('should handle complex expressions with parentheses', () => {
            const condition = '(version == "default" || version == "8") && local.setJavaHome';
            const context1 = { version: "default", setJavaHome: true };
            const context2 = { version: "8", setJavaHome: true };
            const context3 = { version: "17", setJavaHome: true };
            const context4 = { version: "default", setJavaHome: false };
            
            expect(evaluateCondition(condition, context1)).toBe(true);
            expect(evaluateCondition(condition, context2)).toBe(true);
            expect(evaluateCondition(condition, context3)).toBe(false);
            expect(evaluateCondition(condition, context4)).toBe(false);
        });

        it('should handle negation operator', () => {
            const condition = '!local.setJavaHome';
            const context1 = { setJavaHome: true };
            const context2 = { setJavaHome: false };
            
            expect(evaluateCondition(condition, context1)).toBe(false);
            expect(evaluateCondition(condition, context2)).toBe(true);
        });

        it('should handle boolean literals', () => {
            expect(evaluateCondition('true', {})).toBe(true);
            expect(evaluateCondition('false', {})).toBe(false);
            expect(evaluateCondition('true && false', {})).toBe(false);
            expect(evaluateCondition('true || false', {})).toBe(true);
        });

        it('should handle string comparisons', () => {
            const condition = 'version == "default"';
            const context1 = { version: "default" };
            const context2 = { version: "17" };
            
            expect(evaluateCondition(condition, context1)).toBe(true);
            expect(evaluateCondition(condition, context2)).toBe(false);
        });

        it('should handle operator precedence correctly', () => {
            // AND has higher precedence than OR
            const condition = 'false || true && false';
            // Should be evaluated as: false || (true && false) = false || false = false
            expect(evaluateCondition(condition, {})).toBe(false);
            
            const condition2 = 'true && false || true';
            // Should be evaluated as: (true && false) || true = false || true = true
            expect(evaluateCondition(condition2, {})).toBe(true);
        });
    });

    describe('directive generation', () => {
        it('should generate correct directives for default Java version', () => {
            const args = { version: "default", type: "jdk", setJavaHome: true };
            const result = processYamlGroup(javaGroupDefinition, args);
            
            // Expected directives:
            // 1. install: ["default-jdk"]
            // 2. environment: { JAVA_HOME: "/usr/lib/jvm/default-java", PATH: "/usr/lib/jvm/default-java/bin:$PATH" }
            
            expect(result).toHaveLength(2);
            
            // Check install directive
            const installDirective = result.find(d => 'install' in d);
            expect(installDirective).toBeDefined();
            expect(installDirective?.install).toEqual("default-jdk");
            
            // Check environment directive
            const envDirective = result.find(d => 'environment' in d);
            expect(envDirective).toBeDefined();
            expect(envDirective?.environment).toEqual({
                JAVA_HOME: "/usr/lib/jvm/default-java",
                PATH: "/usr/lib/jvm/default-java/bin:$PATH"
            });
        });

        it('should generate correct directives for specific Java version', () => {
            const args = { version: "17", type: "jre", setJavaHome: false };
            const result = processYamlGroup(javaGroupDefinition, args);
            
            // Expected directives:
            // 1. install: ["openjdk-17-jre"]
            // 2. No environment directive (setJavaHome is false)
            
            expect(result).toHaveLength(1);
            
            // Check install directive
            const installDirective = result.find(d => 'install' in d);
            expect(installDirective).toBeDefined();
            expect(installDirective?.install).toEqual("openjdk-17-jre");
            
            // Should not have environment directive
            const envDirective = result.find(d => 'environment' in d);
            expect(envDirective).toBeUndefined();
        });

        it('should filter directives based on conditions', () => {
            const args = { version: "11", type: "jdk", setJavaHome: false };
            const result = processYamlGroup(javaGroupDefinition, args);
            
            // Should not include environment directive because setJavaHome is false
            // Should use the version != "default" variable set
            
            expect(result).toHaveLength(1);
            
            const installDirective = result.find(d => 'install' in d);
            expect(installDirective).toBeDefined();
            expect(installDirective?.install).toEqual("openjdk-11-jdk");
        });

        it('should handle all directives with proper variable context', () => {
            const args = { version: "21", type: "jdk", setJavaHome: true };
            const result = processYamlGroup(javaGroupDefinition, args);
            
            expect(result).toHaveLength(2);
            
            // Verify the install directive uses interpolated values
            const installDirective = result.find(d => 'install' in d);
            expect(installDirective?.install).toEqual("openjdk-21-jdk");
            
            // Verify the environment directive uses interpolated values  
            const envDirective = result.find(d => 'environment' in d);
            expect(envDirective?.environment).toEqual({
                JAVA_HOME: "/usr/lib/jvm/java-21-openjdk-amd64",
                PATH: "/usr/lib/jvm/java-21-openjdk-amd64/bin:$PATH"
            });
        });
    });

    describe('variable directive processing', () => {
        it('should process variable directives and build context', () => {
            // Variables directives should set local context that can be used in later directives
            const args = { version: "17", type: "jdk", setJavaHome: true };
            const result = processYamlGroup(javaGroupDefinition, args);
            
            // The second variables directive should set:
            // javaHome: "/usr/lib/jvm/java-17-openjdk-amd64"
            // javaPackages: ["openjdk-17-jdk"]
            
            // Verify that the install directive got the correct interpolated value
            const installDirective = result.find(d => 'install' in d);
            expect(installDirective?.install).toEqual("openjdk-17-jdk");
            
            // Verify that the environment directive got the correct interpolated value
            const envDirective = result.find(d => 'environment' in d);
            expect(envDirective?.environment?.JAVA_HOME).toEqual("/usr/lib/jvm/java-17-openjdk-amd64");
        });

        it('should handle conditional variable directives', () => {
            // Only one of the two variable directives should be processed based on condition
            const args1 = { version: "default", type: "jre", setJavaHome: true };
            const args2 = { version: "11", type: "jdk", setJavaHome: true };
            
            const result1 = processYamlGroup(javaGroupDefinition, args1);
            const result2 = processYamlGroup(javaGroupDefinition, args2);
            
            // For args1: should use first variables directive (default Java)
            const install1 = result1.find(d => 'install' in d);
            expect(install1?.install).toEqual("default-jre");
            
            const env1 = result1.find(d => 'environment' in d);
            expect(env1?.environment?.JAVA_HOME).toEqual("/usr/lib/jvm/default-java");
            
            // For args2: should use second variables directive (specific version)
            const install2 = result2.find(d => 'install' in d);
            expect(install2?.install).toEqual("openjdk-11-jdk");
            
            const env2 = result2.find(d => 'environment' in d);
            expect(env2?.environment?.JAVA_HOME).toEqual("/usr/lib/jvm/java-11-openjdk-amd64");
        });
    });
});