# Pip Requirements Group

Creates a requirements.txt file and installs Python packages using pip. This group handles file creation and package installation in a single step.

**What this creates:**
- A file directive with your requirements.txt content
- A run directive to install packages with pip
- Optional cleanup of the requirements file

**Use cases:**
- Installing specific versions of Python packages
- Managing complex dependency lists
- Reproducible Python environments
- Installing packages with specific build flags

💡 **Tip:** Each line in requirements should be a valid pip install specification (e.g., numpy==1.21.0, scipy>=1.7.0)