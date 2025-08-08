# Java Installation

Installs Java Development Kit (JDK) or Java Runtime Environment (JRE) in your container. This group handles package installation and environment configuration for Java applications.

**What this creates:**
- Install directive for the selected Java package
- Environment variables (JAVA_HOME, PATH)

**Available options:**
- OpenJDK 8, 11, 17, 21 (LTS versions)
- Default JRE/JDK from package manager
- Choose between JDK (development) or JRE (runtime only)
- Automatic JAVA_HOME and PATH configuration

💡 **Tip:** Use OpenJDK for open-source projects. Version 17 or 21 recommended for modern applications.