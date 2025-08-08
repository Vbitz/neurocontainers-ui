# Help Documentation

This directory contains all the help documentation that was previously embedded as HTML in React components using `getHelpSection`. All content has been extracted and converted to clean Markdown format for better accessibility and reuse.

## Directory Structure

### `/directives/` (13 files)
Individual directive help documentation:
- `boutique-directive.md` - Boutiques tool descriptor integration
- `copy-directive.md` - File copying instructions
- `deploy-directive.md` - Deployment path configuration
- `environment-directive.md` - Environment variables setup
- `file-directive.md` - File handling and sources
- `include-directive.md` - Including predefined macros
- `install-directive.md` - Package installation with search shortcuts
- `run-command-directive.md` - Shell commands with Jinja2 templating
- `template-directive.md` - Template usage and parameters
- `test-directive.md` - Container testing configuration
- `user-directive.md` - User management and security
- `variable-directive.md` - Variable types and JSON configuration
- `workdir-directive.md` - Working directory best practices

### `/groups/` (4 files)
Pre-configured directive groups for common scenarios:
- `java-group.md` - Java JDK/JRE installation
- `miniconda-yaml-group.md` - Python environment from YAML
- `pip-requirements-group.md` - Python packages from requirements.txt
- `shell-script-group.md` - Shell script creation and deployment

### `/metadata/` (5 files)
Container metadata configuration:
- `basic-information.md` - Name, version, and icon guidelines
- `container-categories.md` - Category selection help
- `documentation.md` - Documentation options (structured, content, URL)
- `license-information.md` - SPDX and custom license setup
- `target-architectures.md` - Architecture selection (x86_64, aarch64)

### `/ui/` (4 files)
User interface component help:
- `base-image-selector.md` - Base image selection guidelines
- `directives-list.md` - Managing directive order and organization
- `icon-editor.md` - Container icon upload and generation
- `package-manager.md` - Package manager selection (APT vs YUM)

## Usage

These Markdown files can be:
- Integrated into documentation systems
- Consumed by help tooltips or modals
- Used in knowledge bases
- Referenced for user training
- Converted to other formats (HTML, PDF, etc.)

## Content Quality

All files maintain:
- Clean Markdown formatting
- Proper heading hierarchy
- Consistent code block formatting
- Preserved examples and tips
- Descriptive filenames in kebab-case