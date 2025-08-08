# Miniconda Environment Group

Installs Miniconda and creates a conda environment from a YAML specification file. This group combines Miniconda installation with environment creation in a streamlined workflow.

**What this creates:**
- A file directive with your environment.yml content
- A template directive to install Miniconda
- A run directive to create the environment from YAML
- Environment configuration to activate the environment

**Use cases:**
- Complex scientific computing environments
- Reproducible data science workflows
- Multi-package neuroimaging toolkits
- Version-controlled environment specifications

💡 **Tip:** Your YAML should follow conda environment format with name, dependencies, and optional pip sections