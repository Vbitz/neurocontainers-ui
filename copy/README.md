# Copy Directory

This directory contains all content and documentation that has been extracted from the NeuroContainers UI codebase and converted to Markdown format for better accessibility, reuse, and maintenance.

## Directory Structure

### `/help/` - User Help Documentation
Contains all help content that was previously embedded as HTML in React components using `getHelpSection`. This content provides detailed explanations and guidance for using various features of the NeuroContainers UI.

**Subdirectories:**
- `directives/` - Help for individual container directives (13 files)
- `groups/` - Help for pre-configured directive groups (4 files)  
- `metadata/` - Help for container metadata configuration (5 files)
- `ui/` - Help for UI components and features (4 files)

### `/templates/` - Container Templates
Contains template descriptions used in the guided tour system to help users understand and choose appropriate starting points for their container projects.

**Files:**
- `python-package.md` - For containerizing Python packages from GitHub
- `start-from-scratch.md` - For custom container creation with full control

## Usage

This organized content can be:
- **Integrated into documentation systems** (GitBook, Docusaurus, etc.)
- **Consumed by help systems** (tooltips, modals, knowledge bases)
- **Used for training materials** (user guides, tutorials)
- **Converted to other formats** (HTML, PDF, presentations)
- **Referenced by support teams** (troubleshooting, user assistance)

## Content Quality

All files maintain:
- ✅ **Clean Markdown formatting** with proper syntax
- ✅ **Consistent structure** with logical heading hierarchy
- ✅ **Preserved examples** including code blocks and tips
- ✅ **Descriptive filenames** using kebab-case for web compatibility
- ✅ **Complete documentation** with detailed README files

## Maintenance

When updating the source React components:
1. Extract any new help content following the same conversion process
2. Update the corresponding Markdown files in this directory
3. Maintain the organized directory structure
4. Update README files as needed

This approach ensures that help content remains accessible and can be easily maintained independently of the UI implementation.